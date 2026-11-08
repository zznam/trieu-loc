import { fold } from "./text";

/** Words per minute for a comfortable read on screen. */
const WPM = 200;

/** Estimated reading time in whole minutes (at least 1) of a plain-text or HTML body. */
export function readingMinutes(text: string): number {
	const plain = text.replace(/<[^>]+>/g, " ");
	const words = plain.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / WPM));
}

// Common short words carry no topic; ignore them when comparing posts.
const STOP = new Set(
	`va cua cho cac nhung mot la co duoc trong voi den tai tu nay khi da se nam ngay thang the tren ve
	the a an and of to in on for with at by from is are was be this that it its as or our we
	xa thon ba con nguoi`
		.split(/\s+/)
		.filter(Boolean),
);

function terms(s: string): Set<string> {
	return new Set(
		fold(s)
			.split(/[^a-z0-9]+/)
			.filter((w) => w.length > 2 && !STOP.has(w)),
	);
}

type Post = { slug: string; title: string; summary: string; date: string };

/**
 * Up to `limit` other posts most similar to `current` (shared words in title and
 * summary; the title counts double). Ties — and posts with nothing in common —
 * fall back to the newest, so the list is never empty when there are other posts.
 */
export function relatedPosts<T extends Post>(
	current: Post,
	all: T[],
	limit = 3,
): T[] {
	const cTitle = terms(current.title);
	const cAll = new Set([...cTitle, ...terms(current.summary)]);
	return all
		.filter((p) => p.slug !== current.slug)
		.map((p) => {
			const pTitle = terms(p.title);
			let score = 0;
			// A word in the other post's title scores 2, or 3 if it's in both titles.
			for (const w of pTitle) if (cAll.has(w)) score += cTitle.has(w) ? 3 : 2;
			for (const w of terms(p.summary)) if (cAll.has(w)) score += 1;
			return { p, score };
		})
		.sort((a, b) => b.score - a.score || b.p.date.localeCompare(a.p.date))
		.slice(0, limit)
		.map((x) => x.p);
}
