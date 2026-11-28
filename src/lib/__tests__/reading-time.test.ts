import { describe, expect, it } from "vitest";
import { readingMinutes, WORDS_PER_MINUTE } from "../text";

const words = (n: number) => Array.from({ length: n }, () => "lúa").join(" ");

describe("readingMinutes", () => {
	it("is at least one minute, even for empty text", () => {
		expect(readingMinutes("")).toBe(1);
		expect(readingMinutes("Xin chào")).toBe(1);
	});

	it("rounds up by words per minute", () => {
		expect(readingMinutes(words(WORDS_PER_MINUTE))).toBe(1);
		expect(readingMinutes(words(WORDS_PER_MINUTE + 1))).toBe(2);
		expect(readingMinutes(words(WORDS_PER_MINUTE * 5))).toBe(5);
	});

	it("ignores Markdown syntax, link targets, images, code and tags", () => {
		const md = [
			"# Tiêu đề",
			"> - **một** _hai_",
			"![ảnh](https://example.com/a-very-long-image-url.jpg)",
			"[ba](https://example.com/link)",
			"```\nconst ignored = words + many + tokens;\n```",
			"<br/> --- | |",
		].join("\n");
		// Counted: Tiêu, đề, một, hai, ba
		expect(readingMinutes(md + words(WORDS_PER_MINUTE - 5))).toBe(1);
		expect(readingMinutes(md + words(WORDS_PER_MINUTE - 4))).toBe(2);
	});
});
