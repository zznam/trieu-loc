import { describe, expect, it } from "vitest";
import { buildDigest, UNSUBSCRIBE_PLACEHOLDER } from "../digest";

const base = {
	siteUrl: "https://trieuloc.example",
	now: new Date("2026-11-15T09:00:00+07:00"),
	news: [
		{
			title: "Tin <b>mới</b>",
			summary: "Tóm tắt & chi tiết",
			date: "1 tháng 11, 2026",
			url: "https://trieuloc.example/vi/news/a",
		},
		{
			title: "Chuyện làng",
			summary: "…",
			date: "2 tháng 11, 2026",
			url: "https://trieuloc.example/vi/news/cong-dong-1",
			community: true,
		},
	],
	events: [
		{
			title: "Hội thi",
			date: "5 tháng 12, 2026",
			lunar: "27/10 âm lịch",
			location: "Phú Điền",
			url: "https://trieuloc.example/vi/events#x",
		},
	],
};

describe("buildDigest", () => {
	it("builds a Vietnamese subject for the month", () => {
		const d = buildDigest({ ...base, lang: "vi" });
		expect(d.subject).toBe("Bản tin Triệu Lộc — tháng 11 năm 2026");
		expect(d.itemCount).toBe(3);
	});

	it("builds an English subject", () => {
		expect(buildDigest({ ...base, lang: "en" }).subject).toBe(
			"Triệu Lộc newsletter — November 2026",
		);
	});

	it("escapes content in the HTML", () => {
		const { html } = buildDigest({ ...base, lang: "vi" });
		expect(html).toContain("Tin &lt;b&gt;mới&lt;/b&gt;");
		expect(html).toContain("Tóm tắt &amp; chi tiết");
		expect(html).not.toContain("<b>mới</b>");
	});

	it("marks community stories and includes events with lunar dates", () => {
		const { html, text } = buildDigest({ ...base, lang: "vi" });
		expect(html).toContain("Bà con kể");
		expect(text).toContain(
			"Hội thi: 5 tháng 12, 2026 · 27/10 âm lịch · Phú Điền",
		);
	});

	it("leaves a per-recipient unsubscribe placeholder in both versions", () => {
		const d = buildDigest({ ...base, lang: "en" });
		expect(d.html).toContain(UNSUBSCRIBE_PLACEHOLDER);
		expect(d.text).toContain(UNSUBSCRIBE_PLACEHOLDER);
	});

	it("handles an empty month gracefully", () => {
		const d = buildDigest({ ...base, lang: "vi", news: [], events: [] });
		expect(d.itemCount).toBe(0);
		expect(d.html).toContain("Tháng này chưa có tin mới.");
		expect(d.text).toContain("Chưa có sự kiện nào");
	});
});
