import { Link } from "@tanstack/react-router";
import { type DictKey, t } from "#/lib/i18n";
import { useLang } from "#/lib/useLang";

const POPULAR: { to: string; key: DictKey }[] = [
	{ to: "/$lang/history", key: "nav.history" },
	{ to: "/$lang/places", key: "nav.places" },
	{ to: "/$lang/events", key: "nav.events" },
	{ to: "/$lang/news", key: "nav.news" },
	{ to: "/$lang/visit", key: "nav.visit" },
];

export function NotFound() {
	const lang = useLang();
	return (
		<div className="mx-auto max-w-xl px-4 py-24 text-center">
			<p className="font-serif text-6xl text-earth-500">404</p>
			<h1 className="mt-4 text-2xl font-semibold text-rice-900">
				{t(lang, "notFound.title")}
			</h1>
			<p className="mt-2 text-ink-soft">{t(lang, "notFound.body")}</p>
			{/* Plain GET form: works before hydration and without JavaScript. */}
			<form
				action={`/${lang}/search`}
				method="get"
				role="search"
				className="mx-auto mt-8 flex max-w-md gap-2"
			>
				<input
					type="search"
					name="q"
					aria-label={t(lang, "notFound.search")}
					placeholder={t(lang, "notFound.search")}
					className="min-w-0 flex-1 rounded-full border border-earth-300 bg-card px-4 py-2 text-sm"
				/>
				<button
					type="submit"
					className="rounded-full bg-rice-700 px-4 py-2 text-sm font-semibold text-paper"
				>
					{t(lang, "search.title")}
				</button>
			</form>
			<p className="mt-8 text-sm font-semibold text-earth-700">
				{t(lang, "notFound.popular")}
			</p>
			<ul className="mt-3 flex flex-wrap justify-center gap-2">
				<li>
					<Link
						to="/$lang"
						params={{ lang }}
						className="inline-block rounded-full bg-rice-700 px-4 py-2 text-sm text-paper"
					>
						{t(lang, "nav.home")}
					</Link>
				</li>
				{POPULAR.map((p) => (
					<li key={p.to}>
						<Link
							to={p.to}
							params={{ lang }}
							className="inline-block rounded-full border border-earth-300 px-4 py-2 text-sm text-ink-soft hover:bg-rice-100"
						>
							{t(lang, p.key)}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
