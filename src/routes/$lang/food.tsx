import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ContributeCta } from "#/components/ContributeCta";
import { PageHeader, SampleNote } from "#/components/PageHeader";
import { businesses, specialties } from "#/lib/content";
import { type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";
import { fold } from "#/lib/text";

export const Route = createFileRoute("/$lang/food")({
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(
			lang,
			t(lang, "food.title"),
			t(lang, "food.lead"),
			"/food",
			"food",
		);
	},
	component: FoodPage,
});

function FoodPage() {
	const lang = Route.useParams().lang as Lang;
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<string>("all");

	const categories = useMemo(
		() => [...new Set(businesses.map((b) => pick(lang, b.category)))],
		[lang],
	);
	const filtered = businesses.filter((b) => {
		const inCat = category === "all" || pick(lang, b.category) === category;
		const hay = fold(
			`${b.name} ${pick(lang, b.body)} ${pick(lang, b.village)}`,
		);
		return inCat && hay.includes(fold(query.trim()));
	});

	return (
		<>
			<PageHeader title={t(lang, "food.title")} lead={t(lang, "food.lead")} />

			<section className="mx-auto max-w-6xl px-4 py-16">
				<h2 className="text-3xl font-semibold text-rice-900">
					{t(lang, "food.specialties")}
				</h2>
				<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{specialties.map((s, i) => (
						<article
							key={s.id}
							id={s.id}
							className="scroll-mt-24 overflow-hidden rounded-2xl border border-earth-300/50 bg-card/70"
						>
							<div
								className="h-28"
								style={{
									background: ["#c2543f", "#b5813f", "#3f5f23", "#e2c46e"][
										i % 4
									],
									backgroundImage:
										"radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.25) 1.5px, transparent 0)",
									backgroundSize: "12px 12px",
								}}
								aria-hidden="true"
							/>
							<div className="p-5">
								<p className="text-xs font-semibold uppercase tracking-widest text-earth-700">
									{pick(lang, s.tag)}
								</p>
								<h3 className="mt-1 text-lg font-semibold text-rice-900">
									{pick(lang, s.name)}
								</h3>
								<p className="mt-2 text-sm leading-relaxed text-ink-soft">
									{pick(lang, s.body)}
								</p>
							</div>
						</article>
					))}
				</div>
			</section>

			<section className="bg-paper-2 grain">
				<div className="mx-auto max-w-6xl px-4 py-16">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div>
							<h2 className="text-3xl font-semibold text-rice-900">
								{t(lang, "food.directory")}
							</h2>
							<div className="mt-3">
								<SampleNote>{t(lang, "common.sample")}</SampleNote>
							</div>
						</div>
						<div className="flex w-full flex-wrap gap-2 sm:w-auto">
							<input
								type="search"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder={t(lang, "food.search")}
								aria-label={t(lang, "food.search")}
								className="min-w-0 flex-1 rounded-full border border-earth-300 bg-card px-4 py-2 text-sm outline-none focus:border-rice-500 sm:w-64"
							/>
							<select
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								aria-label="Category"
								className="rounded-full border border-earth-300 bg-card px-4 py-2 text-sm"
							>
								<option value="all">{t(lang, "places.filter.all")}</option>
								{categories.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="mt-8 grid gap-4 md:grid-cols-2">
						{filtered.map((b) => (
							<article
								key={b.id}
								id={b.id}
								className="scroll-mt-24 rounded-2xl border border-earth-300/50 bg-card p-5"
							>
								<div className="flex items-start justify-between gap-3">
									<h3 className="text-lg font-semibold text-rice-900">
										{b.name}
									</h3>
									<span className="shrink-0 rounded-full bg-rice-100 px-3 py-1 text-xs font-medium text-rice-900">
										{pick(lang, b.category)}
									</span>
								</div>
								<p className="mt-1 text-sm text-earth-700">
									{pick(lang, b.village)}
								</p>
								<p className="mt-2 text-sm text-ink-soft">
									{pick(lang, b.body)}
								</p>
								<a
									href={`tel:${b.phone.replace(/\s/g, "")}`}
									className="mt-3 inline-block text-sm font-semibold text-rice-700 hover:underline"
								>
									☎ {b.phone}
								</a>
							</article>
						))}
						{filtered.length === 0 && (
							<p className="text-ink-soft">{t(lang, "food.noResults")}</p>
						)}
					</div>

					<ContributeCta
						lang={lang}
						text={t(lang, "food.addBusiness")}
						kind="business"
					/>
				</div>
			</section>
		</>
	);
}
