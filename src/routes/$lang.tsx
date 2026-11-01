import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { NotFound } from "#/components/NotFound";
import { SiteFooter } from "#/components/SiteFooter";
import { SiteHeader } from "#/components/SiteHeader";
import { applySnapshot } from "#/lib/content-store";
import { syncContent } from "#/lib/content-sync";
import { isLang } from "#/lib/i18n";
import { useLang } from "#/lib/useLang";

export const Route = createFileRoute("/$lang")({
	// Runs before every child loader, so pages always read up-to-date content.
	beforeLoad: async ({ params }) => {
		if (!isLang(params.lang)) throw notFound();
		return { contentSnapshot: await syncContent() };
	},
	// Hands the server's snapshot to the browser so hydration renders the same content.
	loader: ({ context }) => ({ snapshot: context.contentSnapshot }),
	staleTime: 60_000,
	component: LangLayout,
	notFoundComponent: NotFound,
});

function LangLayout() {
	const lang = useLang();
	const { snapshot } = Route.useLoaderData();
	// Before children render: idempotent (keyed by snapshot version).
	if (snapshot !== undefined) applySnapshot(snapshot);
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
