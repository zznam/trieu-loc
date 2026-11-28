import { Link } from "@tanstack/react-router";
import { type Lang, t } from "#/lib/i18n";

/** Small "Suggest an edit" link: opens the contribution form as a correction about `about`. */
export function SuggestEdit({
	lang,
	about,
	className = "",
}: {
	lang: Lang;
	about: string;
	className?: string;
}) {
	return (
		<Link
			to="/$lang/contribute"
			params={{ lang }}
			search={{ kind: "correction", about }}
			className={`no-print inline-flex items-center gap-1 text-xs font-semibold text-earth-700 hover:underline ${className}`}
		>
			<span aria-hidden="true">✎</span> {t(lang, "edit.suggest")}
		</Link>
	);
}
