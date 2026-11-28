import { sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "./db";

export type Health = {
	ok: boolean;
	db: "ok" | "unconfigured" | "error";
	time: string;
};

export async function checkHealth(timeoutMs = 3000): Promise<Health> {
	const time = new Date().toISOString();
	if (!isDbConfigured()) return { ok: true, db: "unconfigured", time };
	try {
		await Promise.race([
			getDb().execute(sql`select 1`),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error("timeout")), timeoutMs),
			),
		]);
		return { ok: true, db: "ok", time };
	} catch (err) {
		console.error("health check: database unreachable", err);
		return { ok: false, db: "error", time };
	}
}
