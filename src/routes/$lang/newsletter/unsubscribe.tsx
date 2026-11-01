import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionAction } from "#/components/SubscriptionAction";
import { type Lang, t } from "#/lib/i18n";
import { getSubscription, unsubscribe } from "#/server/newsletter";

export const Route = createFileRoute("/$lang/newsletter/unsubscribe")({
	validateSearch: (s: Record<string, unknown>): { token?: string } =>
		typeof s.token === "string" ? { token: s.token.slice(0, 64) } : {},
	loaderDeps: ({ search }) => ({ token: search.token ?? "" }),
	loader: ({ deps }) => getSubscription({ data: { token: deps.token } }),
	head: ({ params }) => ({
		meta: [
			{ title: t(params.lang as Lang, "newsletter.unsubTitle") },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: Page,
});

function Page() {
	const lang = Route.useParams().lang as Lang;
	const info = Route.useLoaderData();
	const { token = "" } = Route.useSearch();
	return (
		<SubscriptionAction
			lang={lang}
			info={info}
			mode="unsubscribe"
			run={() => unsubscribe({ data: { token } })}
		/>
	);
}
