import { Link } from "@tanstack/react-router";
import type { Kind } from "#/lib/contribute";
import { type Lang, t } from "#/lib/i18n";

/** Green call-to-action band that opens the contribution form with a kind preselected. */
export function ContributeCta({
	lang,
	text,
	kind,
}: {
	lang: Lang;
	text: string;
	kind: Kind;
}) {
	return (
		<div className="mt-12 flex flex-col items-start gap-4 rounded-2xl bg-rice-700 p-6 text-paper sm:flex-row sm:items-center sm:justify-between">
			<p>{text}</p>
			<Link
				to="/$lang/contribute"
				params={{ lang }}
				search={{ kind }}
				className="shrink-0 rounded-full bg-paper px-5 py-2.5 font-semibold text-rice-900 hover:bg-rice-100"
			>
				{t(lang, "contribute.cta")} →
			</Link>
		</div>
	);
}
