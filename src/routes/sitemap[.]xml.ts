import { createFileRoute } from "@tanstack/react-router";
import { getNews, getPeople } from "#/lib/content";
import { LANGS } from "#/lib/i18n";
import { SITE_URL } from "#/lib/seo";

/** Language-neutral paths of every static page. */
const PAGES = [
	"",
	"/history",
	"/places",
	"/food",
	"/people",
	"/events",
	"/news",
	"/gallery",
	"/contribute",
];

function entry(path: string, lastmod?: string) {
	const alternates = LANGS.map(
		(l) =>
			`<xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}/${l}${path}"/>`,
	).join("");
	return LANGS.map(
		(l) =>
			`<url><loc>${SITE_URL}/${l}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}${alternates}<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/vi${path}"/></url>`,
	).join("");
}

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: () => {
				const news = getNews("vi").map((p) => entry(`/news/${p.slug}`, p.date));
				news.push(...getPeople("vi").map((p) => entry(`/people/${p.slug}`)));
				const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${PAGES.map((p) => entry(p)).join("")}${news.join("")}</urlset>`;
				return new Response(body, {
					headers: {
						"Content-Type": "application/xml; charset=utf-8",
						"Cache-Control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
