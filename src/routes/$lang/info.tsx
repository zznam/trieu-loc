import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SampleNote } from "#/components/PageHeader";
import { WeatherCard } from "#/components/Weather";
import { contactsByGroup } from "#/lib/content";
import { type DictKey, type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";

export const Route = createFileRoute("/$lang/info")({
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(
			lang,
			t(lang, "info.title"),
			t(lang, "info.lead"),
			"/info",
			"places",
		);
	},
	component: InfoPage,
});

function InfoPage() {
	const lang = Route.useParams().lang as Lang;
	const groups = contactsByGroup();
	const hasSamples = groups.some((g) => g.items.some((i) => i.sample));
	return (
		<>
			<PageHeader title={t(lang, "info.title")} lead={t(lang, "info.lead")} />
			<section className="mx-auto max-w-5xl px-4 py-10">
				<h2 className="mb-4 text-2xl font-semibold text-rice-900">
					{t(lang, "info.weather")}
				</h2>
				<WeatherCard lang={lang} />
			</section>
			<section className="mx-auto max-w-5xl px-4 pb-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="text-2xl font-semibold text-rice-900">
						{t(lang, "info.contacts")}
					</h2>
					{hasSamples && <SampleNote>{t(lang, "info.sampleNote")}</SampleNote>}
				</div>
				<div className="mt-6 grid gap-6 md:grid-cols-2">
					{groups.map((g) => (
						<div
							key={g.group}
							className={`rounded-2xl border p-5 ${
								g.group === "emergency"
									? "border-lotus/40 bg-lotus/5"
									: "border-earth-300/50 bg-card/70"
							}`}
						>
							<h3 className="text-sm font-semibold uppercase tracking-widest text-earth-700">
								{t(lang, `info.group.${g.group}` as DictKey)}
							</h3>
							<ul className="mt-3 divide-y divide-earth-300/40">
								{g.items.map((c) => (
									<li
										key={c.id}
										className="flex items-center justify-between gap-4 py-3"
									>
										<div className="min-w-0">
											<p className="font-medium text-ink">
												{pick(lang, c.name)}
											</p>
											{(c.address || c.hours) && (
												<p className="text-sm text-ink-soft">
													{[
														c.address && pick(lang, c.address),
														c.hours && pick(lang, c.hours),
													]
														.filter(Boolean)
														.join(" · ")}
												</p>
											)}
											{!c.phone && (
												<p className="text-xs italic text-ink-soft">
													{t(lang, "info.noPhone")}
												</p>
											)}
										</div>
										{c.phone && (
											<a
												href={`tel:${c.phone.replace(/\s/g, "")}`}
												className={`shrink-0 rounded-full px-4 py-2 font-semibold ${
													g.group === "emergency"
														? "bg-lotus text-white"
														: "bg-rice-700 text-paper"
												}`}
												aria-label={`${t(lang, "info.call")} ${pick(lang, c.name)}: ${c.phone}`}
											>
												☎ {c.phone}
											</a>
										)}
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</section>
		</>
	);
}
