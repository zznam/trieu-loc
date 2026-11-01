import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { type Lang, t } from "#/lib/i18n";

/** Header search button; Ctrl/⌘+K or "/" (outside text fields) jumps to the search page. */
export function SearchButton({ lang }: { lang: Lang }) {
	const navigate = useNavigate();
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const el = e.target as HTMLElement | null;
			const typing =
				el &&
				(el.isContentEditable ||
					["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
			if (
				((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") ||
				(e.key === "/" && !typing)
			) {
				e.preventDefault();
				navigate({ to: "/$lang/search", params: { lang } });
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [lang, navigate]);

	return (
		<Link
			to="/$lang/search"
			params={{ lang }}
			aria-label={t(lang, "search.open")}
			title={t(lang, "search.open")}
			className="grid h-8 w-8 place-items-center rounded-full border border-earth-300 text-earth-700 hover:bg-earth-300/20"
		>
			<svg
				viewBox="0 0 24 24"
				width="16"
				height="16"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				aria-hidden="true"
			>
				<circle cx="11" cy="11" r="7" />
				<path d="m20 20-3.5-3.5" />
			</svg>
		</Link>
	);
}
