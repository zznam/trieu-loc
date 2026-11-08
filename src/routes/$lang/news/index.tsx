import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "#/components/PageHeader";
import { getNews } from "#/lib/content";
import { STORY_PREFIX } from "#/lib/contribute";
import { feedPath } from "#/lib/feeds";
import { formatDate, type Lang, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";
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
	byline?: string;
};

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
		})),
		...stories.map((s) => ({
			slug: `${STORY_PREFIX}${s.id}`,
			title: s.title,
			date: s.publishedAt.slice(0, 10),
			summary: excerpt(s.message.replace(/\s+/g, " ")),
			byline: [s.name, s.village].filter(Boolean).join(" · "),
		})),
	].sort((a, b) => b.date.localeCompare(a.date));

	return (
		<>
			<PageHeader title={t(lang, "news.title")} lead={t(lang, "news.lead")} />
			<section className="mx-auto max-w-3xl px-4 py-12">
				<p className="mb-8 text-right">
					<a
						href={feedPath("news", lang)}
						className="inline-flex items-center gap-1.5 text-sm font-semibold text-earth-700 hover:underline"
					>
						<span aria-hidden="true" className="text-orange-500">
							◉
						</span>
						{t(lang, "feed.rss")}
					</a>
				</p>
				<ul className="divide-y divide-earth-300/50">
					{entries.map((post) => (
						<li key={post.slug} className="py-8">
							<p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-earth-700">
								<time dateTime={post.date}>{formatDate(lang, post.date)}</time>
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
			</section>
		</>
	);
}
