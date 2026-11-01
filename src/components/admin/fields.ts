import type { CollectionName } from "#/lib/content-schemas";

// Declarative description of each collection's editor form.

export type Field =
	| {
			kind: "text";
			path: string;
			label: string;
			hint?: string;
			optional?: boolean;
	  }
	| { kind: "bilingual"; path: string; label: string; rows?: number }
	| {
			kind: "select";
			path: string;
			label: string;
			options: [string, string][];
			optional?: boolean;
	  }
	| { kind: "villageSelect"; path: string; label: string }
	| {
			kind: "number";
			path: string;
			label: string;
			optional?: boolean;
			min?: number;
			max?: number;
	  }
	| { kind: "checkbox"; path: string; label: string }
	| { kind: "coords"; path: string; label: string; optional?: boolean }
	| { kind: "lines"; path: string; label: string; hint: string }
	| {
			kind: "lang";
			lang: "vi" | "en";
			optional: boolean;
			fields: { key: string; label: string; rows?: number }[];
	  };

export const ID_HINT =
	"Chữ thường không dấu, số, gạch ngang — dùng trong đường dẫn, vd: den-ba-trieu";

export const FIELDS: Record<CollectionName, Field[]> = {
	places: [
		{ kind: "text", path: "id", label: "Mã (id)", hint: ID_HINT },
		{
			kind: "select",
			path: "category",
			label: "Loại",
			options: [
				["relic", "Di tích"],
				["nature", "Thiên nhiên"],
				["public", "Công cộng"],
			],
		},
		{ kind: "bilingual", path: "name", label: "Tên" },
		{ kind: "bilingual", path: "village", label: "Vị trí (thôn / khu vực)" },
		{ kind: "villageSelect", path: "villageId", label: "Gắn với trang thôn" },
		{ kind: "coords", path: "coords", label: "Toạ độ (vĩ độ, kinh độ)" },
		{ kind: "checkbox", path: "approx", label: "Vị trí gần đúng" },
		{ kind: "bilingual", path: "body", label: "Mô tả", rows: 4 },
	],
	villages: [
		{ kind: "text", path: "id", label: "Mã (id)", hint: ID_HINT },
		{
			kind: "select",
			path: "former",
			label: "Thuộc xã cũ",
			options: [
				["dai-loc", "Đại Lộc"],
				["trieu-loc", "Triệu Lộc"],
				["tien-loc", "Tiến Lộc"],
			],
		},
		{ kind: "bilingual", path: "name", label: "Tên thôn" },
		{ kind: "bilingual", path: "intro", label: "Giới thiệu", rows: 5 },
		{
			kind: "lines",
			path: "facts",
			label: "Điểm nổi bật",
			hint: "Mỗi dòng một ý; dòng tiếng Anh tương ứng cùng thứ tự",
		},
		{
			kind: "coords",
			path: "coords",
			label: "Toạ độ trung tâm thôn",
			optional: true,
		},
		{ kind: "text", path: "photo", label: "Ảnh (đường dẫn)", optional: true },
		{
			kind: "checkbox",
			path: "sample",
			label: "Thông tin mẫu (ẩn khỏi tìm kiếm & sitemap)",
		},
	],
	events: [
		{ kind: "text", path: "id", label: "Mã (id)", hint: ID_HINT },
		{
			kind: "select",
			path: "category",
			label: "Loại",
			options: [
				["festival", "Lễ hội"],
				["holiday", "Ngày lễ, Tết"],
				["community", "Cộng đồng"],
			],
		},
		{ kind: "bilingual", path: "title", label: "Tên sự kiện" },
		{ kind: "bilingual", path: "body", label: "Mô tả", rows: 3 },
		{ kind: "bilingual", path: "location", label: "Địa điểm" },
		{
			kind: "select",
			path: "date.calendar",
			label: "Lịch",
			options: [
				["lunar", "Âm lịch"],
				["solar", "Dương lịch"],
			],
		},
		{ kind: "number", path: "date.day", label: "Ngày", min: 1, max: 31 },
		{ kind: "number", path: "date.month", label: "Tháng", min: 1, max: 12 },
		{
			kind: "number",
			path: "date.year",
			label: "Năm (để trống = lặp lại hằng năm)",
			optional: true,
		},
		{
			kind: "number",
			path: "date.days",
			label: "Số ngày",
			optional: true,
			min: 1,
			max: 30,
		},
		{ kind: "villageSelect", path: "villageId", label: "Gắn với trang thôn" },
	],
	people: [
		{ kind: "text", path: "slug", label: "Đường dẫn (slug)", hint: ID_HINT },
		{
			kind: "select",
			path: "category",
			label: "Nhóm",
			options: [
				["history", "Nhân vật lịch sử"],
				["notable", "Người con quê hương"],
				["diaspora", "Người con xa quê"],
			],
		},
		{
			kind: "number",
			path: "order",
			label: "Thứ tự hiển thị (nhỏ trước)",
			min: 0,
		},
		{ kind: "villageSelect", path: "villageId", label: "Gắn với trang thôn" },
		{
			kind: "text",
			path: "photo",
			label: "Ảnh chân dung (đường dẫn)",
			optional: true,
		},
		...(["vi", "en"] as const).map(
			(lang): Field => ({
				kind: "lang",
				lang,
				optional: lang === "en",
				fields: [
					{ key: "name", label: "Họ tên" },
					{ key: "years", label: "Năm sinh – mất / thời kỳ" },
					{ key: "role", label: "Vai trò" },
					{ key: "village", label: "Quê / nơi ở" },
					{ key: "summary", label: "Tóm tắt", rows: 2 },
					{ key: "body", label: "Câu chuyện (Markdown)", rows: 10 },
				],
			}),
		),
	],
	news: [
		{
			kind: "text",
			path: "slug",
			label: "Đường dẫn (slug)",
			hint: "Ví dụ: 2026-12-01-hoi-thi-nau-com",
		},
		{ kind: "text", path: "date", label: "Ngày đăng (YYYY-MM-DD)" },
		...(["vi", "en"] as const).map(
			(lang): Field => ({
				kind: "lang",
				lang,
				optional: lang === "en",
				fields: [
					{ key: "title", label: "Tiêu đề" },
					{ key: "summary", label: "Tóm tắt", rows: 2 },
					{ key: "body", label: "Nội dung (Markdown)", rows: 12 },
				],
			}),
		),
	],
};

const L = { vi: "", en: "" };

export function newItem(collection: CollectionName): Record<string, unknown> {
	const today = new Date().toISOString().slice(0, 10);
	switch (collection) {
		case "places":
			return {
				id: "",
				category: "relic",
				name: { ...L },
				village: { ...L },
				coords: [19.9421, 105.8195],
				approx: true,
				body: { ...L },
			};
		case "villages":
			return {
				id: "",
				former: "trieu-loc",
				name: { ...L },
				intro: { ...L },
				facts: [],
				sample: false,
			};
		case "events":
			return {
				id: "",
				category: "community",
				title: { ...L },
				body: { ...L },
				location: { ...L },
				date: { calendar: "solar", day: 1, month: 1 },
			};
		case "people":
			return {
				slug: "",
				category: "notable",
				order: 100,
				vi: {
					name: "",
					years: "",
					role: "",
					village: "",
					summary: "",
					body: "",
				},
			};
		case "news":
			return {
				slug: `${today}-`,
				date: today,
				vi: { title: "", summary: "", body: "" },
			};
	}
}

/** Short label for the list view. */
export function itemTitle(
	collection: CollectionName,
	item: Record<string, unknown>,
): string {
	const get = (o: unknown, k: string) =>
		(o as Record<string, unknown> | undefined)?.[k];
	if (collection === "people") return String(get(item.vi, "name") ?? item.slug);
	if (collection === "news") return String(get(item.vi, "title") ?? item.slug);
	const l = (item.name ?? item.title) as { vi?: string } | undefined;
	return l?.vi || String(item.id);
}
