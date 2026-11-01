import { Link } from "@tanstack/react-router";
import { t } from "#/lib/i18n";
import { useLang } from "#/lib/useLang";

export function NotFound() {
	const lang = useLang();
	return (
		<div className="mx-auto max-w-xl px-4 py-24 text-center">
			<p className="font-serif text-6xl text-earth-500">404</p>
			<h1 className="mt-4 text-2xl font-semibold text-rice-900">
				{t(lang, "notFound.title")}
			</h1>
			<p className="mt-2 text-ink-soft">{t(lang, "notFound.body")}</p>
			<Link
				to="/$lang"
				params={{ lang }}
				className="mt-6 inline-block rounded-full bg-rice-700 px-5 py-2 text-paper"
			>
				{t(lang, "nav.home")}
			</Link>
		</div>
	);
}
