import { Link } from "@tanstack/react-router";
import { type Lang, t } from "#/lib/i18n";

/** One-line reminder of the community rules, linking to the privacy & rules page. */
export function RulesNote({ lang }: { lang: Lang }) {
	return (
		<p className="text-xs leading-relaxed text-ink-soft">
			{t(lang, "guidelines.note")}{" "}
			<Link
				to="/$lang/privacy"
				params={{ lang }}
				hash="guidelines"
				className="font-semibold text-rice-700 underline"
			>
				{t(lang, "guidelines.link")}
			</Link>
		</p>
	);
}
