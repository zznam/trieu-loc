import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
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
	invalidateContentCache,
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
	/** False until the files have been imported into the database. */
	imported: boolean;
	items: JsonObject[];
};

export const getContentAdmin = createServerFn({ method: "GET" })
	.validator((input: unknown) => collectionInput.parse(input))
	.handler(async ({ data }): Promise<ContentAdminState> => {
		const configured = { db: isDbConfigured(), admin: isAdminConfigured() };
		const authed = isAdminRequest();
		if (!authed || !configured.db)
			return { authed, configured, imported: false, items: [] };
		const db = getDb();
		const [{ n }] = await db
			.select({ n: sql<number>`count(*)::int` })
			.from(contentItems);
		if (n === 0) {
			// Not imported yet: show what the files contain (read-only until imported).
			return {
				authed,
				configured,
				imported: false,
				items: fileContent()[data.collection] as unknown as JsonObject[],
			};
		}
		const rows = await db
			.select({ data: contentItems.data })
			.from(contentItems)
			.where(eq(contentItems.collection, data.collection));
		return {
			authed,
			configured,
			imported: true,
			items: rows.map((r) => r.data as JsonObject),
		};
	});

/** One-time import of the bundled JSON/Markdown files into the database. */
export const importContent = createServerFn({ method: "POST" }).handler(
	async () => {
		requireAdmin();
		const db = getDb();
		const [{ n }] = await db
			.select({ n: sql<number>`count(*)::int` })
			.from(contentItems);
		if (n > 0)
			return { ok: false as const, error: "already_imported" as const };
		const files = fileContent();
		const rows = COLLECTION_NAMES.flatMap((collection) =>
			(files[collection] as Record<string, unknown>[]).map((data) => ({
				collection,
				id: itemId(collection, data),
				data,
			})),
		);
		await db.insert(contentItems).values(rows);
		invalidateContentCache();
		await ensureContentFresh();
		return { ok: true as const, count: rows.length };
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
		const [{ n }] = await db
			.select({ n: sql<number>`count(*)::int` })
			.from(contentItems);
		if (n === 0) return { ok: false, error: "not_imported" };

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
