import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// Absolute site origin for canonical URLs, hreflang, sitemap and share images.
// Set SITE_URL in Vercel once you have a custom domain; until then Vercel's
// production URL is used automatically.
const siteUrl = (
	process.env.SITE_URL ||
	(process.env.VERCEL_PROJECT_PRODUCTION_URL
		? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
		: "http://localhost:3000")
).replace(/\/$/, "");

// Baseline security headers on every response (Vercel adds HSTS itself).
// Leaflet tiles, Google Fonts, Open-Meteo and Vercel Blob images are all cross-origin,
// so there is no Content-Security-Policy here; these headers are safe for all of them.
const securityHeaders = {
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"X-Frame-Options": "SAMEORIGIN",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

const config = defineConfig({
	define: { __SITE_URL__: JSON.stringify(siteUrl) },
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		nitro({ routeRules: { "/**": { headers: securityHeaders } } }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
