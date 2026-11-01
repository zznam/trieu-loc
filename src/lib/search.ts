import {
	businesses,
	getNews,
	getPeople,
	history,
	personCategoryLabel,
	placeCategoryLabel,
	places,
	specialties,
} from "./content";
import { eventCategoryLabel, events } from "./events";
import { type Lang, pick, t } from "./i18n";
import { fold } from "./text";

export type SearchKind =
	| "place"
	| "news"
	| "person"
	| "food"
	| "business"
	| "event"
	| "history";

export type SearchDoc = {
	kind: SearchKind;
	title: string;
	text: string;
	/** Small label shown above the title, e.g. the category. */
	meta: string;
	to: string;
	params: Record<string, string>;
	hash?: string;
};

const stripHtml = (html: string) =>
	html
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const cache = new Map<
	Lang,
	{ doc: SearchDoc; title: string; text: string }[]
>();

function buildIndex(lang: Lang) {
	const docs: SearchDoc[] = [
		...places.map((p) => ({
			kind: "place" as const,
			title: pick(lang, p.name),
			text: `${pick(lang, p.village)} · ${pick(lang, p.body)}`,
			meta: pick(lang, placeCategoryLabel[p.category]),
			to: "/$lang/places",
			params: { lang },
			hash: p.id,
		})),
		...getNews(lang).map((n) => ({
			kind: "news" as const,
			title: n.title,
			text: `${n.summary} ${stripHtml(n.html)}`,
			meta: n.date,
			to: "/$lang/news/$slug",
			params: { lang, slug: n.slug },
		})),
		...getPeople(lang).map((p) => ({
			kind: "person" as const,
			title: p.name,
			text: `${p.summary} ${p.role} · ${p.village} · ${stripHtml(p.html)}`,
			meta: pick(lang, personCategoryLabel[p.category]),
			to: "/$lang/people/$slug",
			params: { lang, slug: p.slug },
		})),
		...specialties.map((s) => ({
			kind: "food" as const,
			title: pick(lang, s.name),
			text: `${pick(lang, s.body)} · ${pick(lang, s.tag)}`,
			meta: t(lang, "food.specialties"),
			to: "/$lang/food",
			params: { lang },
			hash: s.id,
		})),
		...businesses.map((b) => ({
			kind: "business" as const,
			title: b.name,
			text: `${pick(lang, b.body)} · ${pick(lang, b.village)}`,
			meta: `${t(lang, "food.directory")} · ${pick(lang, b.category)}`,
			to: "/$lang/food",
			params: { lang },
			hash: b.id,
		})),
		...events.map((e) => ({
			kind: "event" as const,
			title: pick(lang, e.title),
			text: `${pick(lang, e.body)} · ${pick(lang, e.location)}`,
			meta: pick(lang, eventCategoryLabel[e.category]),
			to: "/$lang/events",
			params: { lang },
			hash: e.id,
		})),
		...history.timeline.map((h) => ({
			kind: "history" as const,
			title: pick(lang, h.title),
			text: pick(lang, h.body),
			meta: `${t(lang, "history.timeline")} · ${typeof h.year === "string" ? h.year : pick(lang, h.year)}`,
			to: "/$lang/history",
			params: { lang },
		})),
		...history.traditions.map((h) => ({
			kind: "history" as const,
			title: pick(lang, h.title),
			text: pick(lang, h.body),
			meta: t(lang, "history.traditions"),
			to: "/$lang/history",
			params: { lang },
			hash: "traditions",
		})),
	];
	return docs.map((doc) => ({
		doc,
		title: fold(doc.title),
		text: fold(doc.text),
	}));
}

export type SearchHit = {
	doc: SearchDoc;
	score: number;
	snippet: { before: string; match: string; after: string };
};

/** Accent-insensitive search: every word must appear in the title or text; title hits rank higher. */
export function search(lang: Lang, query: string, limit = 30): SearchHit[] {
	const terms = fold(query)
		.split(/\s+/)
		.filter((w) => w.length > 0);
	if (terms.length === 0) return [];
	let index = cache.get(lang);
	if (!index) {
		index = buildIndex(lang);
		cache.set(lang, index);
	}
	const phrase = terms.join(" ");
	const hits: SearchHit[] = [];
	for (const entry of index) {
		let score = 0;
		let ok = true;
		for (const term of terms) {
			const inTitle = entry.title.includes(term);
			const inText = entry.text.includes(term);
			if (!inTitle && !inText) {
				ok = false;
				break;
			}
			score += inTitle ? 10 : 1;
			if (inTitle && entry.title.startsWith(term)) score += 5;
		}
		if (!ok) continue;
		if (entry.title.includes(phrase)) score += 20;
		// Highlight the whole phrase when it appears, otherwise the longest word
		// (short words like "den" also match unrelated words such as "đến").
		const needle = entry.text.includes(phrase)
			? phrase
			: terms.reduce((a, b) => (b.length > a.length ? b : a));
		hits.push({
			doc: entry.doc,
			score,
			snippet: snippet(entry.doc.text, entry.text, needle),
		});
	}
	return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

function snippet(original: string, folded: string, term: string) {
	const at = folded.indexOf(term);
	if (at === -1)
		return {
			before: original.slice(0, 160),
			match: "",
			after: original.length > 160 ? "…" : "",
		};
	const from = Math.max(0, at - 60);
	const to = Math.min(original.length, at + term.length + 100);
	return {
		before: (from > 0 ? "…" : "") + original.slice(from, at),
		match: original.slice(at, at + term.length),
		after:
			original.slice(at + term.length, to) + (to < original.length ? "…" : ""),
	};
}
