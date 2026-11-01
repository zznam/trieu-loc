import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar } from "#/components/Avatar";
import { ContributeCta } from "#/components/ContributeCta";
import { PageHeader } from "#/components/PageHeader";
import {
	getPeople,
	type PersonCategory,
	personCategoryLabel,
} from "#/lib/content";
import { type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";

export const Route = createFileRoute("/$lang/people/")({
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(
			lang,
			t(lang, "people.title"),
			t(lang, "people.lead"),
			"/people",
			"people",
		);
	},
	component: PeoplePage,
});

const CATEGORIES: (PersonCategory | "all")[] = [
	"all",
	"history",
	"notable",
	"diaspora",
];

function PeoplePage() {
	const lang = Route.useParams().lang as Lang;
	const [cat, setCat] = useState<PersonCategory | "all">("all");
	const people = getPeople(lang).filter(
		(p) => cat === "all" || p.category === cat,
	);

	return (
		<>
			<PageHeader
				title={t(lang, "people.title")}
				lead={t(lang, "people.lead")}
			/>
			<section className="mx-auto max-w-6xl px-4 py-10">
				<div className="mb-8 flex flex-wrap gap-2">
					{CATEGORIES.map((c) => (
						<button
							key={c}
							type="button"
							aria-pressed={cat === c}
							onClick={() => setCat(c)}
							className={`rounded-full px-4 py-2 text-sm font-medium transition ${
								cat === c
									? "bg-rice-700 text-paper"
									: "border border-earth-300 text-ink-soft hover:bg-rice-100"
							}`}
						>
							{c === "all"
								? t(lang, "places.filter.all")
								: pick(lang, personCategoryLabel[c])}
						</button>
					))}
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{people.map((p) => (
						<Link
							key={p.slug}
							to="/$lang/people/$slug"
							params={{ lang, slug: p.slug }}
							className="group flex flex-col rounded-2xl border border-earth-300/50 bg-card/70 p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
						>
							<div className="flex items-center gap-4">
								<Avatar name={p.name} photo={p.photo} size={64} />
								<div>
									<p className="text-xs font-semibold uppercase tracking-widest text-earth-700">
										{pick(lang, personCategoryLabel[p.category])}
									</p>
									<h2 className="mt-1 text-lg font-semibold leading-snug text-rice-900">
										{p.name}
									</h2>
									{p.years && (
										<p className="text-sm text-ink-soft">{p.years}</p>
									)}
								</div>
							</div>
							<p className="mt-4 flex-1 text-ink-soft">{p.summary}</p>
							<span className="mt-4 text-sm font-semibold text-rice-700 group-hover:underline">
								{t(lang, "common.readMore")} →
							</span>
						</Link>
					))}
				</div>

				<ContributeCta
					lang={lang}
					text={t(lang, "people.share")}
					kind="story"
				/>
			</section>
		</>
	);
}
