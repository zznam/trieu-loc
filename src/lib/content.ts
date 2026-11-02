import { marked } from "marked";
import businessesData from "#/content/businesses.json";
import contactsData from "#/content/contacts.json";
import foodData from "#/content/food.json";
import galleryData from "#/content/gallery.json";
import historyData from "#/content/history.json";
import placesData from "#/content/places.json";
import siteData from "#/content/site.json";
import type { L, Lang } from "./i18n";

export type PlaceCategory = "relic" | "nature" | "public";

export type Place = {
	id: string;
	category: PlaceCategory;
	name: L;
	village: L;
	coords: [number, number];
	approx: boolean;
	body: L;
	/** Links the place to a village page (src/content/villages.json). */
	villageId?: string;
	photo?: string;
};

export type Specialty = {
	id: string;
	name: L;
	tag: L;
	body: L;
	photo?: string;
};
export type Business = {
	id: string;
	name: string;
	category: L;
	village: L;
	phone: string;
	body: L;
};
export type GalleryItem = {
	id: string;
	caption: L;
	season: "spring" | "summer" | "autumn" | "winter";
	src: string;
};

export type Site = {
	name: L;
	province: L;
	center: [number, number];
	stats: {
		area: string;
		population: string;
		villages: string;
		distance: string;
	};
	contact: { email: string; facebook: string; address: L };
	highlights: { title: L; body: L; to: "places" | "history" | "food" }[];
};

export type History = {
	intro: L;
	timeline: { year: string | L; title: L; body: L }[];
	figure: { quote: L; body: L };
	traditions: { title: L; body: L }[];
};

// Mutable: the content store replaces these in place when the database has content.
export const site = siteData as Site;
export const history = historyData as History;
export const places = placesData as Place[];
export const specialties = foodData as Specialty[];
export const businesses = businessesData as Business[];
export const gallery = galleryData as GalleryItem[];

// ---------- Contacts (Useful info page) ----------

export type ContactGroup = "emergency" | "commune" | "schools" | "heritage";
export const CONTACT_GROUPS: ContactGroup[] = [
	"emergency",
	"commune",
	"schools",
	"heritage",
];

export type Contact = {
	id: string;
	group: ContactGroup;
	order: number;
	name: L;
	phone: string;
	address?: L;
	hours?: L;
	sample?: boolean;
};

type ContactFile = {
	group: ContactGroup;
	items: Omit<Contact, "id" | "group" | "order">[];
}[];

/** contacts.json is grouped; flatten it into items with stable ids ("commune-2"). */
export const contacts: Contact[] = (contactsData as ContactFile).flatMap((g) =>
	g.items.map((item, i) => ({
		id: `${g.group}-${i + 1}`,
		group: g.group,
		order: (i + 1) * 10,
		...item,
	})),
);

export const contactsByGroup = () =>
	CONTACT_GROUPS.map((group) => ({
		group,
		items: contacts
			.filter((c) => c.group === group)
			.sort((a, b) => a.order - b.order),
	})).filter((g) => g.items.length > 0);

export const placeCategoryLabel: Record<PlaceCategory, L> = {
	relic: { vi: "Di tích", en: "Heritage" },
	nature: { vi: "Thiên nhiên", en: "Nature" },
	public: { vi: "Công cộng", en: "Public" },
};

// ---------- Markdown collections (src/content/<collection>/<slug>.<lang>.md) ----------

type MdDoc = {
	slug: string;
	lang: Lang;
	data: Record<string, string>;
	markdown: string;
	html: string;
};

function parseFrontmatter(raw: string): {
	data: Record<string, string>;
	body: string;
} {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
	if (!match) return { data: {}, body: raw };
	const data: Record<string, string> = {};
	for (const line of match[1].split(/\r?\n/)) {
		const idx = line.indexOf(":");
		if (idx === -1) continue;
		data[line.slice(0, idx).trim()] = line
			.slice(idx + 1)
			.trim()
			.replace(/^["']|["']$/g, "");
	}
	return { data, body: match[2] };
}

function loadCollection(files: Record<string, string>): MdDoc[] {
	return Object.entries(files)
		.map(([path, raw]) => {
			const m = /^(.+)\.(vi|en)\.md$/.exec(path.split("/").pop() ?? "");
			if (!m) return null;
			const { data, body } = parseFrontmatter(raw);
			return {
				slug: m[1],
				lang: m[2] as Lang,
				data,
				markdown: body.trim(),
				html: marked.parse(body, { async: false }),
			};
		})
		.filter((d): d is MdDoc => d !== null);
}

/** Finds a doc in the requested language, falling back to Vietnamese when the translation is missing. */
function findDoc<T extends { slug: string; lang: Lang }>(
	docs: T[],
	lang: Lang,
	slug: string,
): T | undefined {
	return (
		docs.find((d) => d.slug === slug && d.lang === lang) ??
		docs.find((d) => d.slug === slug && d.lang === "vi")
	);
}

function localized<T extends { slug: string; lang: Lang }>(
	docs: T[],
	lang: Lang,
): T[] {
	return [...new Set(docs.map((d) => d.slug))]
		.map((slug) => findDoc(docs, lang, slug))
		.filter((d): d is T => d !== undefined);
}

// ---------- News ----------

export type NewsPost = {
	slug: string;
	lang: Lang;
	title: string;
	date: string;
	summary: string;
	/** Markdown source (kept for the content editor). */
	markdown: string;
	html: string;
};

/** Mutable: replaced in place by the content store when the database has content. */
export const allNews: NewsPost[] = loadCollection(
	import.meta.glob("../content/news/*.md", {
		query: "?raw",
		import: "default",
		eager: true,
	}) as Record<string, string>,
).map((d) => ({
	slug: d.slug,
	lang: d.lang,
	title: d.data.title ?? d.slug,
	date: d.data.date ?? d.slug.slice(0, 10),
	summary: d.data.summary ?? "",
	markdown: d.markdown,
	html: d.html,
}));

export function getNews(lang: Lang): NewsPost[] {
	return localized(allNews, lang).sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(lang: Lang, slug: string): NewsPost | undefined {
	return findDoc(allNews, lang, slug);
}

// ---------- People ----------

export type PersonCategory = "history" | "notable" | "diaspora";

export const personCategoryLabel: Record<PersonCategory, L> = {
	history: { vi: "Nhân vật lịch sử", en: "Historical figures" },
	notable: { vi: "Người con quê hương", en: "Notable locals" },
	diaspora: { vi: "Người con xa quê", en: "Living far from home" },
};

export type Person = {
	slug: string;
	lang: Lang;
	name: string;
	category: PersonCategory;
	/** Free text: lifespan, era or "Sinh năm 1985" */
	years: string;
	role: string;
	village: string;
	summary: string;
	photo: string;
	order: number;
	villageId?: string;
	/** Markdown source (kept for the content editor). */
	markdown: string;
	html: string;
};

/** Mutable: replaced in place by the content store when the database has content. */
export const allPeople: Person[] = loadCollection(
	import.meta.glob("../content/people/*.md", {
		query: "?raw",
		import: "default",
		eager: true,
	}) as Record<string, string>,
).map((d) => ({
	slug: d.slug,
	lang: d.lang,
	name: d.data.name ?? d.slug,
	category: (["history", "notable", "diaspora"].includes(d.data.category)
		? d.data.category
		: "notable") as PersonCategory,
	years: d.data.years ?? "",
	role: d.data.role ?? "",
	village: d.data.village ?? "",
	summary: d.data.summary ?? "",
	photo: d.data.photo ?? "",
	order: Number(d.data.order ?? 100),
	villageId: d.data.villageId || undefined,
	markdown: d.markdown,
	html: d.html,
}));

export function getPeople(lang: Lang): Person[] {
	return localized(allPeople, lang).sort(
		(a, b) => a.order - b.order || a.name.localeCompare(b.name, "vi"),
	);
}

export function getPerson(lang: Lang, slug: string): Person | undefined {
	return findDoc(allPeople, lang, slug);
}
