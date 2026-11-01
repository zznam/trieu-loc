import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { type DictKey, type Lang, t } from "#/lib/i18n";
import { ThemeToggle } from "./ThemeToggle";

const NAV: { to: string; key: DictKey }[] = [
	{ to: "/$lang", key: "nav.home" },
	{ to: "/$lang/history", key: "nav.history" },
	{ to: "/$lang/places", key: "nav.places" },
	{ to: "/$lang/food", key: "nav.food" },
	{ to: "/$lang/people", key: "nav.people" },
	{ to: "/$lang/events", key: "nav.events" },
	{ to: "/$lang/news", key: "nav.news" },
	{ to: "/$lang/gallery", key: "nav.gallery" },
];

export function SiteHeader({ lang }: { lang: Lang }) {
	const [open, setOpen] = useState(false);
	const other: Lang = lang === "vi" ? "en" : "vi";

	const links = NAV.map((item) => (
		<Link
			key={item.to}
			to={item.to}
			params={{ lang }}
			activeOptions={{ exact: item.to === "/$lang" }}
			onClick={() => setOpen(false)}
			className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-rice-100 hover:text-rice-900"
			activeProps={{ className: "bg-rice-100 text-rice-900" }}
		>
			{t(lang, item.key)}
		</Link>
	));

	return (
		<header className="sticky top-0 z-[1000] border-b border-earth-300/40 bg-paper/90 backdrop-blur">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
				<Link to="/$lang" params={{ lang }} className="flex items-center gap-2">
					<span className="grid h-9 w-9 place-items-center rounded-full bg-rice-700 font-serif text-lg font-bold text-paper">
						T
					</span>
					<span className="leading-tight">
						<span className="block font-serif text-lg font-semibold text-rice-900">
							Triệu Lộc
						</span>
						<span className="block text-[11px] uppercase tracking-widest text-earth-700">
							Thanh Hoá
						</span>
					</span>
				</Link>
				<nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
					{links}
				</nav>
				<div className="flex items-center gap-2">
					<ThemeToggle lang={lang} />
					<Link
						to="."
						params={(prev: Record<string, string>) => ({
							...prev,
							lang: other,
						})}
						className="rounded-full border border-earth-300 px-3 py-1.5 text-xs font-semibold text-earth-700 hover:bg-earth-300/20"
						hrefLang={other}
					>
						{t(lang, "lang.switch")}
					</Link>
					<button
						type="button"
						className="rounded-full border border-earth-300 px-3 py-1.5 text-xs font-semibold text-ink xl:hidden"
						aria-expanded={open}
						aria-controls="mobile-nav"
						onClick={() => setOpen((v) => !v)}
					>
						{open ? "✕" : "☰"} {t(lang, "nav.menu")}
					</button>
				</div>
			</div>
			{open && (
				<nav
					id="mobile-nav"
					className="flex flex-col gap-1 border-t border-earth-300/40 px-4 py-3 xl:hidden"
					aria-label="Mobile"
				>
					{links}
				</nav>
			)}
		</header>
	);
}
