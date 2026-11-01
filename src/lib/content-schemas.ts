import { z } from "zod";

// Shapes of editable content items, shared by the admin editor (client) and the server.
// They mirror the JSON / Markdown files the site started with.

const slug = z
	.string()
	.trim()
	.regex(
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
		"Chỉ dùng chữ thường không dấu, số và dấu gạch ngang",
	);
const text = (max: number) => z.string().trim().max(max);
const L = (max = 300) =>
	z.object({ vi: text(max).min(1), en: text(max).min(1) });
const coords = z.tuple([
	z.number().min(-90).max(90),
	z.number().min(-180).max(180),
]);

export const placeSchema = z.object({
	id: slug,
	category: z.enum(["relic", "nature", "public"]),
	name: L(150),
	village: L(150),
	coords,
	approx: z.boolean(),
	body: L(2000),
	villageId: slug.optional(),
	photo: text(500).optional(),
});

export const villageSchema = z.object({
	id: slug,
	former: z.enum(["dai-loc", "trieu-loc", "tien-loc"]),
	name: L(120),
	intro: L(3000),
	facts: z.array(L(300)).max(20),
	coords: coords.optional(),
	photo: text(300).optional(),
	sample: z.boolean(),
});

export const eventSchema = z
	.object({
		id: slug,
		category: z.enum(["festival", "holiday", "community"]),
		title: L(200),
		body: L(2000),
		location: L(200),
		date: z.object({
			calendar: z.enum(["lunar", "solar"]),
			day: z.number().int().min(1).max(31),
			month: z.number().int().min(1).max(12),
			year: z.number().int().min(1900).max(2200).optional(),
			days: z.number().int().min(1).max(30).optional(),
		}),
		villageId: slug.optional(),
	})
	.refine((e) => e.date.calendar === "solar" || e.date.day <= 30, {
		message: "Ngày âm lịch tối đa là 30",
		path: ["date", "day"],
	});

const personLang = z.object({
	name: text(150).min(1),
	years: text(80),
	role: text(200),
	village: text(150),
	summary: text(400),
	body: text(20000),
});

export const personSchema = z.object({
	slug,
	category: z.enum(["history", "notable", "diaspora"]),
	order: z.number().int().min(0).max(10000),
	villageId: slug.optional(),
	photo: text(300).optional(),
	vi: personLang,
	en: personLang.optional(),
});

const newsLang = z.object({
	title: text(200).min(1),
	summary: text(400),
	body: text(30000),
});

export const newsSchema = z.object({
	slug,
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	/** Optional scheduled publish time, Vietnam time "YYYY-MM-DDTHH:mm"; hidden until then. */
	publishAt: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
		.optional(),
	vi: newsLang,
	en: newsLang.optional(),
});

const Lopt = (max = 300) =>
	z.object({ vi: text(max), en: text(max) }).optional();

export const specialtySchema = z.object({
	id: slug,
	name: L(150),
	tag: L(80),
	body: L(1000),
	photo: text(500).optional(),
});

export const businessSchema = z.object({
	id: slug,
	name: text(150).min(1),
	category: L(80),
	village: L(150),
	phone: text(40),
	body: L(1000),
});

export const galleryItemSchema = z.object({
	id: slug,
	caption: L(200),
	season: z.enum(["spring", "summer", "autumn", "winter"]),
	/** Image URL; empty = illustrated placeholder. */
	src: text(500),
});

export const contactSchema = z.object({
	id: slug,
	group: z.enum(["emergency", "commune", "schools", "heritage"]),
	order: z.number().int().min(0).max(1000),
	name: L(150),
	phone: text(40),
	address: Lopt(200),
	hours: Lopt(200),
	sample: z.boolean().optional(),
});

/** Single item (id "main"): site-wide texts used on the home page, footer and stats strip. */
export const siteSchema = z.object({
	id: z.literal("main"),
	name: L(100),
	province: L(100),
	center: coords,
	stats: z.object({
		area: text(40),
		population: text(40),
		villages: text(40),
		distance: text(40),
	}),
	contact: z.object({
		email: z.string().trim().email(),
		facebook: text(300),
		address: L(300),
	}),
	highlights: z
		.array(
			z.object({
				title: L(150),
				body: L(400),
				to: z.enum(["places", "history", "food"]),
			}),
		)
		.max(6),
});

/** Single item (id "main"): the History & Culture page. */
export const historySchema = z.object({
	id: z.literal("main"),
	intro: L(3000),
	timeline: z
		.array(z.object({ year: L(40), title: L(150), body: L(1000) }))
		.max(50),
	figure: z.object({ quote: L(1000), body: L(3000) }),
	traditions: z.array(z.object({ title: L(150), body: L(2000) })).max(20),
});

export const COLLECTIONS = {
	places: placeSchema,
	villages: villageSchema,
	events: eventSchema,
	people: personSchema,
	news: newsSchema,
	specialties: specialtySchema,
	businesses: businessSchema,
	gallery: galleryItemSchema,
	contacts: contactSchema,
	site: siteSchema,
	history: historySchema,
} as const;

/** Collections that hold exactly one item with id "main". */
export const SINGLETONS = ["site", "history"] as const;
export const isSingleton = (c: string) =>
	(SINGLETONS as readonly string[]).includes(c);

export type CollectionName = keyof typeof COLLECTIONS;
export const COLLECTION_NAMES = Object.keys(COLLECTIONS) as CollectionName[];

export type PlaceItem = z.infer<typeof placeSchema>;
export type VillageItem = z.infer<typeof villageSchema>;
export type EventItem = z.infer<typeof eventSchema>;
export type PersonItem = z.infer<typeof personSchema>;
export type NewsItem = z.infer<typeof newsSchema>;

export type SpecialtyItem = z.infer<typeof specialtySchema>;
export type BusinessItem = z.infer<typeof businessSchema>;
export type GalleryItemData = z.infer<typeof galleryItemSchema>;
export type ContactItem = z.infer<typeof contactSchema>;
export type SiteItem = z.infer<typeof siteSchema>;
export type HistoryItem = z.infer<typeof historySchema>;

export type ContentData = {
	places: PlaceItem[];
	villages: VillageItem[];
	events: EventItem[];
	people: PersonItem[];
	news: NewsItem[];
	specialties: SpecialtyItem[];
	businesses: BusinessItem[];
	gallery: GalleryItemData[];
	contacts: ContactItem[];
	site: SiteItem[];
	history: HistoryItem[];
};

export type ContentSnapshot = Partial<ContentData> & {
	/** Changes whenever any item changes; lets clients skip re-applying identical content. */
	version: string;
	/** Collections that live in the database. Others keep using the bundled files. */
	imported: CollectionName[];
};

/** Item id (slug for people and news). */
export const itemId = (
	collection: CollectionName,
	item: Record<string, unknown>,
) =>
	String(
		collection === "people" || collection === "news" ? item.slug : item.id,
	);

/** Plain JSON values (what content items are made of). */
export type Json =
	| string
	| number
	| boolean
	| null
	| Json[]
	| { [key: string]: Json };
export type JsonObject = { [key: string]: Json };
