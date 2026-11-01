import { marked } from "marked";
import businessesData from "#/content/businesses.json";
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
};

export type Specialty = { id: string; name: L; tag: L; body: L };
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

export const site = siteData as typeof siteData & { center: [number, number] };
export const history = historyData as {
	intro: L;
	timeline: { year: string | L; title: L; body: L }[];
	figure: { quote: L; body: L };
	traditions: { title: L; body: L }[];
};
export const places = placesData as Place[];
export const specialties = foodData as Specialty[];
export const businesses = businessesData as Business[];
export const gallery = galleryData as GalleryItem[];

export const placeCategoryLabel: Record<PlaceCategory, L> = {
	relic: { vi: "Di tích", en: "Heritage" },
	nature: { vi: "Thiên nhiên", en: "Nature" },
	public: { vi: "Công cộng", en: "Public" },
};

// ---------- News (Markdown files: src/content/news/<slug>.<lang>.md) ----------

export type NewsPost = {
	slug: string;
	lang: Lang;
	title: string;
	date: string;
	summary: string;
	html: string;
};

const rawNews = import.meta.glob("../content/news/*.md", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

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

const allNews: NewsPost[] = Object.entries(rawNews)
	.map(([path, raw]) => {
		const file = path.split("/").pop() ?? "";
		const m = /^(.+)\.(vi|en)\.md$/.exec(file);
		if (!m) return null;
		const { data, body } = parseFrontmatter(raw);
		return {
			slug: m[1],
			lang: m[2] as Lang,
			title: data.title ?? m[1],
			date: data.date ?? m[1].slice(0, 10),
			summary: data.summary ?? "",
			html: marked.parse(body, { async: false }),
		} satisfies NewsPost;
	})
	.filter((p): p is NewsPost => p !== null)
	.sort((a, b) => b.date.localeCompare(a.date));

/** Posts for a language; falls back to the Vietnamese version when a translation is missing. */
export function getNews(lang: Lang): NewsPost[] {
	const slugs = [...new Set(allNews.map((p) => p.slug))];
	return slugs
		.map((slug) => getPost(lang, slug))
		.filter((p): p is NewsPost => p !== undefined)
		.sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(lang: Lang, slug: string): NewsPost | undefined {
	return (
		allNews.find((p) => p.slug === slug && p.lang === lang) ??
		allNews.find((p) => p.slug === slug && p.lang === "vi")
	);
}
