import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { Avatar } from "#/components/Avatar";
import { ContributeCta } from "#/components/ContributeCta";
import { SampleNote } from "#/components/PageHeader";
import { placeCategoryLabel, site } from "#/lib/content";
import { eventCategoryLabel } from "#/lib/events";
import { type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";
import { formerCommuneLabel, getVillage, villageLinks } from "#/lib/villages";

const PlacesMap = lazy(() => import("#/components/PlacesMap"));

export const Route = createFileRoute("/$lang/villages/$id")({
	loader: ({ params }) => {
		const village = getVillage(params.id);
		if (!village) throw notFound();
		return { village };
	},
	head: ({ params, loaderData }) => {
		const lang = params.lang as Lang;
		if (!loaderData) return {};
		const v = loaderData.village;
		return {
			...seo(
				lang,
				pick(lang, v.name),
				pick(lang, v.intro).slice(0, 160),
				`/villages/${v.id}`,
				"places",
			),
			// Placeholder villages shouldn't be indexed until they have real content.
			...(v.sample
				? {
						meta: [
							...seo(lang, pick(lang, v.name), "").meta,
							{ name: "robots", content: "noindex" },
						],
					}
				: {}),
		};
	},
	component: VillagePage,
});

function VillagePage() {
	const lang = Route.useParams().lang as Lang;
	const { village } = Route.useLoaderData();
	const links = villageLinks(village.id, lang);
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const hasMap = Boolean(village.coords) || links.places.length > 0;
	const empty =
		links.places.length + links.people.length + links.events.length === 0 &&
		village.facts.length === 0;

	return (
		<>
			<header className="grain border-b border-earth-300/40 bg-paper-2">
				<div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
					<Link
						to="/$lang/villages"
						params={{ lang }}
						className="text-sm font-semibold text-earth-700 hover:underline"
					>
						← {t(lang, "villages.all")}
					</Link>
					<p className="mt-6 text-sm font-semibold uppercase tracking-widest text-earth-700">
						{pick(lang, formerCommuneLabel[village.former])}
					</p>
					<h1 className="mt-2 text-3xl font-semibold text-rice-900 sm:text-5xl">
						{pick(lang, village.name)}
					</h1>
					{village.sample && (
						<div className="mt-3">
							<SampleNote>{t(lang, "villages.sample")}</SampleNote>
						</div>
					)}
					<p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">
						{pick(lang, village.intro)}
					</p>
				</div>
			</header>

			<section className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_1.1fr]">
				<div className="space-y-10">
					{village.facts.length > 0 && (
						<div>
							<h2 className="text-xl font-semibold text-rice-900">
								{t(lang, "villages.facts")}
							</h2>
							<ul className="mt-4 space-y-2">
								{village.facts.map((f) => (
									<li key={f.vi} className="flex gap-3 text-ink-soft">
										<span className="text-earth-500">◆</span>
										{pick(lang, f)}
									</li>
								))}
							</ul>
						</div>
					)}
					{links.places.length > 0 && (
						<div>
							<h2 className="text-xl font-semibold text-rice-900">
								{t(lang, "villages.places")}
							</h2>
							<ul className="mt-4 space-y-3">
								{links.places.map((p) => (
									<li key={p.id}>
										<Link
											to="/$lang/places"
											params={{ lang }}
											hash={p.id}
											className="block rounded-xl border border-earth-300/50 bg-card/70 p-4 hover:border-rice-500"
										>
											<span className="text-xs font-semibold uppercase tracking-widest text-earth-700">
												{pick(lang, placeCategoryLabel[p.category])}
											</span>
											<span className="mt-1 block font-semibold text-rice-900">
												{pick(lang, p.name)}
											</span>
										</Link>
									</li>
								))}
							</ul>
						</div>
					)}
					{links.people.length > 0 && (
						<div>
							<h2 className="text-xl font-semibold text-rice-900">
								{t(lang, "villages.people")}
							</h2>
							<ul className="mt-4 space-y-3">
								{links.people.map((p) => (
									<li key={p.slug}>
										<Link
											to="/$lang/people/$slug"
											params={{ lang, slug: p.slug }}
											className="flex items-center gap-3 rounded-xl border border-earth-300/50 bg-card/70 p-3 hover:border-rice-500"
										>
											<Avatar name={p.name} photo={p.photo} size={44} />
											<span>
												<span className="block font-semibold text-rice-900">
													{p.name}
												</span>
												<span className="text-sm text-ink-soft">{p.years}</span>
											</span>
										</Link>
									</li>
								))}
							</ul>
						</div>
					)}
					{links.events.length > 0 && (
						<div>
							<h2 className="text-xl font-semibold text-rice-900">
								{t(lang, "villages.events")}
							</h2>
							<ul className="mt-4 space-y-3">
								{links.events.map((e) => (
									<li key={e.id}>
										<Link
											to="/$lang/events"
											params={{ lang }}
											hash={e.id}
											className="block rounded-xl border border-earth-300/50 bg-card/70 p-4 hover:border-rice-500"
										>
											<span className="text-xs font-semibold uppercase tracking-widest text-earth-700">
												{pick(lang, eventCategoryLabel[e.category])}
											</span>
											<span className="mt-1 block font-semibold text-rice-900">
												{pick(lang, e.title)}
											</span>
										</Link>
									</li>
								))}
							</ul>
						</div>
					)}
					{empty && (
						<p className="rounded-2xl bg-paper-2 p-6 text-ink-soft">
							{t(lang, "villages.empty")}
						</p>
					)}
				</div>

				{hasMap && (
					<div className="overflow-hidden rounded-2xl border border-earth-300/50 bg-rice-50 lg:sticky lg:top-24 lg:self-start">
						{mounted ? (
							<Suspense fallback={<div className="h-[360px] animate-pulse" />}>
								<PlacesMap
									lang={lang}
									places={links.places}
									center={
										village.coords ?? links.places[0]?.coords ?? site.center
									}
									zoom={15}
									height="h-[360px] lg:h-[480px]"
								/>
							</Suspense>
						) : (
							<div className="h-[360px] lg:h-[480px]" />
						)}
					</div>
				)}
			</section>
			<section className="mx-auto max-w-6xl px-4">
				<ContributeCta
					lang={lang}
					text={t(lang, empty ? "villages.empty" : "villages.share")}
					kind="story"
				/>
			</section>
		</>
	);
}
