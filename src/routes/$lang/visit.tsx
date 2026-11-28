import { createFileRoute, Link } from "@tanstack/react-router";
import { FestivalCountdown } from "#/components/FestivalCountdown";
import { PageHeader } from "#/components/PageHeader";
import { type Lang, pick, t } from "#/lib/i18n";
import { VISITOR_GUIDE } from "#/lib/pages";
import { seo } from "#/lib/seo";

export const Route = createFileRoute("/$lang/visit")({
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(
			lang,
			t(lang, "visit.title"),
			t(lang, "visit.lead"),
			"/visit",
			"places",
		);
	},
	component: VisitPage,
});

function VisitPage() {
	const lang = Route.useParams().lang as Lang;
	return (
		<>
			<PageHeader title={t(lang, "visit.title")} lead={t(lang, "visit.lead")} />
			<section className="mx-auto max-w-4xl px-4 py-10">
				<nav
					aria-label={t(lang, "visit.title")}
					className="no-print mb-8 flex flex-wrap gap-2"
				>
					{VISITOR_GUIDE.map((s) => (
						<a
							key={s.id}
							href={`#${s.id}`}
							className="rounded-full border border-earth-300 px-3 py-1.5 text-sm text-ink-soft hover:bg-rice-100"
						>
							<span aria-hidden="true">{s.icon}</span> {pick(lang, s.title)}
						</a>
					))}
				</nav>
				<div className="space-y-6">
					{VISITOR_GUIDE.map((s) => (
						<article
							key={s.id}
							id={s.id}
							className="scroll-mt-24 rounded-2xl border border-earth-300/50 bg-card/70 p-6"
						>
							<h2 className="text-2xl font-semibold text-rice-900">
								<span aria-hidden="true">{s.icon}</span> {pick(lang, s.title)}
							</h2>
							<ul className="mt-4 space-y-3 text-ink-soft">
								{s.items.map((item) => (
									<li key={item.vi} className="flex gap-3">
										<span className="text-earth-500" aria-hidden="true">
											◆
										</span>
										{pick(lang, item)}
									</li>
								))}
							</ul>
							{s.link && (
								<Link
									to={s.link.to}
									params={{ lang }}
									className="mt-4 inline-block text-sm font-semibold text-rice-700 hover:underline"
								>
									{pick(lang, s.link.label)} →
								</Link>
							)}
							{s.id === "when" && (
								<div className="mt-6">
									<p className="mb-3 text-sm font-semibold text-earth-700">
										{t(lang, "visit.next")}
									</p>
									<FestivalCountdown lang={lang} />
								</div>
							)}
						</article>
					))}
				</div>
			</section>
		</>
	);
}
