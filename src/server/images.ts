// Server-only image storage for the content editor.
// Production: Vercel Blob. Local development / E2E: files in .data/uploads served by
// /api/uploads/<name>, enabled explicitly with LOCAL_UPLOADS=1.
import { randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, list, put } from "@vercel/blob";
import { isBlobConfigured } from "./storage";

const LOCAL_DIR = path.resolve(".data/uploads");
const LOCAL_PREFIX = "/api/uploads/";
export const LOCAL_NAME = /^[a-f0-9]{24}\.(jpg|png|webp)$/;

export const localUploadsEnabled = () => process.env.LOCAL_UPLOADS === "1";
export const imageUploadsAvailable = () =>
	isBlobConfigured() || localUploadsEnabled();

const EXT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export async function storeImage(file: File, folder: string): Promise<string> {
	const ext = EXT[file.type] ?? "jpg";
	if (isBlobConfigured()) {
		const blob = await put(`content/${folder}/photo.${ext}`, file, {
			access: "public",
			addRandomSuffix: true,
			contentType: file.type,
		});
		return blob.url;
	}
	if (!localUploadsEnabled()) throw new Error("No image storage configured");
	await mkdir(LOCAL_DIR, { recursive: true });
	const name = `${randomBytes(12).toString("hex")}.${ext}`;
	await writeFile(
		path.join(LOCAL_DIR, name),
		Buffer.from(await file.arrayBuffer()),
	);
	return `${LOCAL_PREFIX}${name}`;
}

/** True for images this editor uploaded (and is therefore allowed to delete). */
export function isManagedImage(url: string) {
	return (
		url.startsWith(LOCAL_PREFIX) ||
		/\.blob\.vercel-storage\.com\/content\//.test(url)
	);
}

export async function deleteImages(urls: string[]) {
	const managed = urls.filter(isManagedImage);
	const blobs = managed.filter((u) => !u.startsWith(LOCAL_PREFIX));
	if (blobs.length && isBlobConfigured()) await del(blobs);
	for (const u of managed.filter((u) => u.startsWith(LOCAL_PREFIX))) {
		const name = u.slice(LOCAL_PREFIX.length);
		if (LOCAL_NAME.test(name))
			await unlink(path.join(LOCAL_DIR, name)).catch(() => {});
	}
}

/** Every image the editor has stored (for the "remove unused photos" clean-up). */
export async function listManagedImages(): Promise<string[]> {
	const urls: string[] = [];
	if (isBlobConfigured()) {
		let cursor: string | undefined;
		do {
			const page = await list({ prefix: "content/", cursor, limit: 1000 });
			urls.push(...page.blobs.map((b) => b.url));
			cursor = page.hasMore ? page.cursor : undefined;
		} while (cursor);
	}
	if (localUploadsEnabled()) {
		const names = await readdir(LOCAL_DIR).catch(() => [] as string[]);
		urls.push(
			...names
				.filter((n) => LOCAL_NAME.test(n))
				.map((n) => `${LOCAL_PREFIX}${n}`),
		);
	}
	return urls;
}

export async function readLocalImage(name: string) {
	if (!localUploadsEnabled() || !LOCAL_NAME.test(name)) return null;
	try {
		return await readFile(path.join(LOCAL_DIR, name));
	} catch {
		return null;
	}
}

/** All image URLs that appear anywhere inside a JSON value. */
export function imageUrlsIn(value: unknown): string[] {
	const found = new Set<string>();
	const walk = (v: unknown) => {
		if (typeof v === "string") {
			if (isManagedImage(v)) found.add(v);
		} else if (Array.isArray(v)) v.forEach(walk);
		else if (v && typeof v === "object") Object.values(v).forEach(walk);
	};
	walk(value);
	return [...found];
}
