import { del, put } from "@vercel/blob";
import type { StoredPhoto } from "./schema";

export function isBlobConfigured() {
	return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Stores an uploaded photo in Vercel Blob under a random, unguessable path. */
export async function storePhoto(
	file: File,
	width: number,
	height: number,
): Promise<StoredPhoto> {
	const ext =
		file.type === "image/png"
			? "png"
			: file.type === "image/webp"
				? "webp"
				: "jpg";
	const blob = await put(
		`contributions/${new Date().toISOString().slice(0, 7)}/photo.${ext}`,
		file,
		{
			access: "public",
			addRandomSuffix: true,
			contentType: file.type,
		},
	);
	return { url: blob.url, pathname: blob.pathname, width, height };
}

export async function deletePhotos(photos: StoredPhoto[]) {
	if (photos.length && isBlobConfigured()) await del(photos.map((p) => p.url));
}
