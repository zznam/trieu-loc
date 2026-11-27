import { createFileRoute } from "@tanstack/react-router";

/**
 * Uptime check for monitors (UptimeRobot, Better Stack…): 200 when the site and, if
 * configured, the database answer; 503 when the database is configured but unreachable.
 */
export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: async () => {
				const { checkHealth } = await import("#/server/health");
				const health = await checkHealth();
				return Response.json(health, {
					status: health.ok ? 200 : 503,
					headers: { "Cache-Control": "no-store" },
				});
			},
		},
	},
});
