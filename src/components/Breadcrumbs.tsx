import { Link } from "@tanstack/react-router";
import { type Lang, t } from "#/lib/i18n";
import { breadcrumbLd, type Crumb } from "#/lib/structured-data";
import { JsonLd } from "./JsonLd";

/**
 * "Home › News › Title" trail. `crumbs` are the pages between home and the current one;
 * paths are full paths ("/vi/news"). Also emits BreadcrumbList JSON-LD.
 */
export function Breadcrumbs({
	lang,
	crumbs,
	current,
	currentPath,
}: {
	lang: Lang;
	crumbs: Crumb[];
	current: string;
	currentPath: string;
}) {
	const home = { name: t(lang, "nav.home"), path: `/${lang}` };
	return (
		<nav aria-label={t(lang, "breadcrumb.label")} className="text-sm">
			<ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-earth-700">
				{[home, ...crumbs].map((c) => (
					<li key={c.path} className="flex items-center gap-1.5">
						<Link
							to={c.path}
							activeOptions={{ exact: true }}
							className="font-semibold hover:underline"
						>
							{c.name}
						</Link>
						<span aria-hidden="true" className="text-earth-500">
							›
						</span>
					</li>
				))}
				<li aria-current="page" className="max-w-[60vw] truncate text-ink-soft">
					{current}
				</li>
			</ol>
			<JsonLd
				data={breadcrumbLd([
					home,
					...crumbs,
					{ name: current, path: currentPath },
				])}
			/>
		</nav>
	);
}
