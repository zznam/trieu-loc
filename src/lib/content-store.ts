import { marked } from "marked";
import {
	allNews,
	allPeople,
	type NewsPost,
	type Person,
	type Place,
	places,
} from "./content";
import type { ContentSnapshot, NewsItem, PersonItem } from "./content-schemas";
import { type EventDef, events } from "./events";
import type { Lang } from "./i18n";
import { resetSearchIndex } from "./search";
import { type Village, villages } from "./villages";

/**
 * The editable collections (places, villages, events, people, news) start out with the
 * JSON/Markdown files. Once content is imported into the database, a snapshot from the
 * database replaces them *in place*, so every module that reads these arrays sees the
 * edited content without changes.
 */

function replace<T>(target: T[], next: T[]) {
	target.splice(0, target.length, ...next);
}

const deepCopy = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// ---------- Files → snapshot items (used for the one-time import) ----------

function newsFromFiles(posts: NewsPost[]): NewsItem[] {
	const slugs = [...new Set(posts.map((p) => p.slug))];
	return slugs.map((slug) => {
		const pick = (lang: Lang) => {
			const p = posts.find((x) => x.slug === slug && x.lang === lang);
			return p
				? { title: p.title, summary: p.summary, body: p.markdown }
				: undefined;
		};
		const vi = pick("vi") ?? pick("en");
		const date = posts.find((x) => x.slug === slug)?.date ?? slug.slice(0, 10);
		return {
			slug,
			date,
			vi: vi ?? { title: slug, summary: "", body: "" },
			en: pick("en"),
		};
	});
}

function peopleFromFiles(list: Person[]): PersonItem[] {
	const slugs = [...new Set(list.map((p) => p.slug))];
	return slugs.map((slug) => {
		const any = list.find((x) => x.slug === slug) as Person;
		const pick = (lang: Lang) => {
			const p = list.find((x) => x.slug === slug && x.lang === lang);
			return p
				? {
						name: p.name,
						years: p.years,
						role: p.role,
						village: p.village,
						summary: p.summary,
						body: p.markdown,
					}
				: undefined;
		};
		const vi = pick("vi") ?? pick("en");
		return {
			slug,
			category: any.category,
			order: any.order,
			villageId: any.villageId,
			photo: any.photo || undefined,
			vi: vi ?? {
				name: slug,
				years: "",
				role: "",
				village: "",
				summary: "",
				body: "",
			},
			en: pick("en"),
		};
	});
}

/** The file content as captured at startup, before any database snapshot is applied. */
const FILES: Omit<ContentSnapshot, "version"> = deepCopy({
	places: places as ContentSnapshot["places"],
	villages: villages as ContentSnapshot["villages"],
	events: events as ContentSnapshot["events"],
	people: peopleFromFiles(allPeople),
	news: newsFromFiles(allNews),
});

export const fileContent = () => deepCopy(FILES);

// ---------- Snapshot → the arrays the site reads ----------

const md = (s: string) => marked.parse(s, { async: false });

function toPosts(items: NewsItem[]): NewsPost[] {
	return items.flatMap((n) =>
		(["vi", "en"] as const)
			.filter((lang) => n[lang])
			.map((lang) => {
				const l = n[lang] as NonNullable<NewsItem["vi"]>;
				return {
					slug: n.slug,
					lang,
					date: n.date,
					title: l.title,
					summary: l.summary,
					markdown: l.body,
					html: md(l.body),
				};
			}),
	);
}

function toPeople(items: PersonItem[]): Person[] {
	return items.flatMap((p) =>
		(["vi", "en"] as const)
			.filter((lang) => p[lang])
			.map((lang) => {
				const l = p[lang] as NonNullable<PersonItem["vi"]>;
				return {
					slug: p.slug,
					lang,
					category: p.category,
					order: p.order,
					villageId: p.villageId,
					photo: p.photo ?? "",
					name: l.name,
					years: l.years,
					role: l.role,
					village: l.village,
					summary: l.summary,
					markdown: l.body,
					html: md(l.body),
				};
			}),
	);
}

let applied = "files";

export const contentVersion = () => applied;

/** Applies a database snapshot (no-op if it's the one already applied). Pass null to go back to files. */
export function applySnapshot(snap: ContentSnapshot | null) {
	const version = snap?.version ?? "files";
	if (version === applied) return;
	// Copy so later changes to the snapshot object (e.g. a server cache) can't leak into the live content.
	const data = snap ? deepCopy(snap) : { ...fileContent(), version: "files" };
	replace(places, data.places as Place[]);
	replace(villages, data.villages as Village[]);
	replace(events, data.events as EventDef[]);
	replace(allNews, toPosts(data.news));
	replace(allPeople, toPeople(data.people));
	resetSearchIndex();
	applied = version;
}
