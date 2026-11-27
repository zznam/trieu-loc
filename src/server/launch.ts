import { createServerFn } from "@tanstack/react-start";
import { COLLECTION_NAMES } from "#/lib/content-schemas";
import { isLaunchReady, type LaunchCheck, launchChecklist } from "#/lib/launch";
import { SITE_URL } from "#/lib/seo";
import { accountsExist, requireAdmin } from "./auth";
import { ensureContentFresh, importedCollections } from "./content-db";
import { isDbConfigured } from "./db";
import { hasVerifiedSender } from "./email";
import { isNotifyConfigured } from "./notify";
import { isBlobConfigured } from "./storage";

export type LaunchState = { ready: boolean; checks: LaunchCheck[] };

/** Admin: the launch checklist, computed on this instance's live content. */
export const getLaunchState = createServerFn({ method: "GET" }).handler(
	async (): Promise<LaunchState> => {
		await requireAdmin();
		const db = isDbConfigured();
		// Make sure the content arrays reflect the database before checking them.
		await ensureContentFresh();
		const imported = db ? await importedCollections().catch(() => []) : [];
		const checks = launchChecklist({
			db,
			accounts: await accountsExist(),
			missingCollections: COLLECTION_NAMES.filter((c) => !imported.includes(c)),
			blob: isBlobConfigured(),
			notify: isNotifyConfigured(),
			verifiedSender: hasVerifiedSender(),
			siteUrl: SITE_URL,
		});
		return { ready: isLaunchReady(checks), checks };
	},
);
