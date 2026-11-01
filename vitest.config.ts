import { defineConfig } from "vitest/config";

// Unit tests run against plain modules, without the TanStack Start / Nitro plugins.
export default defineConfig({
	resolve: { tsconfigPaths: true },
	define: { __SITE_URL__: JSON.stringify("https://example.test") },
	test: {
		include: ["src/**/*.test.ts"],
		environment: "node",
	},
});
