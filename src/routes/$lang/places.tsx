import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { PageHeader } from "#/components/PageHeader";
import {
	type PlaceCategory,
	placeCategoryLabel,
	places,
	site,
} from "#/lib/content";
import { type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";

const PlacesMap = lazy(() => import("#/components/PlacesMap"));

export const Route = createFileRoute("/$lang/places")({
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(lang, t(lang, "places.title"), t(lang, "places.lead"));
	},
	component: PlacesPage,
});

const CATEGORIES: (PlaceCategory | "all")[] = [
	"all",
	"relic",
	"nature",
	"public",
];

const GETTING_HERE = {
	vi: [
		"Từ TP Thanh Hoá: đi theo Quốc lộ 1 về phía bắc khoảng 18 km, Quốc lộ 1 chạy qua địa bàn xã.",
		"Từ Hà Nội: khoảng 137 km theo cao tốc Bắc – Nam hoặc Quốc lộ 1, khoảng 2,5 – 3 giờ đi xe.",
		"Gần nhất có ga Thanh Hoá và sân bay Thọ Xuân; từ đó đi taxi hoặc xe khách về Triệu Lộc.",
	],
	en: [
		"From Thanh Hóa city: head north on National Highway 1 for about 18 km — the highway runs through the commune.",
		"From Hanoi: about 137 km via the North–South expressway or Highway 1, roughly 2.5–3 hours by car.",
		"The nearest rail station is Thanh Hóa, and the nearest airport is Thọ Xuân; take a taxi or bus from there.",
	],
};

function PlacesPage() {
	const lang = Route.useParams().lang as Lang;
	const [cat, setCat] = useState<PlaceCategory | "all">("all");
	const [focus, setFocus] = useState<[number, number] | undefined>();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const shown =
		cat === "all" ? places : places.filter((p) => p.category === cat);

	return (
		<>
			<PageHeader
				title={t(lang, "places.title")}
				lead={t(lang, "places.lead")}
			/>
			<section className="mx-auto max-w-6xl px-4 py-10">
				<div className="mb-6 flex flex-wrap gap-2" role="tablist">
					{CATEGORIES.map((c) => (
						<button
							key={c}
							type="button"
							role="tab"
							aria-selected={cat === c}
							onClick={() => setCat(c)}
							className={`rounded-full px-4 py-2 text-sm font-medium transition ${
								cat === c
									? "bg-rice-700 text-paper"
									: "border border-earth-300 text-ink-soft hover:bg-rice-100"
							}`}
						>
							{c === "all"
								? t(lang, "places.filter.all")
								: pick(lang, placeCategoryLabel[c])}
						</button>
					))}
				</div>

				<div className="overflow-hidden rounded-2xl border border-earth-300/50 bg-rice-50 shadow-sm">
					{mounted ? (
						<Suspense
							fallback={
								<div className="h-[420px] animate-pulse sm:h-[520px]" />
							}
						>
							<PlacesMap
								lang={lang}
								places={shown}
								center={site.center}
								focus={focus}
							/>
						</Suspense>
					) : (
						<div className="h-[420px] sm:h-[520px]" />
					)}
				</div>

				<div className="mt-10 grid gap-6 md:grid-cols-2">
					{shown.map((p) => (
						<article
							key={p.id}
							className="flex flex-col rounded-2xl border border-earth-300/50 bg-white/60 p-6"
						>
							<p className="text-xs font-semibold uppercase tracking-widest text-earth-700">
								{pick(lang, placeCategoryLabel[p.category])} ·{" "}
								{pick(lang, p.village)}
							</p>
							<h2 className="mt-2 text-xl font-semibold text-rice-900">
								{pick(lang, p.name)}
							</h2>
							<p className="mt-2 flex-1 text-ink-soft">{pick(lang, p.body)}</p>
							<div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
								<button
									type="button"
									onClick={() => {
										setFocus([...p.coords]);
										window.scrollTo({ top: 0, behavior: "smooth" });
									}}
									className="font-semibold text-rice-700 hover:underline"
								>
									📍 {t(lang, "places.showOnMap")}
								</button>
								<a
									href={`https://www.google.com/maps/search/?api=1&query=${p.coords[0]},${p.coords[1]}`}
									target="_blank"
									rel="noreferrer"
									className="font-semibold text-earth-700 hover:underline"
								>
									{t(lang, "places.openMap")} ↗
								</a>
								{p.approx && (
									<span className="text-xs italic text-ink-soft">
										({t(lang, "common.approxLocation")})
									</span>
								)}
							</div>
						</article>
					))}
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-4 pb-6">
				<div className="rounded-2xl bg-paper-2 p-8 grain">
					<h2 className="text-2xl font-semibold text-rice-900">
						{t(lang, "places.howToGet")}
					</h2>
					<ul className="mt-4 space-y-3 text-ink-soft">
						{GETTING_HERE[lang].map((line) => (
							<li key={line} className="flex gap-3">
								<span className="text-earth-500">◆</span>
								{line}
							</li>
						))}
					</ul>
				</div>
			</section>
		</>
	);
}
