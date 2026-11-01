import { randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { getNews } from "#/lib/content";
import { STORY_PREFIX } from "#/lib/contribute";
import { communityEvent, upcomingEvents } from "#/lib/events";
import { type Lang, pick } from "#/lib/i18n";
import { looksLikeBot, requestIpHash } from "./abuse";
import { isAdminConfigured, isAdminRequest, requireAdmin } from "./auth";
import { ensureContentFresh } from "./content-db";
import { getDb, isDbConfigured } from "./db";
import { buildDigest, type Digest, UNSUBSCRIBE_PLACEHOLDER } from "./digest";
import {
	type Email,
	escapeHtml,
	hasVerifiedSender,
	isEmailConfigured,
	sendBatch,
	sendEmail,
} from "./email";
import { unsubscribeByToken } from "./newsletter-queries";
import { listPublished } from "./published-queries";
import { newsletterSends, subscribers } from "./schema";

const SITE = __SITE_URL__;
const PER_HOUR = 5;
const newToken = () => randomBytes(24).toString("hex");
const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{48}$/) });

const unsubscribePage = (lang: string, token: string) =>
	`${SITE}/${lang}/newsletter/unsubscribe?token=${token}`;
const unsubscribeApi = (token: string) =>
	`${SITE}/api/newsletter/unsubscribe?token=${token}`;

// ---------- Subscribe (double opt-in) ----------

export type SubscribeError =
	| "not_configured"
	| "invalid"
	| "rate_limited"
	| "server";

export const subscribe = createServerFn({ method: "POST" })
	.validator((input: unknown) => {
		const r = z
			.object({
				email: z.string().trim().toLowerCase().email().max(254),
				lang: z.enum(["vi", "en"]),
				website: z.string().optional(),
				startedAt: z.number().optional(),
			})
			.safeParse(input);
		return r.success ? r.data : { invalid: true as const };
	})
	.handler(
		async ({
			data,
		}): Promise<{ ok: true } | { ok: false; error: SubscribeError }> => {
			if ("invalid" in data) return { ok: false, error: "invalid" };
			if (looksLikeBot(data.website, data.startedAt, 1500)) return { ok: true };
			if (!isDbConfigured() || !isEmailConfigured())
				return { ok: false, error: "not_configured" };
			try {
				const db = getDb();
				const ipHash = requestIpHash();
				const [{ recent }] = await db
					.select({ recent: count() })
					.from(subscribers)
					.where(
						and(
							eq(subscribers.ipHash, ipHash),
							gte(subscribers.createdAt, new Date(Date.now() - 3600_000)),
						),
					);
				if (recent >= PER_HOUR) return { ok: false, error: "rate_limited" };

				const [existing] = await db
					.select()
					.from(subscribers)
					.where(eq(subscribers.email, data.email));
				// Same answer whether or not the address is already subscribed — never reveal who is on the list.
				if (existing?.status === "active") return { ok: true };
				const token = newToken();
				if (existing) {
					await db
						.update(subscribers)
						.set({
							status: "pending",
							token,
							lang: data.lang,
							ipHash,
							unsubscribedAt: null,
						})
						.where(eq(subscribers.id, existing.id));
				} else {
					await db
						.insert(subscribers)
						.values({ email: data.email, lang: data.lang, token, ipHash });
				}
				await sendEmail(confirmationEmail(data.email, data.lang, token));
				return { ok: true };
			} catch (err) {
				console.error("subscribe failed", err);
				return { ok: false, error: "server" };
			}
		},
	);

function confirmationEmail(email: string, lang: Lang, token: string): Email {
	const url = `${SITE}/${lang}/newsletter/confirm?token=${token}`;
	const vi = lang === "vi";
	const subject = vi
		? "Xác nhận đăng ký bản tin Triệu Lộc"
		: "Confirm your Triệu Lộc newsletter subscription";
	const body = vi
		? "Bấm nút dưới đây để xác nhận bạn muốn nhận bản tin hằng tháng của trang cộng đồng xã Triệu Lộc."
		: "Click the button below to confirm you'd like the monthly newsletter from the Triệu Lộc community site.";
	const button = vi ? "Xác nhận đăng ký" : "Confirm subscription";
	const ignore = vi
		? "Nếu bạn không đăng ký, hãy bỏ qua thư này — bạn sẽ không nhận thêm thư nào."
		: "If you didn't sign up, just ignore this email — you won't hear from us again.";
	return {
		to: [email],
		subject,
		text: `${body}\n\n${url}\n\n${ignore}`,
		html: `<div style="font-family:system-ui,sans-serif;max-width:520px;color:#23361a"><h2 style="font-family:Georgia,serif">${escapeHtml(subject)}</h2><p>${escapeHtml(body)}</p><p><a href="${escapeHtml(url)}" style="display:inline-block;background:#3f5f23;color:#faf6ec;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">${escapeHtml(button)}</a></p><p style="color:#5b5747;font-size:13px">${escapeHtml(ignore)}</p></div>`,
	};
}

// ---------- Confirm / unsubscribe (button press, so link scanners can't trigger them) ----------

export type SubscriptionInfo = {
	found: boolean;
	status: "pending" | "active" | "unsubscribed" | null;
	email: string;
};

const mask = (email: string) =>
	email.replace(
		/^(.)(.*)(@.*)$/,
		(_, a, b, c) => `${a}${"•".repeat(Math.min(b.length, 6))}${c}`,
	);

export const getSubscription = createServerFn({ method: "GET" })
	.validator(
		(input: unknown) => tokenSchema.safeParse(input).data ?? { token: "" },
	)
	.handler(async ({ data }): Promise<SubscriptionInfo> => {
		if (!data.token || !isDbConfigured())
			return { found: false, status: null, email: "" };
		const [row] = await getDb()
			.select()
			.from(subscribers)
			.where(eq(subscribers.token, data.token));
		return row
			? { found: true, status: row.status, email: mask(row.email) }
			: { found: false, status: null, email: "" };
	});

export const confirmSubscription = createServerFn({ method: "POST" })
	.validator((input: unknown) => tokenSchema.parse(input))
	.handler(async ({ data }) => {
		const rows = await getDb()
			.update(subscribers)
			.set({ status: "active", confirmedAt: new Date() })
			.where(
				and(
					eq(subscribers.token, data.token),
					eq(subscribers.status, "pending"),
				),
			)
			.returning({ id: subscribers.id });
		return { ok: rows.length > 0 };
	});

export const unsubscribe = createServerFn({ method: "POST" })
	.validator((input: unknown) => tokenSchema.parse(input))
	.handler(async ({ data }) => ({ ok: await unsubscribeByToken(data.token) }));

// ---------- Digest content ----------

const fmt = (lang: Lang, iso: string) =>
	new Date(`${iso}T00:00:00Z`).toLocaleDateString(
		lang === "vi" ? "vi-VN" : "en-GB",
		{
			day: "numeric",
			month: "long",
			year: "numeric",
			timeZone: "UTC",
		},
	);

async function digestFor(lang: Lang, now = new Date()): Promise<Digest> {
	await ensureContentFresh();
	const since = new Date(now.getTime() - 30 * 86_400_000)
		.toISOString()
		.slice(0, 10);
	const [stories, published] = await Promise.all([
		listPublished("story", 50),
		listPublished("event", 100),
	]);
	const news = [
		...getNews(lang)
			.filter((p) => p.date >= since)
			.map((p) => ({
				title: p.title,
				summary: p.summary,
				date: p.date,
				url: `${SITE}/${lang}/news/${p.slug}`,
			})),
		...stories
			.filter((s) => s.publishedAt.slice(0, 10) >= since)
			.map((s) => ({
				title: s.title,
				summary: s.message.replace(/\s+/g, " ").slice(0, 180),
				date: s.publishedAt.slice(0, 10),
				url: `${SITE}/${lang}/news/${STORY_PREFIX}${s.id}`,
				community: true,
			})),
	]
		.sort((a, b) => b.date.localeCompare(a.date))
		.map((n) => ({ ...n, date: fmt(lang, n.date) }));
	const extra = published
		.map(communityEvent)
		.filter((e): e is NonNullable<typeof e> => e !== null);
	const events = upcomingEvents(now, 2, extra)
		.slice(0, 8)
		.map((o) => {
			const iso = `${o.start.year}-${String(o.start.month).padStart(2, "0")}-${String(o.start.day).padStart(2, "0")}`;
			return {
				title: pick(lang, o.event.title),
				date: fmt(lang, iso),
				lunar:
					lang === "vi"
						? `${o.lunar.day}/${o.lunar.month} âm lịch`
						: `${o.lunar.day}/${o.lunar.month} lunar`,
				location: pick(lang, o.event.location),
				url: `${SITE}/${lang}/events#${o.event.id}`,
			};
		});
	return buildDigest({ lang, siteUrl: SITE, now, news, events });
}

function personalise(
	d: Digest,
	lang: string,
	token: string,
	to: string,
): Email {
	const page = unsubscribePage(lang, token);
	return {
		to: [to],
		subject: d.subject,
		html: d.html.replaceAll(UNSUBSCRIBE_PLACEHOLDER, escapeHtml(page)),
		text: d.text.replaceAll(UNSUBSCRIBE_PLACEHOLDER, page),
		headers: {
			// One-click unsubscribe in Gmail / Apple Mail (RFC 8058).
			"List-Unsubscribe": `<${unsubscribeApi(token)}>`,
			"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
		},
	};
}

// ---------- Admin ----------

export type NewsletterAdmin = {
	authed: boolean;
	configured: {
		db: boolean;
		admin: boolean;
		email: boolean;
		verifiedSender: boolean;
		notifyEmail: boolean;
	};
	counts: {
		pending: number;
		active: number;
		unsubscribed: number;
		activeVi: number;
		activeEn: number;
	};
	sends: {
		id: number;
		subject: string;
		recipients: number;
		failed: number;
		sentAt: string;
	}[];
	preview: { vi: Digest; en: Digest } | null;
};

export const getNewsletterAdmin = createServerFn({ method: "GET" }).handler(
	async (): Promise<NewsletterAdmin> => {
		const configured = {
			db: isDbConfigured(),
			admin: isAdminConfigured(),
			email: isEmailConfigured(),
			verifiedSender: hasVerifiedSender(),
			notifyEmail: Boolean(process.env.NOTIFY_EMAIL),
		};
		const counts = {
			pending: 0,
			active: 0,
			unsubscribed: 0,
			activeVi: 0,
			activeEn: 0,
		};
		const authed = isAdminRequest();
		if (!authed || !configured.db)
			return { authed, configured, counts, sends: [], preview: null };
		const db = getDb();
		const grouped = await db
			.select({
				status: subscribers.status,
				lang: subscribers.lang,
				n: count(),
			})
			.from(subscribers)
			.groupBy(subscribers.status, subscribers.lang);
		for (const g of grouped) {
			counts[g.status] += g.n;
			if (g.status === "active")
				counts[g.lang === "en" ? "activeEn" : "activeVi"] += g.n;
		}
		const sends = await db
			.select()
			.from(newsletterSends)
			.orderBy(desc(newsletterSends.sentAt))
			.limit(10);
		const [vi, en] = await Promise.all([digestFor("vi"), digestFor("en")]);
		return {
			authed,
			configured,
			counts,
			sends: sends.map((s) => ({ ...s, sentAt: s.sentAt.toISOString() })),
			preview: { vi, en },
		};
	},
);

export const sendTestNewsletter = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z.object({ lang: z.enum(["vi", "en"]) }).parse(input),
	)
	.handler(async ({ data }) => {
		requireAdmin();
		const to = process.env.NOTIFY_EMAIL?.split(",")[0]?.trim();
		if (!to || !isEmailConfigured())
			return { ok: false as const, error: "not_configured" as const };
		const d = await digestFor(data.lang);
		const email = personalise(d, data.lang, "0".repeat(48), to);
		const ok = await sendEmail(
			{ ...email, subject: `[THỬ / TEST] ${email.subject}` },
			15000,
		);
		return ok
			? { ok: true as const, to }
			: { ok: false as const, error: "send_failed" as const };
	});

export const sendNewsletter = createServerFn({ method: "POST" }).handler(
	async () => {
		requireAdmin();
		if (!isEmailConfigured())
			return { ok: false as const, error: "not_configured" as const };
		const db = getDb();
		// Guard against double clicks / two editors sending at once.
		const [recent] = await db
			.select({ id: newsletterSends.id })
			.from(newsletterSends)
			.where(gte(newsletterSends.sentAt, new Date(Date.now() - 3600_000)));
		if (recent) return { ok: false as const, error: "recently_sent" as const };
		const list = await db
			.select()
			.from(subscribers)
			.where(eq(subscribers.status, "active"));
		if (list.length === 0)
			return { ok: false as const, error: "no_subscribers" as const };
		const [vi, en] = await Promise.all([digestFor("vi"), digestFor("en")]);
		const emails = list.map((s) =>
			personalise(s.lang === "en" ? en : vi, s.lang, s.token, s.email),
		);
		// Record first so a retry within the hour is blocked even if sending takes a while.
		const [send] = await db
			.insert(newsletterSends)
			.values({ subject: vi.subject, recipients: list.length })
			.returning({ id: newsletterSends.id });
		const { sent, failed } = await sendBatch(emails);
		await db
			.update(newsletterSends)
			.set({ failed })
			.where(eq(newsletterSends.id, send.id));
		return { ok: true as const, sent, failed };
	},
);
