import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "#/components/PageHeader";
import { type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";
import {
	FORMER_ORDER,
	formerCommuneLabel,
	villageLinks,
	villages,
} from "#/lib/villages";

export const Route = createFileRoute("/$lang/villages/")({
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(
			lang,
			t(lang, "villages.title"),
			t(lang, "villages.lead"),
			"/villages",
			"places",
		);
	},
	component: VillagesPage,
});

function VillagesPage() {
	const lang = Route.useParams().lang as Lang;
	return (
		<>
			<PageHeader
				title={t(lang, "villages.title")}
				lead={t(lang, "villages.lead")}
			/>
			<section className="mx-auto max-w-6xl space-y-12 px-4 py-10">
				{FORMER_ORDER.map((former) => {
					const list = villages.filter((v) => v.former === former);
					return (
						<div key={former}>
							<h2 className="flex items-baseline gap-3 text-2xl font-semibold text-rice-900">
								{pick(lang, formerCommuneLabel[former])}
								<span className="text-sm font-normal text-ink-soft">
									{list.length} {t(lang, "villages.count")}
								</span>
							</h2>
							<ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{list.map((v) => {
									const links = villageLinks(v.id, lang);
									const tagged =
										links.places.length +
										links.people.length +
										links.events.length;
									return (
										<li key={v.id}>
											<Link
												to="/$lang/villages/$id"
												params={{ lang, id: v.id }}
												className={`group flex h-full flex-col rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${
													v.sample
														? "border-dashed border-earth-300 bg-paper-2/60"
														: "border-earth-300/50 bg-card/70"
												}`}
											>
												<span className="text-lg font-semibold text-rice-900">
													{pick(lang, v.name)}
												</span>
												<span className="mt-2 line-clamp-2 flex-1 text-sm text-ink-soft">
													{pick(lang, v.intro)}
												</span>
												<span className="mt-3 flex flex-wrap gap-x-3 text-xs font-semibold text-earth-700">
													{links.places.length > 0 && (
														<span>📍 {links.places.length}</span>
													)}
													{links.people.length > 0 && (
														<span>👤 {links.people.length}</span>
													)}
													{links.events.length > 0 && (
														<span>📅 {links.events.length}</span>
													)}
													{tagged === 0 && v.sample && (
														<span className="italic text-ink-soft">
															{t(lang, "villages.sample")}
														</span>
													)}
												</span>
											</Link>
										</li>
									);
								})}
							</ul>
						</div>
					);
				})}
			</section>
		</>
	);
}
