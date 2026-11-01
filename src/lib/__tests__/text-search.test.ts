import { describe, expect, it } from "vitest";
import { search } from "../search";
import { fold } from "../text";

describe("fold", () => {
	it("removes Vietnamese diacritics and đ", () => {
		expect(fold("Đền Bà Triệu")).toBe("den ba trieu");
		expect(fold("Sông Lèn, Hậu Lộc")).toBe("song len, hau loc");
	});

	it("keeps the string length so match offsets stay valid", () => {
		for (const s of [
			"Đền Bà Triệu",
			"Người con xa quê 🌾",
			"Nghệ nhân",
			"ĐƯỜNG",
		]) {
			expect(fold(s)).toHaveLength(s.length);
		}
	});
});

describe("search", () => {
	it("is accent-insensitive and ranks title matches first", () => {
		const hits = search("vi", "den ba trieu");
		expect(hits.length).toBeGreaterThan(0);
		expect(hits[0].doc.title).toBe("Đền Bà Triệu");
		expect(hits[0].doc.hash).toBe("den-ba-trieu");
	});

	it("requires every word to match", () => {
		expect(
			search("vi", "nem chua").every((h) =>
				fold(`${h.doc.title} ${h.doc.text}`).includes("nem"),
			),
		).toBe(true);
		expect(search("vi", "zzzz khong co")).toHaveLength(0);
	});

	it("searches the English content", () => {
		expect(search("en", "Mount Tung").some((h) => h.doc.kind === "place")).toBe(
			true,
		);
	});

	it("returns nothing for an empty query", () => {
		expect(search("vi", "   ")).toEqual([]);
	});
});
