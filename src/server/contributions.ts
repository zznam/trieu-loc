import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { and, count, desc, eq, gte, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { LIMITS, type SubmitResult } from "#/lib/contribute";
import {
	audit,
	currentAdmin,
	isAdminConfigured,
	isAdminRequest,
	type LoginResult,
	login,
	logout,
	requireAdmin,
} from "./auth";
import { getDb, isDbConfigured } from "./db";
import { isNotifyConfigured, notifyNewSubmission } from "./notify";
import {
	CONTRIBUTION_KINDS,
	CONTRIBUTION_STATUSES,
	type ContributionStatus,
	contributions,
	type StoredPhoto,
} from "./schema";
import { deletePhotos, isBlobConfigured, storePhoto } from "./storage";

const fields = z.object({
	kind: z.enum(CONTRIBUTION_KINDS),
	name: z.string().trim().min(1).max(120),
	contact: z.string().trim().max(200).optional().default(""),
	village: z.string().trim().max(120).optional().default(""),
	title: z.string().trim().min(1).max(200),
	message: z.string().trim().min(1).max(5000),
	lang: z.enum(["vi", "en"]).default("vi"),
	consent: z.literal("on").optional(),
	website: z.string().optional().default(""), // honeypot: real people never fill this
	startedAt: z.coerce.number().optional().default(0),
	dims: z.string().optional().default("[]"), // JSON [[w,h], …] measured on the client
});

type Parsed = { data: z.infer<typeof fields>; photos: File[] };

function hashIp(ip: string) {
	return createHash("sha256")
		.update(`${process.env.ADMIN_PASSWORD ?? "trieu-loc"}:${ip}`)
		.digest("hex");
}

// ---------- Public: submit a contribution ----------

export const submitContribution = createServerFn({ method: "POST" })
	.validator((input: FormData): Parsed | { invalid: true } => {
		if (!(input instanceof FormData)) return { invalid: true };
		const raw: Record<string, string> = {};
		for (const [k, v] of input.entries()) if (typeof v === "string") raw[k] = v;
		const parsed = fields.safeParse(raw);
		if (!parsed.success) return { invalid: true };
		const photos = input
			.getAll("photos")
			.filter((v): v is File => v instanceof File && v.size > 0);
		return { data: parsed.data, photos };
	})
	.handler(async ({ data: input }): Promise<SubmitResult> => {
		if ("invalid" in input) return { ok: false, error: "invalid" };
		const { data, photos } = input;

		// Bots: honeypot filled or form submitted inhumanly fast. Pretend success, store nothing.
		if (
			data.website ||
			(data.startedAt && Date.now() - data.startedAt < LIMITS.minFillMs)
		)
			return { ok: true };

		if (!isDbConfigured()) return { ok: false, error: "not_configured" };
		if (data.kind === "photo" && photos.length === 0)
			return { ok: false, error: "photo_required" };
		if (photos.length > LIMITS.maxPhotos)
			return { ok: false, error: "too_many_photos" };
		for (const p of photos) {
			if (!(LIMITS.photoTypes as readonly string[]).includes(p.type))
				return { ok: false, error: "photo_type" };
			if (p.size > LIMITS.maxPhotoBytes)
				return { ok: false, error: "photo_too_large" };
		}
		if (photos.length && !isBlobConfigured())
			return { ok: false, error: "uploads_unavailable" };

		try {
			const db = getDb();
			const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
			const ipHash = hashIp(ip);
			const [{ recent }] = await db
				.select({ recent: count() })
				.from(contributions)
				.where(
					and(
						eq(contributions.ipHash, ipHash),
						gte(contributions.createdAt, new Date(Date.now() - 3600_000)),
					),
				);
			if (recent >= LIMITS.perHour) return { ok: false, error: "rate_limited" };

			let dims: [number, number][] = [];
			try {
				dims = JSON.parse(data.dims);
			} catch {}
			const stored: StoredPhoto[] = [];
			for (const [i, file] of photos.entries()) {
				const [w, h] = dims[i] ?? [0, 0];
				stored.push(await storePhoto(file, Number(w) || 0, Number(h) || 0));
			}

			await db.insert(contributions).values({
				kind: data.kind,
				name: data.name,
				contact: data.contact || null,
				village: data.village || null,
				title: data.title,
				message: data.message,
				photos: stored,
				lang: data.lang,
				consent: data.consent === "on",
				ipHash,
			});
			// Awaited (serverless functions may stop once the response is sent) but time-boxed
			// to 5 s, and any failure is swallowed: the submission is already saved.
			await notifyNewSubmission({
				kind: data.kind,
				title: data.title,
				message: data.message,
				name: data.name,
				village: data.village,
				contact: data.contact,
				lang: data.lang,
				consent: data.consent === "on",
				photoCount: stored.length,
			});
			return { ok: true };
		} catch (err) {
			console.error("submitContribution failed", err);
			return { ok: false, error: "server" };
		}
	});

// ---------- Public: approved photos for the gallery ----------

export type CommunityPhoto = {
	id: number;
	title: string;
	name: string;
	village: string | null;
	photos: StoredPhoto[];
	createdAt: string;
};

export const getCommunityPhotos = createServerFn({ method: "GET" }).handler(
	async (): Promise<CommunityPhoto[]> => {
		if (!isDbConfigured()) return [];
		try {
			const rows = await getDb()
				.select({
					id: contributions.id,
					title: contributions.title,
					name: contributions.name,
					village: contributions.village,
					photos: contributions.photos,
					createdAt: contributions.createdAt,
				})
				.from(contributions)
				.where(
					and(
						eq(contributions.kind, "photo"),
						eq(contributions.status, "approved"),
						eq(contributions.consent, true),
						isNotNull(contributions.publishedAt),
					),
				)
				.orderBy(desc(contributions.createdAt))
				.limit(48);
			return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
		} catch (err) {
			console.error("getCommunityPhotos failed", err);
			return [];
		}
	},
);

// ---------- Admin ----------

export type AdminContribution = {
	id: number;
	kind: string;
	status: ContributionStatus;
	name: string;
	contact: string | null;
	village: string | null;
	title: string;
	message: string;
	photos: StoredPhoto[];
	lang: string;
	consent: boolean;
	adminNote: string | null;
	createdAt: string;
	reviewedAt: string | null;
	publishedAt: string | null;
	original: { title: string; message: string } | null;
	villageId: string | null;
	eventDate: string | null;
	eventDays: number;
	eventLocation: string | null;
	businessCategory: string | null;
	businessPhone: string | null;
};

export type AdminState = {
	configured: { db: boolean; blob: boolean; admin: boolean; notify: boolean };
	authed: boolean;
	counts: Record<ContributionStatus, number>;
	items: AdminContribution[];
};

const statusFilter = z.object({
	status: z.enum(CONTRIBUTION_STATUSES).default("pending"),
});

export const getAdminState = createServerFn({ method: "GET" })
	.validator((input: unknown) => statusFilter.parse(input ?? {}))
	.handler(async ({ data }): Promise<AdminState> => {
		const configured = {
			db: isDbConfigured(),
			blob: isBlobConfigured(),
			admin: isAdminConfigured(),
			notify: isNotifyConfigured(),
		};
		const counts = { pending: 0, approved: 0, rejected: 0 };
		const authed = await isAdminRequest();
		if (!authed || !configured.db) {
			return { configured, authed, counts, items: [] };
		}
		const db = getDb();
		const grouped = await db
			.select({ status: contributions.status, n: count() })
			.from(contributions)
			.groupBy(contributions.status);
		for (const g of grouped) counts[g.status] = g.n;
		const rows = await db
			.select()
			.from(contributions)
			.where(eq(contributions.status, data.status))
			.orderBy(desc(contributions.createdAt))
			.limit(200);
		return {
			configured,
			authed: true,
			counts,
			items: rows.map(({ ipHash: _ip, ...r }) => ({
				...r,
				createdAt: r.createdAt.toISOString(),
				reviewedAt: r.reviewedAt?.toISOString() ?? null,
				publishedAt: r.publishedAt?.toISOString() ?? null,
			})),
		};
	});

/** Email + password sign-in (or the shared ADMIN_PASSWORD while no accounts exist). */
export const adminLogin = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				email: z.string().max(254).default(""),
				password: z.string().max(200),
			})
			.parse(input),
	)
	.handler(
		({ data }): Promise<LoginResult> => login(data.email, data.password),
	);

export const adminLogout = createServerFn({ method: "POST" }).handler(
	async () => {
		await audit(await currentAdmin(), "logout");
		await logout();
		return { ok: true as const };
	},
);

export const reviewContribution = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				id: z.number().int().positive(),
				status: z.enum(CONTRIBUTION_STATUSES),
				note: z.string().max(1000).optional(),
			})
			.parse(input),
	)
	.handler(async ({ data }) => {
		const me = await requireAdmin();
		await audit(me, `contribution_${data.status}`, `#${data.id}`);
		await getDb()
			.update(contributions)
			.set({
				status: data.status,
				adminNote: data.note ?? null,
				reviewedAt: data.status === "pending" ? null : new Date(),
				// Only approved items can stay live.
				...(data.status === "approved" ? {} : { publishedAt: null }),
			})
			.where(eq(contributions.id, data.id));
		return { ok: true as const };
	});

// ---------- Admin: edit & publish ----------

const editInput = z.object({
	id: z.number().int().positive(),
	title: z.string().trim().min(1).max(200),
	message: z.string().trim().min(1).max(5000),
	villageId: z.string().max(60).nullable(),
	eventDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.nullable(),
	eventDays: z.number().int().min(1).max(30),
	eventLocation: z.string().trim().max(200).nullable(),
	businessCategory: z.string().trim().max(80).nullable(),
	businessPhone: z.string().trim().max(40).nullable(),
});

/** Saves an editor's changes; the sender's original wording is kept the first time the text changes. */
export const updateContribution = createServerFn({ method: "POST" })
	.validator((input: unknown) => editInput.parse(input))
	.handler(async ({ data }) => {
		const me = await requireAdmin();
		await audit(me, "contribution_edit", `#${data.id}`);
		const db = getDb();
		const [row] = await db
			.select({
				title: contributions.title,
				message: contributions.message,
				original: contributions.original,
			})
			.from(contributions)
			.where(eq(contributions.id, data.id));
		if (!row) return { ok: false as const, error: "not_found" };
		const textChanged =
			row.title !== data.title || row.message !== data.message;
		await db
			.update(contributions)
			.set({
				title: data.title,
				message: data.message,
				villageId: data.villageId || null,
				eventDate: data.eventDate || null,
				eventDays: data.eventDays,
				eventLocation: data.eventLocation || null,
				businessCategory: data.businessCategory || null,
				businessPhone: data.businessPhone || null,
				...(textChanged && !row.original
					? { original: { title: row.title, message: row.message } }
					: {}),
			})
			.where(eq(contributions.id, data.id));
		return { ok: true as const };
	});

export type PublishError =
	| "not_found"
	| "no_consent"
	| "unsupported"
	| "missing_date"
	| "missing_photo";

/** Puts an item live (approving it) or takes it down. */
export const setPublished = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({ id: z.number().int().positive(), publish: z.boolean() })
			.parse(input),
	)
	.handler(
		async ({
			data,
		}): Promise<{ ok: true } | { ok: false; error: PublishError }> => {
			const me = await requireAdmin();
			await audit(
				me,
				data.publish ? "contribution_publish" : "contribution_unpublish",
				`#${data.id}`,
			);
			const db = getDb();
			if (!data.publish) {
				await db
					.update(contributions)
					.set({ publishedAt: null })
					.where(eq(contributions.id, data.id));
				return { ok: true };
			}
			const [row] = await db
				.select()
				.from(contributions)
				.where(eq(contributions.id, data.id));
			if (!row) return { ok: false, error: "not_found" };
			// The sender's name is shown publicly, so publishing requires their consent.
			if (!row.consent) return { ok: false, error: "no_consent" };
			if (!["story", "event", "business", "photo"].includes(row.kind))
				return { ok: false, error: "unsupported" };
			if (row.kind === "event" && !row.eventDate)
				return { ok: false, error: "missing_date" };
			if (row.kind === "photo" && row.photos.length === 0)
				return { ok: false, error: "missing_photo" };
			await db
				.update(contributions)
				.set({
					status: "approved",
					reviewedAt: row.reviewedAt ?? new Date(),
					publishedAt: new Date(),
				})
				.where(eq(contributions.id, data.id));
			return { ok: true };
		},
	);

export const deleteContribution = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z.object({ id: z.number().int().positive() }).parse(input),
	)
	.handler(async ({ data }) => {
		const me = await requireAdmin();
		await audit(me, "contribution_delete", `#${data.id}`);
		const db = getDb();
		const [row] = await db
			.delete(contributions)
			.where(eq(contributions.id, data.id))
			.returning({ photos: contributions.photos });
		if (row) await deletePhotos(row.photos);
		return { ok: true as const };
	});
