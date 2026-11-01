// Database queries for published community content. Server-only: import it from server
// function handlers or server routes (lazily), never from route modules at the top level,
// or the database driver ends up in the browser bundle.
import { and, desc, eq, lte, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "./db";
import { type ContributionKind, contributions } from "./schema";

/** Community content an editor has published. Text only — rendered as plain text, never HTML. */
export type PublishedItem = {
	id: number;
	kind: ContributionKind;
	title: string;
	message: string;
	name: string;
	village: string | null;
	villageId: string | null;
	lang: string;
	publishedAt: string;
	eventDate: string | null;
	eventDays: number;
	eventLocation: string | null;
	businessCategory: string | null;
	businessPhone: string | null;
};

const columns = {
	id: contributions.id,
	kind: contributions.kind,
	title: contributions.title,
	message: contributions.message,
	name: contributions.name,
	village: contributions.village,
	villageId: contributions.villageId,
	lang: contributions.lang,
	publishedAt: contributions.publishedAt,
	eventDate: contributions.eventDate,
	eventDays: contributions.eventDays,
	eventLocation: contributions.eventLocation,
	businessCategory: contributions.businessCategory,
	businessPhone: contributions.businessPhone,
};

const live = (kind: ContributionKind) =>
	and(
		eq(contributions.kind, kind),
		eq(contributions.status, "approved"),
		eq(contributions.consent, true),
		// Scheduled items (publishedAt in the future) stay hidden until their time.
		lte(contributions.publishedAt, sql`now()`),
	);

type Row = Omit<PublishedItem, "publishedAt"> & { publishedAt: Date | null };
const toItem = (r: Row): PublishedItem => ({
	...r,
	publishedAt: (r.publishedAt ?? new Date()).toISOString(),
});

export async function listPublished(
	kind: ContributionKind,
	limit: number,
): Promise<PublishedItem[]> {
	if (!isDbConfigured()) return [];
	try {
		const rows = await getDb()
			.select(columns)
			.from(contributions)
			.where(live(kind))
			.orderBy(desc(contributions.publishedAt))
			.limit(limit);
		return rows.map(toItem);
	} catch (err) {
		// The public site must keep working even if the database is unreachable.
		console.error(`published ${kind} query failed`, err);
		return [];
	}
}

export async function findPublishedStory(
	id: number,
): Promise<PublishedItem | null> {
	if (!isDbConfigured()) return null;
	try {
		const [row] = await getDb()
			.select(columns)
			.from(contributions)
			.where(and(eq(contributions.id, id), live("story")));
		return row ? toItem(row) : null;
	} catch (err) {
		console.error("findPublishedStory failed", err);
		return null;
	}
}
