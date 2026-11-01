import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { NotFound } from "#/components/NotFound";
import { SiteFooter } from "#/components/SiteFooter";
import { SiteHeader } from "#/components/SiteHeader";
import { isLang } from "#/lib/i18n";
import { useLang } from "#/lib/useLang";

export const Route = createFileRoute("/$lang")({
	beforeLoad: ({ params }) => {
		if (!isLang(params.lang)) throw notFound();
	},
	component: LangLayout,
	notFoundComponent: NotFound,
});

function LangLayout() {
	const lang = useLang();
	return (
		<div className="flex min-h-screen flex-col">
			<SiteHeader lang={lang} />
			<main className="flex-1">
				<Outlet />
			</main>
			<SiteFooter lang={lang} />
		</div>
	);
}
