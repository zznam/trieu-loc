import { execSync } from "node:child_process";

/** Applies migrations and empties the contributions and messages tables before the run (only with DATABASE_URL). */
export default async function globalSetup() {
	const url = process.env.DATABASE_URL;
	if (!url) return;
	execSync("pnpm db:migrate", { stdio: "inherit", env: process.env });
	const { default: postgres } = await import("postgres");
	const sql = postgres(url, { max: 1 });
	await sql`TRUNCATE contributions, messages, reactions, subscribers, newsletter_sends RESTART IDENTITY`;
	await sql.end();
}
