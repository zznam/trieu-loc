import { createFileRoute, notFound } from "@tanstack/react-router";
import { Avatar } from "#/components/Avatar";
import { Breadcrumbs } from "#/components/Breadcrumbs";
import { Comments } from "#/components/Comments";
import { JsonLd } from "#/components/JsonLd";
import { ShareButtons } from "#/components/ShareButtons";
import { SuggestEdit } from "#/components/SuggestEdit";
import { getPerson, personCategoryLabel } from "#/lib/content";
import { type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";
import { personLd } from "#/lib/structured-data";

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
		<>
			<div className="mx-auto max-w-3xl px-4 pt-12">
				<Breadcrumbs
					lang={lang}
					crumbs={[{ name: t(lang, "nav.people"), path: `/${lang}/people` }]}
					current={person.name}
					currentPath={`/${lang}/people/${person.slug}`}
				/>
			</div>
			<article className="mx-auto max-w-3xl px-4 pt-2 pb-12">
				<JsonLd data={personLd(person, `/${lang}/people/${person.slug}`)} />
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
				<ShareButtons
					lang={lang}
					path={`/${lang}/people/${person.slug}`}
					title={person.name}
				/>
				<SuggestEdit lang={lang} about={person.name} className="mt-4" />
				<Comments lang={lang} target={`people:${person.slug}`} />
			</article>
		</>
	);
}
