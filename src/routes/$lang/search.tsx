import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { type DictKey, type Lang, t } from "#/lib/i18n";
import { type SearchKind, search } from "#/lib/search";
import { seo } from "#/lib/seo";

export const Route = createFileRoute("/$lang/search")({
	validateSearch: (s: Record<string, unknown>): { q?: string } =>
		typeof s.q === "string" && s.q.trim() ? { q: s.q.slice(0, 100) } : {},
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return {
			...seo(
				lang,
				t(lang, "search.title"),
				t(lang, "search.placeholder"),
				"/search",
			),
			meta: [
				...seo(lang, t(lang, "search.title"), "").meta,
				{ name: "robots", content: "noindex" },
			],
		};
	},
	component: SearchPage,
});

const KIND_LABEL: Record<SearchKind, DictKey> = {
	place: "nav.places",
	news: "nav.news",
	person: "nav.people",
	food: "food.specialties",
	business: "food.directory",
	event: "nav.events",
	history: "nav.history",
};

const KIND_ICON: Record<SearchKind, string> = {
	place: "📍",
	news: "📰",
	person: "👤",
	food: "🍲",
	business: "🏪",
	event: "📅",
	history: "📜",
};

function SearchPage() {
	const lang = Route.useParams().lang as Lang;
	const { q = "" } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const [value, setValue] = useState(q);
	const input = useRef<HTMLInputElement>(null);

	// Focus after the router finishes its own post-navigation focus/scroll handling.
	useEffect(() => {
		const id = requestAnimationFrame(() => input.current?.focus());
		return () => cancelAnimationFrame(id);
	}, []);
	useEffect(() => setValue(q), [q]);

	// Keep the URL in sync (shareable results) without spamming history.
	useEffect(() => {
		const id = setTimeout(() => {
			if (value.trim() !== q)
				navigate({
					search: value.trim() ? { q: value.trim() } : {},
					replace: true,
				});
		}, 250);
		return () => clearTimeout(id);
	}, [value, q, navigate]);

	const hits = useMemo(() => search(lang, value), [lang, value]);

	return (
		<section className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
			<h1 className="text-3xl font-semibold text-rice-900 sm:text-4xl">
				{t(lang, "search.title")}
			</h1>
			<search className="mt-6 block">
				<form onSubmit={(e) => e.preventDefault()}>
					<label htmlFor="q" className="sr-only">
						{t(lang, "search.title")}
					</label>
					<div className="flex items-center gap-3 rounded-2xl border border-earth-300 bg-card px-4 py-3 focus-within:border-rice-500 focus-within:ring-2 focus-within:ring-rice-300/50">
						<svg
							viewBox="0 0 24 24"
							width="20"
							height="20"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							className="text-earth-700"
							aria-hidden="true"
						>
							<circle cx="11" cy="11" r="7" />
							<path d="m20 20-3.5-3.5" />
						</svg>
						<input
							ref={input}
							id="q"
							type="search"
							autoComplete="off"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder={t(lang, "search.placeholder")}
							className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-ink-soft/70"
						/>
					</div>
				</form>
			</search>

			{value.trim() && (
				<p className="mt-4 text-sm text-ink-soft" aria-live="polite">
					{hits.length} {t(lang, "search.results")}
				</p>
			)}

			<ul className="mt-4 space-y-3">
				{hits.map(({ doc, snippet }) => (
					<li key={`${doc.kind}-${doc.to}-${doc.hash ?? ""}-${doc.title}`}>
						<Link
							to={doc.to}
							params={doc.params}
							hash={doc.hash}
							className="block rounded-2xl border border-earth-300/50 bg-card/70 p-4 transition hover:border-rice-500 hover:shadow-md"
						>
							<p className="text-xs font-semibold uppercase tracking-widest text-earth-700">
								{KIND_ICON[doc.kind]} {t(lang, KIND_LABEL[doc.kind])} ·{" "}
								{doc.meta}
							</p>
							<p className="mt-1 text-lg font-semibold text-rice-900">
								{doc.title}
							</p>
							<p className="mt-1 line-clamp-2 text-sm text-ink-soft">
								{snippet.before}
								{snippet.match && (
									<mark className="rounded bg-earth-300/50 px-0.5 text-ink">
										{snippet.match}
									</mark>
								)}
								{snippet.after}
							</p>
						</Link>
					</li>
				))}
			</ul>

			{value.trim() && hits.length === 0 && (
				<p className="mt-6 text-ink-soft">{t(lang, "search.empty")}</p>
			)}
			{!value.trim() && (
				<div className="mt-6 flex flex-wrap gap-2 text-sm">
					<span className="text-ink-soft">{t(lang, "search.try")}</span>
					{["Bà Triệu", "nem chua", "sông Lèn", "Tết", "Phú Điền"].map((s) => (
						<button
							key={s}
							type="button"
							onClick={() => setValue(s)}
							className="rounded-full border border-earth-300 px-3 py-1 text-ink-soft hover:bg-rice-100"
						>
							{s}
						</button>
					))}
				</div>
			)}
		</section>
	);
}
