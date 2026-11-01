import { createServerFn } from "@tanstack/react-start";
import { and, asc, count, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { getPerson, getPost } from "#/lib/content";
import { STORY_PREFIX } from "#/lib/contribute";
import { getVillage } from "#/lib/villages";
import { looksLikeBot, requestIpHash, tooManyLinks } from "./abuse";
import { isAdminConfigured, isAdminRequest, requireAdmin } from "./auth";
import { getDb, isDbConfigured } from "./db";
import { notifyNewSubmission } from "./notify";
import { findPublishedStory } from "./published-queries";
import {
	CONTRIBUTION_STATUSES,
	type ContributionStatus,
	MESSAGE_KINDS,
	type MessageKind,
	messages,
	reactions,
} from "./schema";

const PER_HOUR = 5;

/** Comment targets look like "news:<slug>", "people:<slug>" or "villages:<id>". */
const TARGET_RE = /^(news|people|villages):[a-z0-9-]{1,140}$/;

/** True if the commented / reacted-to page really exists (stops junk targets filling the tables). */
async function targetExists(target: string) {
	const [type, slug] = target.split(":");
	if (type === "people") return Boolean(getPerson("vi", slug));
	if (type === "villages") return Boolean(getVillage(slug));
	if (type === "news") {
		if (!slug.startsWith(STORY_PREFIX)) return Boolean(getPost("vi", slug));
		const id = Number(slug.slice(STORY_PREFIX.length));
		return (
			Number.isInteger(id) && id > 0 && (await findPublishedStory(id)) !== null
		);
	}
	return false;
}

const targetSchema = z.object({ target: z.string().regex(TARGET_RE) });

export type PostError =
	| "not_configured"
	| "invalid"
	| "links"
	| "rate_limited"
	| "server";
export type PostResult = { ok: true } | { ok: false; error: PostError };

const postInput = z.object({
	kind: z.enum(MESSAGE_KINDS),
	target: z.string().regex(TARGET_RE).optional(),
	name: z.string().trim().min(1).max(80),
	place: z.string().trim().max(80).optional().default(""),
	message: z.string().trim().min(2).max(1000),
	lang: z.enum(["vi", "en"]).default("vi"),
	website: z.string().optional(), // honeypot
	startedAt: z.number().optional(),
});

export const postMessage = createServerFn({ method: "POST" })
	.validator((input: unknown) => {
		const parsed = postInput.safeParse(input);
		if (!parsed.success) return { invalid: true as const };
		if (parsed.data.kind === "comment" && !parsed.data.target)
			return { invalid: true as const };
		return parsed.data;
	})
	.handler(async ({ data }): Promise<PostResult> => {
		if ("invalid" in data) return { ok: false, error: "invalid" };
		if (looksLikeBot(data.website, data.startedAt)) return { ok: true }; // pretend success, store nothing
		if (tooManyLinks(data.message)) return { ok: false, error: "links" };
		if (!isDbConfigured()) return { ok: false, error: "not_configured" };
		try {
			if (
				data.kind === "comment" &&
				!(data.target && (await targetExists(data.target)))
			) {
				return { ok: false, error: "invalid" };
			}
			const db = getDb();
			const ipHash = requestIpHash();
			const [{ recent }] = await db
				.select({ recent: count() })
				.from(messages)
				.where(
					and(
						eq(messages.ipHash, ipHash),
						gte(messages.createdAt, new Date(Date.now() - 3600_000)),
					),
				);
			if (recent >= PER_HOUR) return { ok: false, error: "rate_limited" };
			await db.insert(messages).values({
				kind: data.kind,
				target: data.kind === "comment" ? data.target : null,
				name: data.name,
				place: data.place || null,
				message: data.message,
				lang: data.lang,
				ipHash,
			});
			await notifyNewSubmission({
				kind: data.kind,
				title:
					data.kind === "guestbook"
						? "Lời nhắn trong sổ lưu bút"
						: `Bình luận tại ${data.target}`,
				message: data.message,
				name: data.name,
				village: data.place,
				contact: "",
				lang: data.lang,
				consent: true,
				photoCount: 0,
			});
			return { ok: true };
		} catch (err) {
			console.error("postMessage failed", err);
			return { ok: false, error: "server" };
		}
	});

export type PublicMessage = {
	id: number;
	name: string;
	place: string | null;
	message: string;
	createdAt: string;
};

const approved = (kind: MessageKind) =>
	and(eq(messages.kind, kind), eq(messages.status, "approved"));

export const getGuestbook = createServerFn({ method: "GET" }).handler(
	async (): Promise<PublicMessage[]> => {
		if (!isDbConfigured()) return [];
		try {
			const rows = await getDb()
				.select({
					id: messages.id,
					name: messages.name,
					place: messages.place,
					message: messages.message,
					createdAt: messages.createdAt,
				})
				.from(messages)
				.where(approved("guestbook"))
				.orderBy(desc(messages.createdAt))
				.limit(100);
			return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
		} catch (err) {
			console.error("getGuestbook failed", err);
			return [];
		}
	},
);

export const getComments = createServerFn({ method: "GET" })
	.validator((input: unknown) => targetSchema.parse(input))
	.handler(async ({ data }): Promise<PublicMessage[]> => {
		if (!isDbConfigured()) return [];
		try {
			const rows = await getDb()
				.select({
					id: messages.id,
					name: messages.name,
					place: messages.place,
					message: messages.message,
					createdAt: messages.createdAt,
				})
				.from(messages)
				.where(and(approved("comment"), eq(messages.target, data.target)))
				.orderBy(asc(messages.createdAt))
				.limit(200);
			return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
		} catch (err) {
			console.error("getComments failed", err);
			return [];
		}
	});

// ---------- Reactions ----------

export type ReactionState = { count: number; mine: boolean; enabled: boolean };

async function reactionState(
	target: string,
	ipHash: string,
): Promise<ReactionState> {
	const db = getDb();
	const [{ n }] = await db
		.select({ n: count() })
		.from(reactions)
		.where(eq(reactions.target, target));
	const [mine] = await db
		.select({ t: reactions.target })
		.from(reactions)
		.where(and(eq(reactions.target, target), eq(reactions.ipHash, ipHash)));
	return { count: n, mine: Boolean(mine), enabled: true };
}

export const getReactions = createServerFn({ method: "GET" })
	.validator((input: unknown) => targetSchema.parse(input))
	.handler(async ({ data }): Promise<ReactionState> => {
		if (!isDbConfigured()) return { count: 0, mine: false, enabled: false };
		try {
			return await reactionState(data.target, requestIpHash());
		} catch (err) {
			console.error("getReactions failed", err);
			return { count: 0, mine: false, enabled: false };
		}
	});

/** Adds or removes this visitor's ❤️ on a page. */
export const toggleReaction = createServerFn({ method: "POST" })
	.validator((input: unknown) => targetSchema.parse(input))
	.handler(async ({ data }): Promise<ReactionState> => {
		if (!isDbConfigured()) return { count: 0, mine: false, enabled: false };
		const ipHash = requestIpHash();
		const db = getDb();
		const current = await reactionState(data.target, ipHash);
		if (current.mine) {
			await db
				.delete(reactions)
				.where(
					and(eq(reactions.target, data.target), eq(reactions.ipHash, ipHash)),
				);
		} else {
			if (!(await targetExists(data.target))) return current;
			await db
				.insert(reactions)
				.values({ target: data.target, ipHash })
				.onConflictDoNothing();
		}
		return reactionState(data.target, ipHash);
	});

// ---------- Admin ----------

export type AdminMessage = PublicMessage & {
	kind: MessageKind;
	target: string | null;
	status: ContributionStatus;
	lang: string;
};

export type MessagesAdminState = {
	authed: boolean;
	configured: { db: boolean; admin: boolean };
	counts: Record<ContributionStatus, number>;
	items: AdminMessage[];
};

export const getMessagesAdmin = createServerFn({ method: "GET" })
	.validator((input: unknown) =>
		z
			.object({
				kind: z.enum(MESSAGE_KINDS),
				status: z.enum(CONTRIBUTION_STATUSES).default("pending"),
			})
			.parse(input),
	)
	.handler(async ({ data }): Promise<MessagesAdminState> => {
		const configured = { db: isDbConfigured(), admin: isAdminConfigured() };
		const counts = { pending: 0, approved: 0, rejected: 0 };
		const authed = isAdminRequest();
		if (!authed || !configured.db)
			return { authed, configured, counts, items: [] };
		const db = getDb();
		const grouped = await db
			.select({ status: messages.status, n: count() })
			.from(messages)
			.where(eq(messages.kind, data.kind))
			.groupBy(messages.status);
		for (const g of grouped) counts[g.status] = g.n;
		const rows = await db
			.select()
			.from(messages)
			.where(
				and(eq(messages.kind, data.kind), eq(messages.status, data.status)),
			)
			.orderBy(desc(messages.createdAt))
			.limit(300);
		return {
			authed,
			configured,
			counts,
			items: rows.map((r) => ({
				id: r.id,
				kind: r.kind,
				target: r.target,
				status: r.status,
				name: r.name,
				place: r.place,
				message: r.message,
				lang: r.lang,
				createdAt: r.createdAt.toISOString(),
			})),
		};
	});

export const moderateMessage = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				id: z.number().int().positive(),
				status: z.enum(CONTRIBUTION_STATUSES),
			})
			.parse(input),
	)
	.handler(async ({ data }) => {
		requireAdmin();
		await getDb()
			.update(messages)
			.set({
				status: data.status,
				reviewedAt: data.status === "pending" ? null : new Date(),
			})
			.where(eq(messages.id, data.id));
		return { ok: true as const };
	});

export const deleteMessage = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z.object({ id: z.number().int().positive() }).parse(input),
	)
	.handler(async ({ data }) => {
		requireAdmin();
		await getDb().delete(messages).where(eq(messages.id, data.id));
		return { ok: true as const };
	});
