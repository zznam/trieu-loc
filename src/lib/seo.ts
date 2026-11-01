import { type L, type Lang, pick } from "./i18n";

const SITE: L = {
	vi: "Triệu Lộc — Quê hương Bà Triệu",
	en: "Triệu Lộc — Homeland of Lady Triệu",
};

export function seo(lang: Lang, title: string | null, description: string) {
	const full = title ? `${title} · ${pick(lang, SITE)}` : pick(lang, SITE);
	return {
		meta: [
			{ title: full },
			{ name: "description", content: description },
			{ property: "og:title", content: full },
			{ property: "og:description", content: description },
			{ property: "og:type", content: "website" },
			{ property: "og:locale", content: lang === "vi" ? "vi_VN" : "en_GB" },
		],
	};
}
