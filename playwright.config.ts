import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/**
 * End-to-end tests against the production build (`pnpm build` first).
 * Database-backed tests need DATABASE_URL (any Postgres) and are skipped without it.
 */
export default defineConfig({
	testDir: "tests/e2e",
	fullyParallel: false, // the contribution flow shares one database
	workers: 1,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
	globalSetup: "./tests/e2e/global-setup.ts",
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "desktop",
			use: { ...devices["Desktop Chrome"] },
			testIgnore: /mobile\.spec\.ts/,
		},
		{
			name: "mobile",
			use: { ...devices["Pixel 7"] },
			testMatch: /mobile\.spec\.ts/,
		},
	],
	webServer: [
		{
			// Fake Resend API so email flows (notifications, newsletter) can be tested offline.
			command: "node tests/e2e/mock-resend.mjs",
			port: 4599,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: `pnpm preview --port ${PORT}`,
			port: PORT,
			reuseExistingServer: !process.env.CI,
			env: {
				DATABASE_URL: process.env.DATABASE_URL ?? "",
				ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "e2e-admin-password",
				RESEND_API_KEY: "re_e2e",
				RESEND_API_URL: "http://localhost:4599/emails",
				NOTIFY_EMAIL: "editor@example.test",
				NOTIFY_FROM: "Triệu Lộc <thongbao@example.test>",
			},
		},
	],
});
