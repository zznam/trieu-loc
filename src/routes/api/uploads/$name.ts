import { createFileRoute } from "@tanstack/react-router";

const TYPES: Record<string, string> = {
	jpg: "image/jpeg",
	png: "image/png",
	webp: "image/webp",
};

/** Serves locally stored editor uploads (LOCAL_UPLOADS=1: development and E2E tests only). */
export const Route = createFileRoute("/api/uploads/$name")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const { readLocalImage } = await import("#/server/images");
				const data = await readLocalImage(params.name);
				if (!data) return new Response("Not found", { status: 404 });
				return new Response(new Uint8Array(data), {
					headers: {
						"Content-Type":
							TYPES[params.name.split(".").pop() ?? ""] ??
							"application/octet-stream",
						"Cache-Control": "public, max-age=31536000, immutable",
					},
				});
			},
		},
	},
});
