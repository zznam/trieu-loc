import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPost } from "#/lib/content";
import { STORY_PREFIX } from "#/lib/contribute";
import { formatDate, type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";
import { getVillage } from "#/lib/villages";
import { getPublishedStory } from "#/server/published";

type Article =
	| { kind: "post"; title: string; date: string; summary: string; html: string }
	| {
			kind: "story";
			title: string;
			date: string;
			summary: string;
			message: string;
			byline: string;
			villageId: string | null;
	  };

export const Route = createFileRoute("/$lang/news/$slug")({
	loader: async ({ params }): Promise<{ article: Article }> => {
		if (params.slug.startsWith(STORY_PREFIX)) {
			const id = Number(params.slug.slice(STORY_PREFIX.length));
			const story =
				Number.isInteger(id) && id > 0
					? await getPublishedStory({ data: { id } })
					: null;
			if (!story) throw notFound();
			return {
				article: {
					kind: "story",
					title: story.title,
					date: story.publishedAt.slice(0, 10),
					summary: story.message.replace(/\s+/g, " ").slice(0, 160),
					message: story.message,
					byline: [story.name, story.village].filter(Boolean).join(" · "),
					villageId: story.villageId,
				},
			};
		}
		const post = getPost(params.lang as Lang, params.slug);
		if (!post) throw notFound();
		return {
			article: {
				kind: "post",
				title: post.title,
				date: post.date,
				summary: post.summary,
				html: post.html,
			},
		};
	},
	head: ({ params, loaderData }) =>
		loaderData
			? seo(
					params.lang as Lang,
					loaderData.article.title,
					loaderData.article.summary,
					`/news/${params.slug}`,
					"news",
				)
			: {},
	component: NewsPostPage,
});

function NewsPostPage() {
	const lang = Route.useParams().lang as Lang;
	const { article } = Route.useLoaderData();
	const village =
		article.kind === "story" && article.villageId
			? getVillage(article.villageId)
			: undefined;
	return (
		<article className="mx-auto max-w-3xl px-4 py-12">
			<Link
				to="/$lang/news"
				params={{ lang }}
				className="text-sm font-semibold text-earth-700 hover:underline"
			>
				← {t(lang, "common.back")}
			</Link>
			<p className="mt-8 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-earth-700">
				<time dateTime={article.date}>{formatDate(lang, article.date)}</time>
				{article.kind === "story" && (
					<span className="rounded-full bg-rice-100 px-2 py-0.5 normal-case tracking-normal text-rice-900">
						✍️ {t(lang, "news.community")}
					</span>
				)}
			</p>
			<h1 className="mt-2 text-3xl font-semibold leading-tight text-rice-900 sm:text-4xl">
				{article.title}
			</h1>
			{article.kind === "post" ? (
				<>
					<p className="mt-4 text-lg text-ink-soft">{article.summary}</p>
					<hr className="my-8 border-earth-300/50" />
					<div
						className="prose-news text-lg text-ink"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted Markdown committed to the repo, not user input
						dangerouslySetInnerHTML={{ __html: article.html }}
					/>
				</>
			) : (
				<>
					<p className="mt-3 text-ink-soft">
						{t(lang, "news.by")}{" "}
						<span className="font-semibold text-ink">{article.byline}</span>
						{village && (
							<>
								{" · "}
								<Link
									to="/$lang/villages/$id"
									params={{ lang, id: village.id }}
									className="font-semibold text-rice-700 hover:underline"
								>
									{pick(lang, village.name)}
								</Link>
							</>
						)}
					</p>
					<hr className="my-8 border-earth-300/50" />
					{/* Community text is rendered as plain text (React escapes it), never as HTML. */}
					<div className="space-y-4 text-lg leading-8 text-ink">
						{article.message.split(/\n{2,}/).map((para, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: paragraphs of a static text have no stable id
							<p key={i} className="whitespace-pre-line">
								{para}
							</p>
						))}
					</div>
				</>
			)}
		</article>
	);
}
