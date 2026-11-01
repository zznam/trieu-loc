import { useEffect, useState } from "react";
import { type Lang, t } from "#/lib/i18n";
import { applyTheme, readTheme, THEME_KEY, type Theme } from "#/lib/theme";

export function ThemeToggle({ lang }: { lang: Lang }) {
	const [theme, setTheme] = useState<Theme | null>(null);

	useEffect(() => {
		setTheme(readTheme());
		// Follow live system changes until the visitor picks a theme themselves
		const mq = matchMedia("(prefers-color-scheme: dark)");
		const onChange = (e: MediaQueryListEvent) => {
			let saved: string | null = null;
			try {
				saved = localStorage.getItem(THEME_KEY);
			} catch {}
			if (saved) return;
			const next: Theme = e.matches ? "dark" : "light";
			document.documentElement.dataset.theme = next;
			setTheme(next);
		};
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);

	const next: Theme = theme === "dark" ? "light" : "dark";
	const label = t(lang, next === "dark" ? "theme.toDark" : "theme.toLight");

	return (
		<button
			type="button"
			onClick={() => {
				applyTheme(next);
				setTheme(next);
			}}
			aria-label={label}
			title={label}
			className="grid h-8 w-8 place-items-center rounded-full border border-earth-300 text-earth-700 hover:bg-earth-300/20"
		>
			{/* Render nothing until mounted to avoid a hydration mismatch */}
			{theme === null ? null : theme === "dark" ? (
				<svg
					viewBox="0 0 24 24"
					width="16"
					height="16"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="4" />
					<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
				</svg>
			) : (
				<svg
					viewBox="0 0 24 24"
					width="16"
					height="16"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					aria-hidden="true"
				>
					<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
				</svg>
			)}
		</button>
	);
}
