import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "#/components/PageHeader";
import { history } from "#/lib/content";
import { type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";

export const Route = createFileRoute("/$lang/history")({
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(
			lang,
			t(lang, "history.title"),
			pick(lang, history.intro).slice(0, 160),
			"/history",
			"history",
		);
	},
	component: HistoryPage,
});

function HistoryPage() {
	const lang = Route.useParams().lang as Lang;
	return (
		<>
			<PageHeader
				title={t(lang, "history.title")}
				lead={pick(lang, history.intro)}
			/>

			<section className="mx-auto max-w-6xl px-4 py-16">
				<h2 className="text-3xl font-semibold text-rice-900">
					{t(lang, "history.figure")}
				</h2>
				<div className="mt-8 grid gap-10 md:grid-cols-[1.1fr_1fr]">
					<blockquote className="rounded-2xl bg-rice-900 p-8 font-serif text-xl italic leading-relaxed text-paper sm:text-2xl">
						{pick(lang, history.figure.quote)}
						<footer className="mt-4 text-sm not-italic text-earth-300">
							— Triệu Thị Trinh
						</footer>
					</blockquote>
					<p className="text-lg leading-relaxed text-ink-soft">
						{pick(lang, history.figure.body)}
					</p>
				</div>
			</section>

			<section className="bg-paper-2 grain">
				<div className="mx-auto max-w-4xl px-4 py-16">
					<h2 className="text-3xl font-semibold text-rice-900">
						{t(lang, "history.timeline")}
					</h2>
					<ol className="mt-10 border-l-2 border-earth-300">
						{history.timeline.map((item) => {
							const year =
								typeof item.year === "string"
									? item.year
									: pick(lang, item.year);
							return (
								<li key={year} className="relative mb-10 pl-8 last:mb-0">
									<span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-paper bg-lotus" />
									<p className="font-serif text-2xl font-semibold text-earth-700">
										{year}
									</p>
									<h3 className="mt-1 text-lg font-semibold text-rice-900">
										{pick(lang, item.title)}
									</h3>
									<p className="mt-2 text-ink-soft">{pick(lang, item.body)}</p>
								</li>
							);
						})}
					</ol>
				</div>
			</section>

			<section
				id="traditions"
				className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16"
			>
				<h2 className="text-3xl font-semibold text-rice-900">
					{t(lang, "history.traditions")}
				</h2>
				<div className="mt-8 grid gap-6 md:grid-cols-3">
					{history.traditions.map((tr) => (
						<article
							key={tr.title.vi}
							className="rounded-2xl border border-earth-300/50 bg-card/70 p-6"
						>
							<h3 className="text-xl font-semibold text-rice-900">
								{pick(lang, tr.title)}
							</h3>
							<p className="mt-3 leading-relaxed text-ink-soft">
								{pick(lang, tr.body)}
							</p>
						</article>
					))}
				</div>
			</section>
		</>
	);
}
