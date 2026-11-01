import { getContentSnapshot } from "#/server/content";
import type { ContentSnapshot } from "./content-schemas";
import { applySnapshot } from "./content-store";

const CLIENT_TTL = 60_000;
let lastClientSync = 0;

/**
 * Brings the in-memory content up to date with the database.
 * Returns the snapshot that was applied (null = files), or undefined if the browser
 * synced recently and skipped the request.
 */
export async function syncContent(): Promise<
	ContentSnapshot | null | undefined
> {
	const inBrowser = typeof window !== "undefined";
	if (inBrowser && Date.now() - lastClientSync < CLIENT_TTL) return undefined;
	try {
		const snap = await getContentSnapshot();
		applySnapshot(snap);
		if (inBrowser) lastClientSync = Date.now();
		return snap;
	} catch (err) {
		console.error("content sync failed — keeping current content", err);
		return undefined;
	}
}

/** After an edit in /admin: make the next page navigation fetch fresh content. */
export function forceNextSync() {
	lastClientSync = 0;
}
