// Server-only content queries. Import from server-function handlers or lazily from server
// routes — never at the top of a route module (it would pull the DB driver into the browser).
import { count, max } from "drizzle-orm";
import {
	COLLECTION_NAMES,
	type CollectionName,
	type ContentSnapshot,
} from "#/lib/content-schemas";
import { applySnapshot } from "#/lib/content-store";
import { getDb, isDbConfigured } from "./db";
import { contentItems } from "./schema";

const TTL = 30_000;
let cache: { at: number; snap: ContentSnapshot | null } | null = null;

export function invalidateContentCache() {
	cache = null;
}

/** Marker rows (collection "_meta", id = collection name) record which collections were imported. */
export const META = "_meta";

/** Collections that live in the database: imported ones, plus legacy imports that only have rows. */
export async function importedCollections(): Promise<CollectionName[]> {
	const rows = await getDb()
		.selectDistinct({
			collection: contentItems.collection,
			id: contentItems.id,
		})
		.from(contentItems);
	const set = new Set<string>();
	for (const r of rows) set.add(r.collection === META ? r.id : r.collection);
	return COLLECTION_NAMES.filter((c) => set.has(c));
}

async function loadSnapshot(): Promise<ContentSnapshot | null> {
	const db = getDb();
	const [{ n, latest }] = await db
		.select({ n: count(), latest: max(contentItems.updatedAt) })
		.from(contentItems);
	if (n === 0) return null; // nothing imported yet → the site keeps using the files
	const rows = await db.select().from(contentItems);
	const imported = await importedCollections();
	const snap: ContentSnapshot = {
		version: `${n}-${latest?.toISOString() ?? ""}`,
		imported,
	};
	for (const c of imported) (snap as Record<string, unknown>)[c] = [];
	for (const r of rows) {
		if (
			r.collection !== META &&
			(imported as string[]).includes(r.collection)
		) {
			((snap as Record<string, unknown>)[r.collection] as unknown[]).push(
				r.data,
			);
		}
	}
	return snap;
}

/** Database snapshot, cached for 30 s per server instance. Null when the DB is unset or empty. */
export async function getSnapshotCached(): Promise<ContentSnapshot | null> {
	if (!isDbConfigured()) return null;
	if (cache && Date.now() - cache.at < TTL) return cache.snap;
	try {
		const snap = await loadSnapshot();
		cache = { at: Date.now(), snap };
		return snap;
	} catch (err) {
		console.error(
			"content snapshot failed — serving the last known content",
			err,
		);
		return cache?.snap ?? null;
	}
}

/** Makes sure this server instance's in-memory content matches the database. */
export async function ensureContentFresh() {
	applySnapshot(await getSnapshotCached());
}
