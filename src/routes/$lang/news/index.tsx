import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "#/components/PageHeader";
import { getNews } from "#/lib/content";
import { formatDate, type Lang, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";

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
	component: NewsIndex,
});

function NewsIndex() {
	const lang = Route.useParams().lang as Lang;
	const posts = getNews(lang);
	return (
		<>
			<PageHeader title={t(lang, "news.title")} lead={t(lang, "news.lead")} />
			<section className="mx-auto max-w-3xl px-4 py-12">
				<ul className="divide-y divide-earth-300/50">
					{posts.map((post) => (
						<li key={post.slug} className="py-8">
							<time
								className="text-xs font-semibold uppercase tracking-widest text-earth-700"
								dateTime={post.date}
							>
								{formatDate(lang, post.date)}
							</time>
							<h2 className="mt-2 text-2xl font-semibold text-rice-900">
								<Link
									to="/$lang/news/$slug"
									params={{ lang, slug: post.slug }}
									className="hover:underline"
								>
									{post.title}
								</Link>
							</h2>
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
