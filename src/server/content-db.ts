// Server-only content queries. Import from server-function handlers or lazily from server
// routes — never at the top of a route module (it would pull the DB driver into the browser).
import { count, max } from "drizzle-orm";
import { COLLECTION_NAMES, type ContentSnapshot } from "#/lib/content-schemas";
import { applySnapshot } from "#/lib/content-store";
import { getDb, isDbConfigured } from "./db";
import { contentItems } from "./schema";

const TTL = 30_000;
let cache: { at: number; snap: ContentSnapshot | null } | null = null;

export function invalidateContentCache() {
	cache = null;
}

async function loadSnapshot(): Promise<ContentSnapshot | null> {
	const db = getDb();
	const [{ n, latest }] = await db
		.select({ n: count(), latest: max(contentItems.updatedAt) })
		.from(contentItems);
	if (n === 0) return null; // not imported yet → the site keeps using the files
	const rows = await db.select().from(contentItems);
	const snap = {
		version: `${n}-${latest?.toISOString() ?? ""}`,
		places: [],
		villages: [],
		events: [],
		people: [],
		news: [],
	} as ContentSnapshot;
	for (const r of rows) {
		if ((COLLECTION_NAMES as string[]).includes(r.collection)) {
			(
				snap[
					r.collection as keyof Omit<ContentSnapshot, "version">
				] as unknown[]
			).push(r.data);
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
