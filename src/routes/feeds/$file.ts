import { createFileRoute } from "@tanstack/react-router";
import { getNews } from "#/lib/content";
import { STORY_PREFIX } from "#/lib/contribute";
import { communityEvent, upcomingEvents } from "#/lib/events";
import { buildIcs, buildRss, type FeedKind, feedPath } from "#/lib/feeds";
import { isLang, type Lang, t } from "#/lib/i18n";
import { solarToLunar } from "#/lib/lunar";
import { SITE_URL } from "#/lib/seo";

async function newsFeed(lang: Lang) {
	const { listPublished } = await import("#/server/published-queries");
	const stories = await listPublished("story", 30);
	const items = [
		...getNews(lang).map((p) => ({
			title: p.title,
			url: `${SITE_URL}/${lang}/news/${p.slug}`,
			date: p.date,
			summary: p.summary,
		})),
		...stories.map((s) => ({
			title: s.title,
			url: `${SITE_URL}/${lang}/news/${STORY_PREFIX}${s.id}`,
			date: s.publishedAt,
			summary: s.message.replace(/\s+/g, " ").slice(0, 300),
		})),
	]
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, 50);
	return new Response(
		buildRss({
			lang,
			title: `${t(lang, "news.title")} · Triệu Lộc`,
			description: t(lang, "news.lead"),
			link: `${SITE_URL}/${lang}/news`,
			self: `${SITE_URL}${feedPath("news", lang)}`,
			items,
		}),
		{
			headers: {
				"Content-Type": "application/rss+xml; charset=utf-8",
				"Cache-Control": "public, max-age=900",
			},
		},
	);
}

async function eventsFeed(lang: Lang) {
	const { listPublished } = await import("#/server/published-queries");
	const extra = (await listPublished("event", 200))
		.map(communityEvent)
		.filter((e): e is NonNullable<typeof e> => e !== null);
	// Keep the last month too, so a subscriber's calendar doesn't lose a festival the day after.
	const now = new Date();
	const occurrences = upcomingEvents(
		new Date(now.getTime() - 31 * 86_400_000),
		18,
		extra,
	);
	const body = buildIcs({
		lang,
		name: `${t(lang, "events.title")} · Triệu Lộc`,
		url: `${SITE_URL}/${lang}/events`,
		occurrences,
		now,
		describe: (o) => {
			if (o.event.date.calendar !== "lunar") return "";
			const l = solarToLunar(o.start);
			return `${l.day}/${l.month}${l.leap ? ` ${t(lang, "events.leap")}` : ""} ${t(lang, "events.lunarDate")}`;
		},
	});
	return new Response(body, {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": `inline; filename="trieu-loc-${lang}.ics"`,
			"Cache-Control": "public, max-age=3600",
		},
	});
}

export const Route = createFileRoute("/feeds/$file")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const m = /^(news|events)-([a-z]{2})\.(xml|ics)$/.exec(params.file);
				const kind = m?.[1] as FeedKind | undefined;
				const lang = m?.[2] ?? "";
				// The extension must match the kind: news-vi.xml, events-vi.ics.
				if (
					!kind ||
					!isLang(lang) ||
					feedPath(kind, lang) !== `/feeds/${params.file}`
				)
					return new Response("Not found", { status: 404 });
				// Make sure edited content (if any) is what we list.
				await (await import("#/server/content-db")).ensureContentFresh();
				return kind === "news" ? newsFeed(lang) : eventsFeed(lang);
			},
		},
	},
});
