export type Theme = "light" | "dark";
export const THEME_KEY = "theme";

/**
 * Runs inline in <head> before first paint so the page never flashes the wrong theme.
 * Uses the saved choice if there is one, otherwise follows the system setting.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})();`;

export function readTheme(): Theme {
	return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
	document.documentElement.dataset.theme = theme;
	try {
		localStorage.setItem(THEME_KEY, theme);
	} catch {
		// storage blocked (private mode) — the choice just won't persist
	}
}
