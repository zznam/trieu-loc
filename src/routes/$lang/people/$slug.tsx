import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Avatar } from "#/components/Avatar";
import { Comments } from "#/components/Comments";
import { getPerson, personCategoryLabel } from "#/lib/content";
import { type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";

export const Route = createFileRoute("/$lang/people/$slug")({
	loader: ({ params }) => {
		const person = getPerson(params.lang as Lang, params.slug);
		if (!person) throw notFound();
		return { person };
	},
	head: ({ params, loaderData }) =>
		loaderData
			? seo(
					params.lang as Lang,
					loaderData.person.name,
					loaderData.person.summary,
					`/people/${params.slug}`,
					"people",
				)
			: {},
	component: PersonPage,
});

function PersonPage() {
	const lang = Route.useParams().lang as Lang;
	const { person } = Route.useLoaderData();
	return (
		<article className="mx-auto max-w-3xl px-4 py-12">
			<Link
				to="/$lang/people"
				params={{ lang }}
				className="text-sm font-semibold text-earth-700 hover:underline"
			>
				← {t(lang, "common.back")}
			</Link>
			<header className="mt-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
				<Avatar name={person.name} photo={person.photo} size={112} />
				<div>
					<p className="text-xs font-semibold uppercase tracking-widest text-earth-700">
						{pick(lang, personCategoryLabel[person.category])}
					</p>
					<h1 className="mt-1 text-3xl font-semibold leading-tight text-rice-900 sm:text-4xl">
						{person.name}
					</h1>
					<p className="mt-2 text-ink-soft">
						{[person.years, person.role].filter(Boolean).join(" · ")}
					</p>
					{person.village && (
						<p className="mt-1 text-sm text-earth-700">📍 {person.village}</p>
					)}
				</div>
			</header>
			<hr className="my-8 border-earth-300/50" />
			<div
				className="prose-news text-lg text-ink"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted Markdown committed to the repo, not user input
				dangerouslySetInnerHTML={{ __html: person.html }}
			/>
			<Comments lang={lang} target={`people:${person.slug}`} />
		</article>
	);
}
