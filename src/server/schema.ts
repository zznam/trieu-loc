import {
	boolean,
	index,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const CONTRIBUTION_KINDS = [
	"story",
	"photo",
	"business",
	"event",
	"correction",
	"other",
] as const;
export const CONTRIBUTION_STATUSES = [
	"pending",
	"approved",
	"rejected",
] as const;

export const contributionKind = pgEnum("contribution_kind", CONTRIBUTION_KINDS);
export const contributionStatus = pgEnum(
	"contribution_status",
	CONTRIBUTION_STATUSES,
);

export type StoredPhoto = {
	url: string;
	pathname: string;
	width: number;
	height: number;
};

export const contributions = pgTable(
	"contributions",
	{
		id: serial("id").primaryKey(),
		kind: contributionKind("kind").notNull(),
		status: contributionStatus("status").notNull().default("pending"),
		name: varchar("name", { length: 120 }).notNull(),
		contact: varchar("contact", { length: 200 }),
		village: varchar("village", { length: 120 }),
		title: varchar("title", { length: 200 }).notNull(),
		message: text("message").notNull(),
		photos: jsonb("photos").$type<StoredPhoto[]>().notNull().default([]),
		lang: varchar("lang", { length: 2 }).notNull().default("vi"),
		/** Contributor agreed that the content (and their name) may be published on the site. */
		consent: boolean("consent").notNull().default(false),
		/** Salted hash of the sender's IP, used only for rate limiting. */
		ipHash: varchar("ip_hash", { length: 64 }),
		adminNote: text("admin_note"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
	},
	(t) => [
		index("contributions_status_created_idx").on(t.status, t.createdAt),
		index("contributions_ip_created_idx").on(t.ipHash, t.createdAt),
	],
);

export type Contribution = typeof contributions.$inferSelect;
export type ContributionKind = (typeof CONTRIBUTION_KINDS)[number];
export type ContributionStatus = (typeof CONTRIBUTION_STATUSES)[number];
