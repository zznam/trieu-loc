import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPost } from "#/lib/content";
import { formatDate, type Lang, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";

export const Route = createFileRoute("/$lang/news/$slug")({
	loader: ({ params }) => {
		const post = getPost(params.lang as Lang, params.slug);
		if (!post) throw notFound();
		return { post };
	},
	head: ({ params, loaderData }) =>
		loaderData
			? seo(params.lang as Lang, loaderData.post.title, loaderData.post.summary)
			: {},
	component: NewsPostPage,
});

function NewsPostPage() {
	const lang = Route.useParams().lang as Lang;
	const { post } = Route.useLoaderData();
	return (
		<article className="mx-auto max-w-3xl px-4 py-12">
			<Link
				to="/$lang/news"
				params={{ lang }}
				className="text-sm font-semibold text-earth-700 hover:underline"
			>
				← {t(lang, "common.back")}
			</Link>
			<time
				className="mt-8 block text-xs font-semibold uppercase tracking-widest text-earth-700"
				dateTime={post.date}
			>
				{formatDate(lang, post.date)}
			</time>
			<h1 className="mt-2 text-3xl font-semibold leading-tight text-rice-900 sm:text-4xl">
				{post.title}
			</h1>
			<p className="mt-4 text-lg text-ink-soft">{post.summary}</p>
			<hr className="my-8 border-earth-300/50" />
			<div
				className="prose-news text-lg text-ink"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted Markdown committed to the repo, not user input
				dangerouslySetInnerHTML={{ __html: post.html }}
			/>
		</article>
	);
}
