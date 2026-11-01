import type { DictKey, L } from "./i18n";

/** Limits shared by the form (client) and the server function. */
export const LIMITS = {
	maxPhotos: 3,
	/** Per photo after client-side resizing. Vercel caps request bodies at 4.5 MB in total. */
	maxPhotoBytes: 1.4 * 1024 * 1024,
	/** Longest edge after resizing in the browser. */
	maxPhotoEdge: 2000,
	photoTypes: ["image/jpeg", "image/png", "image/webp"],
	perHour: 5,
	minFillMs: 3000,
} as const;

export const KINDS = [
	"story",
	"photo",
	"business",
	"event",
	"correction",
	"other",
] as const;
export type Kind = (typeof KINDS)[number];

export const kindLabel: Record<Kind, L> = {
	story: { vi: "Câu chuyện, ký ức", en: "Story or memory" },
	photo: { vi: "Ảnh quê hương", en: "Photos" },
	business: { vi: "Giới thiệu cơ sở kinh doanh", en: "Business listing" },
	event: { vi: "Sự kiện sắp tới", en: "Upcoming event" },
	correction: { vi: "Góp ý, sửa thông tin", en: "Correction" },
	other: { vi: "Khác", en: "Other" },
};

export type SubmitError =
	| "not_configured"
	| "invalid"
	| "photo_required"
	| "too_many_photos"
	| "photo_too_large"
	| "photo_type"
	| "uploads_unavailable"
	| "rate_limited"
	| "server";

export type SubmitResult = { ok: true } | { ok: false; error: SubmitError };

export const errorKey: Record<SubmitError, DictKey> = {
	not_configured: "contribute.err.notConfigured",
	invalid: "contribute.err.invalid",
	photo_required: "contribute.err.photoRequired",
	too_many_photos: "contribute.err.tooMany",
	photo_too_large: "contribute.err.tooLarge",
	photo_type: "contribute.err.type",
	uploads_unavailable: "contribute.err.uploads",
	rate_limited: "contribute.err.rate",
	server: "contribute.err.server",
};

/** Downscales an image in the browser and re-encodes it as JPEG so uploads stay small. */
export async function resizeImage(
	file: File,
): Promise<{ file: File; width: number; height: number }> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(
		1,
		LIMITS.maxPhotoEdge / Math.max(bitmap.width, bitmap.height),
	);
	const width = Math.round(bitmap.width * scale);
	const height = Math.round(bitmap.height * scale);
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas not supported");
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();
	let quality = 0.85;
	let blob: Blob | null = null;
	while (quality >= 0.5) {
		blob = await new Promise<Blob | null>((r) =>
			canvas.toBlob(r, "image/jpeg", quality),
		);
		if (blob && blob.size <= LIMITS.maxPhotoBytes) break;
		quality -= 0.1;
	}
	if (!blob) throw new Error("Could not encode image");
	const name = file.name.replace(/\.[^.]+$/, "") || "photo";
	return {
		file: new File([blob], `${name}.jpg`, { type: "image/jpeg" }),
		width,
		height,
	};
}

/** Slug prefix for published community stories in /news URLs, e.g. "cong-dong-12". */
export const STORY_PREFIX = "cong-dong-";
