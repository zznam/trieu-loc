// Server-only (imported from handlers / lazily from server routes), never from route modules.
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { subscribers } from "./schema";

export async function unsubscribeByToken(token: string) {
	const rows = await getDb()
		.update(subscribers)
		.set({ status: "unsubscribed", unsubscribedAt: new Date() })
		.where(eq(subscribers.token, token))
		.returning({ id: subscribers.id });
	return rows.length > 0;
}
