import { useParams } from "@tanstack/react-router";
import { DEFAULT_LANG, isLang, type Lang } from "./i18n";

export function useLang(): Lang {
	const { lang } = useParams({ strict: false }) as { lang?: string };
	return lang && isLang(lang) ? lang : DEFAULT_LANG;
}
