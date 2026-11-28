import { createServerFn } from "@tanstack/react-start";
import { asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { toCsv } from "#/lib/csv";
import { audit, isAdminRequest, requireAdmin, requireOwner } from "./auth";
import { getDb, isDbConfigured } from "./db";
import { contributions, messages, subscribers } from "./schema";

export type AdminBadges = {
	contributions: number;
	guestbook: number;
	comment: number;
};

/** Pending counts for the admin tabs. Zeros when signed out or without a database. */
export const getAdminBadges = createServerFn({ method: "GET" }).handler(
	async (): Promise<AdminBadges> => {
		const none = { contributions: 0, guestbook: 0, comment: 0 };
		if (!isDbConfigured() || !(await isAdminRequest())) return none;
		const db = getDb();
		const [[c], m] = await Promise.all([
			db
				.select({ n: count() })
				.from(contributions)
				.where(eq(contributions.status, "pending")),
			db
				.select({ kind: messages.kind, n: count() })
				.from(messages)
				.where(eq(messages.status, "pending"))
				.groupBy(messages.kind),
		]);
		return {
			contributions: c?.n ?? 0,
			guestbook: m.find((r) => r.kind === "guestbook")?.n ?? 0,
			comment: m.find((r) => r.kind === "comment")?.n ?? 0,
		};
	},
);

const stamp = () => new Date().toISOString().slice(0, 10);
const iso = (d: Date | null) => (d ? d.toISOString() : "");

/** CSV of every contribution (editors). Contact details are included: handle with care. */
export const exportContributionsCsv = createServerFn({ method: "GET" }).handler(
	async () => {
		const me = await requireAdmin();
		const rows = await getDb()
			.select()
			.from(contributions)
			.orderBy(asc(contributions.id));
		await audit(me, "export_contributions", `${rows.length} mục`);
		return {
			filename: `dong-gop-${stamp()}.csv`,
			csv: toCsv(
				[
					"id",
					"loai",
					"trang_thai",
					"ngay_gui",
					"ten",
					"lien_he",
					"thon",
					"tieu_de",
					"noi_dung",
					"so_anh",
					"dong_y_dang",
					"da_dang_luc",
					"ghi_chu",
				],
				rows.map((r) => [
					r.id,
					r.kind,
					r.status,
					iso(r.createdAt),
					r.name,
					r.contact,
					r.village,
					r.title,
					r.message,
					r.photos.length,
					r.consent ? "co" : "khong",
					iso(r.publishedAt),
					r.adminNote,
				]),
			),
		};
	},
);

/** CSV of newsletter subscribers (owners only — it is a list of personal emails). */
export const exportSubscribersCsv = createServerFn({ method: "GET" })
	.validator((input: unknown) =>
		z.object({ all: z.boolean().default(false) }).parse(input ?? {}),
	)
	.handler(async ({ data }) => {
		const me = await requireOwner();
		const q = getDb().select().from(subscribers).orderBy(asc(subscribers.id));
		const rows = data.all
			? await q
			: await q.where(eq(subscribers.status, "active"));
		await audit(me, "export_subscribers", `${rows.length} email`);
		return {
			filename: `ban-tin-${stamp()}.csv`,
			csv: toCsv(
				["email", "ngon_ngu", "trang_thai", "dang_ky_luc", "xac_nhan_luc"],
				rows.map((r) => [
					r.email,
					r.lang,
					r.status,
					iso(r.createdAt),
					iso(r.confirmedAt),
				]),
			),
		};
	});
