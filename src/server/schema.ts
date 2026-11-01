import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
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

// ---------- Community messages: guestbook entries and page comments ----------

export const MESSAGE_KINDS = ["guestbook", "comment"] as const;
export const messageKind = pgEnum("message_kind", MESSAGE_KINDS);

export const messages = pgTable(
	"messages",
	{
		id: serial("id").primaryKey(),
		kind: messageKind("kind").notNull(),
		/** For comments: the page it belongs to, e.g. "news:2026-11-01-ra-mat-trang-web". Null for the guestbook. */
		target: varchar("target", { length: 160 }),
		/** Reuses the contribution statuses: nothing is public until approved. */
		status: contributionStatus("status").notNull().default("pending"),
		name: varchar("name", { length: 80 }).notNull(),
		/** Where the writer is (e.g. "TP. Hồ Chí Minh", "Đức"). */
		place: varchar("place", { length: 80 }),
		message: text("message").notNull(),
		lang: varchar("lang", { length: 2 }).notNull().default("vi"),
		ipHash: varchar("ip_hash", { length: 64 }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
	},
	(t) => [
		index("messages_kind_status_created_idx").on(t.kind, t.status, t.createdAt),
		index("messages_target_status_idx").on(t.target, t.status),
		index("messages_ip_created_idx").on(t.ipHash, t.createdAt),
	],
);

export type Message = typeof messages.$inferSelect;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

// ---------- Reactions: one ❤️ per visitor per page ----------

export const reactions = pgTable(
	"reactions",
	{
		/** Same format as message targets, e.g. "news:<slug>". */
		target: varchar("target", { length: 160 }).notNull(),
		ipHash: varchar("ip_hash", { length: 64 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [primaryKey({ columns: [t.target, t.ipHash] })],
);

// ---------- Newsletter ----------

export const SUBSCRIBER_STATUSES = [
	"pending",
	"active",
	"unsubscribed",
] as const;
export const subscriberStatus = pgEnum(
	"subscriber_status",
	SUBSCRIBER_STATUSES,
);

export const subscribers = pgTable(
	"subscribers",
	{
		id: serial("id").primaryKey(),
		/** Stored lower-cased. */
		email: varchar("email", { length: 254 }).notNull().unique(),
		lang: varchar("lang", { length: 2 }).notNull().default("vi"),
		status: subscriberStatus("status").notNull().default("pending"),
		/** Random secret used in confirm and unsubscribe links. */
		token: varchar("token", { length: 64 }).notNull().unique(),
		ipHash: varchar("ip_hash", { length: 64 }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
		unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
	},
	(t) => [
		index("subscribers_status_idx").on(t.status),
		index("subscribers_ip_created_idx").on(t.ipHash, t.createdAt),
	],
);

export const newsletterSends = pgTable("newsletter_sends", {
	id: serial("id").primaryKey(),
	subject: varchar("subject", { length: 200 }).notNull(),
	recipients: integer("recipients").notNull(),
	failed: integer("failed").notNull().default(0),
	sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Editable site content (imported once from the files, then edited in /admin) ----------

export const contentItems = pgTable(
	"content_items",
	{
		/** places | villages | events | people | news */
		collection: varchar("collection", { length: 20 }).notNull(),
		/** The item's id / slug. */
		id: varchar("id", { length: 120 }).notNull(),
		data: jsonb("data").notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [primaryKey({ columns: [t.collection, t.id] })],
);
