import { marked } from "marked";
import {
	allNews,
	allPeople,
	type Business,
	businesses,
	type Contact,
	contacts,
	type GalleryItem,
	gallery,
	type History,
	history,
	type NewsPost,
	type Person,
	type Place,
	places,
	type Site,
	type Specialty,
	site,
	specialties,
} from "./content";
import type {
	CollectionName,
	ContentData,
	ContentSnapshot,
	NewsItem,
	PersonItem,
} from "./content-schemas";
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

/** Replaces all keys of a singleton object in place. */
function replaceObject(target: object, next: object) {
	for (const k of Object.keys(target))
		delete (target as Record<string, unknown>)[k];
	Object.assign(target, next);
}

const withId = <T extends object>(o: T) => ({ id: "main" as const, ...o });
const withoutId = <T extends { id?: string }>({ id: _id, ...rest }: T) => rest;

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
const FILES: ContentData = deepCopy({
	places: places as ContentData["places"],
	villages: villages as ContentData["villages"],
	events: events as ContentData["events"],
	people: peopleFromFiles(allPeople),
	news: newsFromFiles(allNews),
	specialties: specialties as ContentData["specialties"],
	businesses: businesses as ContentData["businesses"],
	gallery: gallery as ContentData["gallery"],
	contacts: contacts as ContentData["contacts"],
	site: [withId(site)] as ContentData["site"],
	// The editor always uses bilingual years; the files sometimes use a plain string ("248").
	history: [
		withId({
			...history,
			timeline: history.timeline.map((t) => ({
				...t,
				year: typeof t.year === "string" ? { vi: t.year, en: t.year } : t.year,
			})),
		}),
	] as ContentData["history"],
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
	const db = snap ? deepCopy(snap) : null;
	const files = fileContent();
	// Collections not imported yet keep using the files.
	const pick = <K extends CollectionName>(k: K): ContentData[K] =>
		(db?.imported.includes(k) ? (db[k] ?? []) : files[k]) as ContentData[K];

	replace(places, pick("places") as Place[]);
	replace(villages, pick("villages") as Village[]);
	replace(events, pick("events") as EventDef[]);
	replace(allNews, toPosts(pick("news")));
	replace(allPeople, toPeople(pick("people")));
	replace(specialties, pick("specialties") as Specialty[]);
	replace(businesses, pick("businesses") as Business[]);
	replace(gallery, pick("gallery") as GalleryItem[]);
	replace(contacts, pick("contacts") as Contact[]);
	const siteItem = pick("site")[0] ?? files.site[0];
	replaceObject(site, withoutId(siteItem) as Site);
	const historyItem = pick("history")[0] ?? files.history[0];
	replaceObject(history, withoutId(historyItem) as History);
	resetSearchIndex();
	applied = version;
}
