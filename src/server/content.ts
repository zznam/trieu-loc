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
import { isAdminConfigured, isAdminRequest, requireAdmin } from "./auth";
import {
	ensureContentFresh,
	getSnapshotCached,
	importedCollections,
	invalidateContentCache,
	META,
} from "./content-db";
import { getDb, isDbConfigured } from "./db";
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
	items: JsonObject[];
};

export const getContentAdmin = createServerFn({ method: "GET" })
	.validator((input: unknown) => collectionInput.parse(input))
	.handler(async ({ data }): Promise<ContentAdminState> => {
		const configured = { db: isDbConfigured(), admin: isAdminConfigured() };
		const authed = isAdminRequest();
		if (!authed || !configured.db)
			return { authed, configured, imported: false, missing: [], items: [] };
		const imported = await importedCollections();
		const missing = COLLECTION_NAMES.filter((c) => !imported.includes(c));
		if (!imported.includes(data.collection)) {
			// Not imported yet: show what the files contain (read-only until imported).
			return {
				authed,
				configured,
				imported: false,
				missing,
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
			items: rows.map((r) => r.data as JsonObject),
		};
	});

/**
 * One-time import of the bundled files into the database, for every collection that isn't
 * there yet. Collections already imported (and edited) are never touched.
 */
export const importContent = createServerFn({ method: "POST" }).handler(
	async () => {
		requireAdmin();
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
		requireAdmin();
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
		invalidateContentCache();
		await ensureContentFresh();
		return { ok: true };
	});

export const deleteContentItem = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		collectionInput.extend({ id: z.string().max(120) }).parse(input),
	)
	.handler(async ({ data }) => {
		requireAdmin();
		await getDb()
			.delete(contentItems)
			.where(
				and(
					eq(contentItems.collection, data.collection),
					eq(contentItems.id, data.id),
				),
			);
		invalidateContentCache();
		await ensureContentFresh();
		return { ok: true as const };
	});

/** Full JSON backup of the editable content. */
export const exportContent = createServerFn({ method: "GET" }).handler(
	async () => {
		requireAdmin();
		return (
			(await getSnapshotCached()) ?? { version: "files", ...fileContent() }
		);
	},
);
