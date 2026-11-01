import { describe, expect, it } from "vitest";
import { imageUrlsIn, isManagedImage } from "../images";

describe("managed images", () => {
	it("only claims images uploaded by the editor", () => {
		expect(isManagedImage("/api/uploads/0123456789abcdef01234567.jpg")).toBe(
			true,
		);
		expect(
			isManagedImage(
				"https://abc.public.blob.vercel-storage.com/content/places/photo-x1.jpg",
			),
		).toBe(true);
		// Contribution photos and external links are never deleted by the editor
		expect(
			isManagedImage(
				"https://abc.public.blob.vercel-storage.com/contributions/2026-11/photo.jpg",
			),
		).toBe(false);
		expect(isManagedImage("https://example.com/a.jpg")).toBe(false);
		expect(isManagedImage("/og/home-vi.jpg")).toBe(false);
	});

	it("finds image URLs anywhere in an item", () => {
		const item = {
			id: "x",
			photo: "/api/uploads/aaaaaaaaaaaaaaaaaaaaaaaa.jpg",
			nested: {
				list: [
					{
						src: "https://abc.public.blob.vercel-storage.com/content/gallery/photo-y.jpg",
					},
				],
			},
			other: "https://example.com/not-ours.jpg",
		};
		expect(imageUrlsIn(item).sort()).toEqual([
			"/api/uploads/aaaaaaaaaaaaaaaaaaaaaaaa.jpg",
			"https://abc.public.blob.vercel-storage.com/content/gallery/photo-y.jpg",
		]);
		expect(imageUrlsIn(null)).toEqual([]);
	});
});
