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

// ---------- Text size (for older readers) ----------

export const TEXT_SIZES = ["md", "lg", "xl"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
export const TEXT_SIZE_KEY = "text-size";

/** Inline, before first paint: restores the saved text size without a layout jump. */
export const textSizeInitScript = `(function(){try{var s=localStorage.getItem("${TEXT_SIZE_KEY}");if(s==="lg"||s==="xl")document.documentElement.dataset.textSize=s}catch(e){}})();`;

export function readTextSize(): TextSize {
	const s = document.documentElement.dataset.textSize;
	return s === "lg" || s === "xl" ? s : "md";
}

export function applyTextSize(size: TextSize) {
	if (size === "md") delete document.documentElement.dataset.textSize;
	else document.documentElement.dataset.textSize = size;
	try {
		if (size === "md") localStorage.removeItem(TEXT_SIZE_KEY);
		else localStorage.setItem(TEXT_SIZE_KEY, size);
	} catch {
		// storage blocked — the choice just won't persist
	}
}
