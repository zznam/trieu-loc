import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
	try {
		process.loadEnvFile(".env.local");
	} catch {
		try {
			process.loadEnvFile(".env");
		} catch {}
	}
}

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/server/schema.ts",
	out: "./drizzle",
	dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});

