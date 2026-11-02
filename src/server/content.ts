import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
	COLLECTION_NAMES,
	COLLECTIONS,
	type CollectionName,
	type ContentSnapshot,
	itemId,
	type JsonObject,
} from "#/lib/content-schemas";
import { fileContent } from "#/lib/content-store";
import {
	audit,
	isAdminConfigured,
	isAdminRequest,
	requireAdmin,
	requireOwner,
} from "./auth";
import {
	ensureContentFresh,
	getSnapshotCached,
	importedCollections,
	invalidateContentCache,
	META,
} from "./content-db";
import { getDb, isDbConfigured } from "./db";
import {
	deleteImages,
	imageUploadsAvailable,
	imageUrlsIn,
	listManagedImages,
	storeImage,
} from "./images";
import { contentItems } from "./schema";

/** Public: the current content snapshot (null = use the bundled files). */
export const getContentSnapshot = createServerFn({ method: "GET" }).handler(
	async (): Promise<ContentSnapshot | null> => {
		const snap = await getSnapshotCached();
		await ensureContentFresh(); // keep this instance's own arrays in sync for SSR
		return snap;
	},
);

// ---------- Admin ----------

const collectionInput = z.object({
	collection: z.enum(COLLECTION_NAMES as [CollectionName, ...CollectionName[]]),
});

export type ContentAdminState = {
	authed: boolean;
	configured: { db: boolean; admin: boolean };
	/** Whether this collection lives in the database (false = still the bundled files, read-only). */
	imported: boolean;
	/** Collections still waiting for their one-time import. */
	missing: CollectionName[];
	/** Whether photo uploads work (Vercel Blob, or LOCAL_UPLOADS=1). */
	uploads: boolean;
	items: JsonObject[];
};

export const getContentAdmin = createServerFn({ method: "GET" })
	.validator((input: unknown) => collectionInput.parse(input))
	.handler(async ({ data }): Promise<ContentAdminState> => {
		const configured = { db: isDbConfigured(), admin: isAdminConfigured() };
		const authed = await isAdminRequest();
		if (!authed || !configured.db)
			return {
				authed,
				configured,
				imported: false,
				missing: [],
				uploads: false,
				items: [],
			};
		const imported = await importedCollections();
		const missing = COLLECTION_NAMES.filter((c) => !imported.includes(c));
		if (!imported.includes(data.collection)) {
			// Not imported yet: show what the files contain (read-only until imported).
			return {
				authed,
				configured,
				imported: false,
				missing,
				uploads: imageUploadsAvailable(),
				items: fileContent()[data.collection] as unknown as JsonObject[],
			};
		}
		const rows = await getDb()
			.select({ data: contentItems.data })
			.from(contentItems)
			.where(eq(contentItems.collection, data.collection));
		return {
			authed,
			configured,
			imported: true,
			missing,
			uploads: imageUploadsAvailable(),
			items: rows.map((r) => r.data as JsonObject),
		};
	});

/**
 * One-time import of the bundled files into the database, for every collection that isn't
 * there yet. Collections already imported (and edited) are never touched.
 */
export const importContent = createServerFn({ method: "POST" }).handler(
	async () => {
		const me = await requireOwner();
		await audit(me, "content_import");
		const db = getDb();
		const imported = await importedCollections();
		const todo = COLLECTION_NAMES.filter((c) => !imported.includes(c));
		if (todo.length === 0)
			return { ok: false as const, error: "already_imported" as const };
		const files = fileContent();
		const rows = todo.flatMap((collection) => [
			// Marker so the collection counts as imported even if all its items are later deleted.
			{
				collection: META,
				id: collection,
				data: { importedAt: new Date().toISOString() },
			},
			...(files[collection] as Record<string, unknown>[]).map((data) => ({
				collection,
				id: itemId(collection, data),
				data,
			})),
		]);
		// Legacy imports (before markers existed) get their marker too.
		const legacy = imported.map((collection) => ({
			collection: META,
			id: collection,
			data: { importedAt: "legacy" },
		}));
		await db
			.insert(contentItems)
			.values([...rows, ...legacy])
			.onConflictDoNothing();
		invalidateContentCache();
		await ensureContentFresh();
		return {
			ok: true as const,
			count: rows.length - todo.length,
			collections: todo,
		};
	},
);

export type SaveResult =
	| { ok: true }
	| {
			ok: false;
			error: "not_imported" | "duplicate" | "invalid";
			issues?: string[];
	  };

export const saveContentItem = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		collectionInput
			.extend({ previousId: z.string().max(120).optional(), data: z.unknown() })
			.parse(input),
	)
	.handler(async ({ data }): Promise<SaveResult> => {
		const me = await requireAdmin();
		const parsed = COLLECTIONS[data.collection].safeParse(data.data);
		if (!parsed.success) {
			return {
				ok: false,
				error: "invalid",
				issues: parsed.error.issues.map(
					(i) => `${i.path.join(".")}: ${i.message}`,
				),
			};
		}
		const item = parsed.data as Record<string, unknown>;
		const id = itemId(data.collection, item);
		await audit(
			me,
			data.previousId ? "content_edit" : "content_create",
			`${data.collection}/${id}`,
		);
		const db = getDb();
		if (!(await importedCollections()).includes(data.collection)) {
			return { ok: false, error: "not_imported" };
		}

		const renamed = data.previousId !== undefined && data.previousId !== id;
		if (data.previousId === undefined || renamed) {
			const [clash] = await db
				.select({ id: contentItems.id })
				.from(contentItems)
				.where(
					and(
						eq(contentItems.collection, data.collection),
						eq(contentItems.id, id),
					),
				);
			if (clash) return { ok: false, error: "duplicate" };
		}
		const before = data.previousId
			? await itemData(data.collection, data.previousId)
			: null;
		await db.transaction(async (tx) => {
			if (renamed && data.previousId) {
				await tx
					.delete(contentItems)
					.where(
						and(
							eq(contentItems.collection, data.collection),
							eq(contentItems.id, data.previousId),
						),
					);
			}
			await tx
				.insert(contentItems)
				.values({
					collection: data.collection,
					id,
					data: item,
					updatedAt: new Date(),
				})
				.onConflictDoUpdate({
					target: [contentItems.collection, contentItems.id],
					set: { data: item, updatedAt: new Date() },
				});
		});
		await removeOrphanedImages(
			imageUrlsIn(before).filter((u) => !imageUrlsIn(item).includes(u)),
		);
		invalidateContentCache();
		await ensureContentFresh();
		return { ok: true };
	});

export const deleteContentItem = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		collectionInput.extend({ id: z.string().max(120) }).parse(input),
	)
	.handler(async ({ data }) => {
		const me = await requireAdmin();
		await audit(me, "content_delete", `${data.collection}/${data.id}`);
		const before = await itemData(data.collection, data.id);
		await getDb()
			.delete(contentItems)
			.where(
				and(
					eq(contentItems.collection, data.collection),
					eq(contentItems.id, data.id),
				),
			);
		await removeOrphanedImages(imageUrlsIn(before));
		invalidateContentCache();
		await ensureContentFresh();
		return { ok: true as const };
	});

// ---------- Images ----------

async function itemData(collection: string, id: string) {
	const [row] = await getDb()
		.select({ data: contentItems.data })
		.from(contentItems)
		.where(
			and(eq(contentItems.collection, collection), eq(contentItems.id, id)),
		);
	return row?.data ?? null;
}

/** Every managed image URL still used by any content item. */
async function referencedImages() {
	const rows = await getDb()
		.select({ data: contentItems.data })
		.from(contentItems);
	return new Set(rows.flatMap((r) => imageUrlsIn(r.data)));
}

/** Deletes images that no content item references any more (they may be shared between items). */
async function removeOrphanedImages(candidates: string[]) {
	if (candidates.length === 0) return;
	try {
		const used = await referencedImages();
		await deleteImages(candidates.filter((u) => !used.has(u)));
	} catch (err) {
		console.error("image clean-up failed (content was saved)", err);
	}
}

export type UploadResult =
	| { ok: true; url: string }
	| { ok: false; error: "unavailable" | "invalid" | "too_large" };

const MAX_IMAGE = 2 * 1024 * 1024;

export const uploadContentImage = createServerFn({ method: "POST" })
	.validator((input: FormData) => {
		if (!(input instanceof FormData)) return { invalid: true as const };
		const file = input.get("file");
		const collection = String(input.get("collection") ?? "");
		if (
			!(file instanceof File) ||
			!(COLLECTION_NAMES as string[]).includes(collection)
		) {
			return { invalid: true as const };
		}
		return { file, collection };
	})
	.handler(async ({ data }): Promise<UploadResult> => {
		await requireAdmin();
		if ("invalid" in data) return { ok: false, error: "invalid" };
		if (!imageUploadsAvailable()) return { ok: false, error: "unavailable" };
		if (!["image/jpeg", "image/png", "image/webp"].includes(data.file.type))
			return { ok: false, error: "invalid" };
		if (data.file.size > MAX_IMAGE) return { ok: false, error: "too_large" };
		return { ok: true, url: await storeImage(data.file, data.collection) };
	});

/** Removes uploaded images that no content item uses (e.g. uploaded, then the edit was cancelled). */
export const cleanUpImages = createServerFn({ method: "POST" }).handler(
	async () => {
		const me = await requireOwner();
		await audit(me, "images_cleanup");
		const [all, used] = await Promise.all([
			listManagedImages(),
			referencedImages(),
		]);
		const unused = all.filter((u) => !used.has(u));
		await deleteImages(unused);
		return { ok: true as const, removed: unused.length };
	},
);

/** Full JSON backup of the editable content. */
export const exportContent = createServerFn({ method: "GET" }).handler(
	async () => {
		const me = await requireAdmin();
		await audit(me, "content_export");
		return (
			(await getSnapshotCached()) ?? { version: "files", ...fileContent() }
		);
	},
);
