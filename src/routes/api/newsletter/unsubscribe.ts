import { createFileRoute } from "@tanstack/react-router";

/**
 * RFC 8058 one-click unsubscribe target for the List-Unsubscribe header.
 * Mail apps POST here; a plain GET (someone opening the link) is sent to the confirmation page instead.
 */
export const Route = createFileRoute("/api/newsletter/unsubscribe")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const token = new URL(request.url).searchParams.get("token") ?? "";
				if (!/^[a-f0-9]{48}$/.test(token))
					return new Response("Bad token", { status: 400 });
				const { unsubscribeByToken } = await import(
					"#/server/newsletter-queries"
				);
				await unsubscribeByToken(token);
				return new Response("Unsubscribed", { status: 200 });
			},
			GET: ({ request }) => {
				const token = new URL(request.url).searchParams.get("token") ?? "";
				return Response.redirect(
					new URL(
						`/vi/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
						request.url,
					),
					302,
				);
			},
		},
	},
});
