import type { Person, Site } from "./content";
import type { Occurrence } from "./events";
import { type Lang, pick } from "./i18n";
import { toISO } from "./lunar";
import { SITE_URL } from "./seo";

/**
 * schema.org JSON-LD for search engines (rich results: site search box, breadcrumbs,
 * articles, events). Pure builders; <JsonLd> renders them.
 */

type Ld = Record<string, unknown>;
const ctx = { "@context": "https://schema.org" };
const abs = (path: string) =>
	/^https?:\/\//.test(path) ? path : `${SITE_URL}${path}`;

/** Home page: the site (with a search action) and the commune as a place. */
export function websiteLd(lang: Lang, site: Site): Ld[] {
	const name = pick(lang, site.name);
	return [
		{
			...ctx,
			"@type": "WebSite",
			name,
			url: `${SITE_URL}/${lang}`,
			inLanguage: lang,
			potentialAction: {
				"@type": "SearchAction",
				target: {
					"@type": "EntryPoint",
					urlTemplate: `${SITE_URL}/${lang}/search?q={search_term_string}`,
				},
				"query-input": "required name=search_term_string",
			},
		},
		{
			...ctx,
			"@type": "Place",
			name,
			address: {
				"@type": "PostalAddress",
				addressLocality: name,
				addressRegion: pick(lang, site.province),
				addressCountry: "VN",
			},
			geo: {
				"@type": "GeoCoordinates",
				latitude: site.center[0],
				longitude: site.center[1],
			},
			...(site.contact.email ? { email: site.contact.email } : {}),
		},
	];
}

export function articleLd(a: {
	lang: Lang;
	path: string;
	title: string;
	summary: string;
	date: string;
	author?: string;
	publisher: string;
}): Ld {
	return {
		...ctx,
		"@type": "NewsArticle",
		headline: a.title.slice(0, 110),
		description: a.summary,
		datePublished: a.date,
		inLanguage: a.lang,
		mainEntityOfPage: abs(a.path),
		image: [abs(`/og/news-${a.lang}.jpg`)],
		author: a.author
			? { "@type": "Person", name: a.author }
			: { "@type": "Organization", name: a.publisher },
		publisher: { "@type": "Organization", name: a.publisher },
	};
}

export function personLd(p: Person, path: string): Ld {
	return {
		...ctx,
		"@type": "Person",
		name: p.name,
		description: p.summary || undefined,
		jobTitle: p.role || undefined,
		homeLocation: p.village ? { "@type": "Place", name: p.village } : undefined,
		image: p.photo ? abs(p.photo) : undefined,
		url: abs(path),
	};
}

export function eventsLd(lang: Lang, list: Occurrence[], path: string): Ld[] {
	return list.map((o) => ({
		...ctx,
		"@type": "Event",
		name: pick(lang, o.event.title),
		description: pick(lang, o.event.body),
		startDate: toISO(o.start),
		endDate: toISO(o.end),
		eventStatus: "https://schema.org/EventScheduled",
		eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
		location: {
			"@type": "Place",
			name: pick(lang, o.event.location) || "Triệu Lộc",
			address: {
				"@type": "PostalAddress",
				addressRegion: "Thanh Hoá",
				addressCountry: "VN",
			},
		},
		url: abs(`${path}#${o.event.id}`),
	}));
}

export type Crumb = { name: string; path: string };

export function breadcrumbLd(crumbs: Crumb[]): Ld {
	return {
		...ctx,
		"@type": "BreadcrumbList",
		itemListElement: crumbs.map((c, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: c.name,
			item: abs(c.path),
		})),
	};
}

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export const ldJson = (data: Ld | Ld[]) =>
	JSON.stringify(data)
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e")
		.replace(/&/g, "\\u0026");
