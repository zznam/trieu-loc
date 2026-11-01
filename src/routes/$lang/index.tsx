import { createFileRoute, Link } from "@tanstack/react-router";
import { FestivalCountdown } from "#/components/FestivalCountdown";
import { HeroArt } from "#/components/HeroArt";
import { WeatherChip } from "#/components/Weather";
import { getNews, site } from "#/lib/content";
import { type DictKey, formatDate, type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";

export const Route = createFileRoute("/$lang/")({
	head: ({ params }) =>
		seo(
			params.lang as Lang,
			null,
			t(params.lang as Lang, "home.lead"),
			"",
			"home",
		),
	component: Home,
});

const HIGHLIGHT_ROUTES = {
	places: "/$lang/places",
	history: "/$lang/history",
	food: "/$lang/food",
} as const;

function Home() {
	const { lang: raw } = Route.useParams();
	const lang = raw as Lang;
	const news = getNews(lang).slice(0, 3);
	const stats: { key: DictKey; value: string }[] = [
		{ key: "home.stats.area", value: site.stats.area },
		{
			key: "home.stats.pop",
			value:
				lang === "vi"
					? site.stats.population
					: site.stats.population.replace(".", ","),
		},
		{ key: "home.stats.villages", value: site.stats.villages },
		{ key: "home.stats.distance", value: site.stats.distance },
	];

	return (
		<>
			<section className="relative overflow-hidden">
				<HeroArt className="absolute inset-0 h-full w-full dark:opacity-40" />
				<div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/80 to-transparent" />
				<div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-32">
					<p className="text-sm font-semibold uppercase tracking-widest text-earth-700">
						{t(lang, "home.kicker")}
					</p>
					<h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-rice-900 sm:text-6xl">
						{t(lang, "home.title")}
					</h1>
					<p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
						{t(lang, "home.lead")}
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						<Link
							to="/$lang/places"
							params={{ lang }}
							className="rounded-full bg-rice-700 px-6 py-3 font-medium text-paper shadow-sm transition hover:bg-rice-900"
						>
							{t(lang, "home.cta.places")}
						</Link>
						<Link
							to="/$lang/history"
							params={{ lang }}
							className="rounded-full border border-rice-700 bg-paper/70 px-6 py-3 font-medium text-rice-900 transition hover:bg-rice-100"
						>
							{t(lang, "home.cta.history")}
						</Link>
					</div>
				</div>
			</section>

			<section className="border-y border-earth-300/40 bg-paper-2">
				<dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
					{stats.map((s) => (
						<div key={s.key}>
							<dt className="text-xs font-semibold uppercase tracking-widest text-earth-700">
								{t(lang, s.key)}
							</dt>
							<dd className="mt-1 font-serif text-3xl font-semibold text-rice-900">
								{s.value}
							</dd>
						</div>
					))}
				</dl>
				<div className="mx-auto max-w-6xl px-4 pb-6">
					<WeatherChip lang={lang} />
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-4 py-16">
				<h2 className="text-3xl font-semibold text-rice-900">
					{t(lang, "home.highlights")}
				</h2>
				<div className="mt-8 grid gap-6 md:grid-cols-3">
					{site.highlights.map((h) => (
						<Link
							key={h.to}
							to={HIGHLIGHT_ROUTES[h.to as keyof typeof HIGHLIGHT_ROUTES]}
							params={{ lang }}
							className="group rounded-2xl border border-earth-300/50 bg-card/70 p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
						>
							<h3 className="text-xl font-semibold text-rice-900">
								{pick(lang, h.title)}
							</h3>
							<p className="mt-3 text-ink-soft">{pick(lang, h.body)}</p>
							<span className="mt-4 inline-block text-sm font-semibold text-earth-700 group-hover:underline">
								{t(lang, "common.readMore")} →
							</span>
						</Link>
					))}
				</div>
			</section>

			<section className="bg-rice-700 text-paper">
				<div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:grid-cols-[1fr_auto]">
					<div>
						<p className="text-sm font-semibold uppercase tracking-widest text-earth-300">
							{t(lang, "home.festival.when")}
						</p>
						<h2 className="mt-2 text-3xl font-semibold">
							{t(lang, "home.festival.title")}
						</h2>
						<p className="mt-3 max-w-2xl text-rice-100">
							{t(lang, "home.festival.body")}
						</p>
						<Link
							to="/$lang/history"
							hash="traditions"
							params={{ lang }}
							className="mt-6 inline-block rounded-full bg-paper px-6 py-3 font-medium text-rice-900 hover:bg-rice-100"
						>
							{t(lang, "common.readMore")}
						</Link>
					</div>
					<FestivalCountdown lang={lang} />
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-4 py-16">
				<div className="flex items-end justify-between gap-4">
					<h2 className="text-3xl font-semibold text-rice-900">
						{t(lang, "home.latest")}
					</h2>
					<Link
						to="/$lang/news"
						params={{ lang }}
						className="text-sm font-semibold text-earth-700 hover:underline"
					>
						{t(lang, "home.allNews")} →
					</Link>
				</div>
				<div className="mt-8 grid gap-6 md:grid-cols-3">
					{news.map((post) => (
						<Link
							key={post.slug}
							to="/$lang/news/$slug"
							params={{ lang, slug: post.slug }}
							className="rounded-2xl border border-earth-300/50 bg-card/70 p-6 transition hover:shadow-lg"
						>
							<time
								className="text-xs font-semibold uppercase tracking-widest text-earth-700"
								dateTime={post.date}
							>
								{formatDate(lang, post.date)}
							</time>
							<h3 className="mt-2 text-lg font-semibold text-rice-900">
								{post.title}
							</h3>
							<p className="mt-2 line-clamp-3 text-sm text-ink-soft">
								{post.summary}
							</p>
						</Link>
					))}
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-4 pb-4">
				<Link
					to="/$lang/guestbook"
					params={{ lang }}
					className="group flex flex-col gap-3 rounded-2xl border border-dashed border-earth-500/60 bg-paper-2 p-6 sm:flex-row sm:items-center sm:justify-between"
				>
					<span className="flex items-center gap-3 text-lg text-rice-900">
						<span aria-hidden="true" className="text-3xl">
							✉️
						</span>
						{t(lang, "guestbook.cta")}
					</span>
					<span className="font-semibold text-earth-700 group-hover:underline">
						{t(lang, "guestbook.write")} →
					</span>
				</Link>
			</section>
		</>
	);
}
