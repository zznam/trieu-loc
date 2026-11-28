import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "#/components/PageHeader";
import { getNews } from "#/lib/content";
import { STORY_PREFIX } from "#/lib/contribute";
import { formatDate, type Lang, readingTimeLabel, t } from "#/lib/i18n";
import { groupByYear } from "#/lib/listing";
import { seo } from "#/lib/seo";
import { readingMinutes } from "#/lib/text";
import { getPublishedStories } from "#/server/published";

export const Route = createFileRoute("/$lang/news/")({
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(
			lang,
			t(lang, "news.title"),
			t(lang, "news.lead"),
			"/news",
			"news",
		);
	},
	loader: () => getPublishedStories(),
	component: NewsIndex,
});

type Entry = {
	slug: string;
	title: string;
	date: string;
	summary: string;
	minutes: number;
	byline?: string;
};

const SOURCES = ["all", "official", "community"] as const;
type Source = (typeof SOURCES)[number];

const excerpt = (s: string, n = 200) =>
	s.length > n ? `${s.slice(0, n).trimEnd()}…` : s;

function NewsIndex() {
	const lang = Route.useParams().lang as Lang;
	const stories = Route.useLoaderData();
	const entries: Entry[] = [
		...getNews(lang).map((p) => ({
			slug: p.slug,
			title: p.title,
			date: p.date,
			summary: p.summary,
			minutes: readingMinutes(p.markdown),
		})),
		...stories.map((s) => ({
			slug: `${STORY_PREFIX}${s.id}`,
			title: s.title,
			date: s.publishedAt.slice(0, 10),
			summary: excerpt(s.message.replace(/\s+/g, " ")),
			minutes: readingMinutes(s.message),
			byline: [s.name, s.village].filter(Boolean).join(" · "),
		})),
	].sort((a, b) => b.date.localeCompare(a.date));
	const [source, setSource] = useState<Source>("all");
	const shown = entries.filter(
		(e) => source === "all" || (source === "community") === Boolean(e.byline),
	);
	const years = groupByYear(shown);

	return (
		<>
			<PageHeader title={t(lang, "news.title")} lead={t(lang, "news.lead")} />
			<section className="mx-auto max-w-3xl px-4 py-12">
				{stories.length > 0 && (
					<div className="mb-4 flex flex-wrap gap-2">
						{SOURCES.map((s) => (
							<button
								key={s}
								type="button"
								aria-pressed={source === s}
								onClick={() => setSource(s)}
								className={`rounded-full px-4 py-2 text-sm font-medium transition ${
									source === s
										? "bg-rice-700 text-paper"
										: "border border-earth-300 text-ink-soft hover:bg-rice-100"
								}`}
							>
								{t(lang, `news.filter.${s}`)}
							</button>
						))}
					</div>
				)}
				{years.length > 1 && (
					<nav
						aria-label={t(lang, "news.year")}
						className="no-print mb-2 flex flex-wrap gap-x-3 text-sm"
					>
						{years.map((y) => (
							<a
								key={y.year}
								href={`#y${y.year}`}
								className="font-semibold text-earth-700 hover:underline"
							>
								{y.year}{" "}
								<span className="font-normal text-ink-soft">
									({y.items.length})
								</span>
							</a>
						))}
					</nav>
				)}
				{years.map((y) => (
					<div key={y.year}>
						{years.length > 1 && (
							<h2
								id={`y${y.year}`}
								className="mt-8 scroll-mt-24 border-b border-earth-300/50 pb-2 font-serif text-xl text-earth-700"
							>
								{y.year}
							</h2>
						)}
						<ul className="divide-y divide-earth-300/50">
							{y.items.map((post) => (
								<li key={post.slug} className="py-8">
									<p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-earth-700">
										<time dateTime={post.date}>
											{formatDate(lang, post.date)}
										</time>
										<span aria-hidden="true">·</span>
										<span className="normal-case tracking-normal">
											{readingTimeLabel(lang, post.minutes)}
										</span>
										{post.byline && (
											<span className="rounded-full bg-rice-100 px-2 py-0.5 normal-case tracking-normal text-rice-900">
												✍️ {t(lang, "news.community")}
											</span>
										)}
									</p>
									<h2 className="mt-2 text-2xl font-semibold text-rice-900">
										<Link
											to="/$lang/news/$slug"
											params={{ lang, slug: post.slug }}
											className="hover:underline"
										>
											{post.title}
										</Link>
									</h2>
									{post.byline && (
										<p className="mt-1 text-sm text-ink-soft">{post.byline}</p>
									)}
									<p className="mt-2 text-ink-soft">{post.summary}</p>
									<Link
										to="/$lang/news/$slug"
										params={{ lang, slug: post.slug }}
										className="mt-3 inline-block text-sm font-semibold text-rice-700 hover:underline"
									>
										{t(lang, "common.readMore")} →
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</section>
		</>
	);
}
