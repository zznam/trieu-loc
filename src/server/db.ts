import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let db: PostgresJsDatabase<typeof schema> | undefined;

export function isDbConfigured() {
	return Boolean(process.env.DATABASE_URL);
}

/**
 * Lazily-created Drizzle client. Works with Neon's pooled connection string on Vercel
 * (sslmode in the URL is respected) and with a local Postgres for development.
 */
export function getDb() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is not set");
	if (!db) {
		// One connection per serverless instance; `prepare: false` is required behind Neon's pgbouncer pooler.
		const client = postgres(url, { max: 1, prepare: false, idle_timeout: 20 });
		db = drizzle(client, { schema });
	}
	return db;
}
