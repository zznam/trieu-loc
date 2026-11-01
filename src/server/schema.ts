import {
	boolean,
	date,
	index,
	integer,
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
		/** Set when an editor publishes the item to the public site; null = not live. */
		publishedAt: timestamp("published_at", { withTimezone: true }),
		/** What the sender originally wrote, saved the first time an editor changes the text. */
		original: jsonb("original").$type<{ title: string; message: string }>(),
		/** Optional link to a village page (src/content/villages.json id). */
		villageId: varchar("village_id", { length: 60 }),
		// Event details (kind = "event")
		eventDate: date("event_date", { mode: "string" }),
		eventDays: integer("event_days").notNull().default(1),
		eventLocation: varchar("event_location", { length: 200 }),
		// Business details (kind = "business"); the phone is public, unlike `contact`.
		businessCategory: varchar("business_category", { length: 80 }),
		businessPhone: varchar("business_phone", { length: 40 }),
	},
	(t) => [
		index("contributions_status_created_idx").on(t.status, t.createdAt),
		index("contributions_ip_created_idx").on(t.ipHash, t.createdAt),
		index("contributions_kind_published_idx").on(t.kind, t.publishedAt),
	],
);

export type Contribution = typeof contributions.$inferSelect;
export type ContributionKind = (typeof CONTRIBUTION_KINDS)[number];
export type ContributionStatus = (typeof CONTRIBUTION_STATUSES)[number];
