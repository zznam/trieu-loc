import { describe, expect, it } from "vitest";
import { upcomingEvents } from "../events";
import { buildIcs, buildRss, feedPath, foldLine } from "../feeds";
import { nextLunarDay, solarToLunar, toISO } from "../lunar";
import { readingMinutes, relatedPosts } from "../reading";

describe("RSS feed", () => {
	const xml = buildRss({
		lang: "vi",
		title: "Tin <Triệu Lộc>",
		description: "Mô tả & thông báo",
		link: "https://x.vn/vi/news",
		self: "https://x.vn/feeds/news-vi.xml",
		items: [
			{
				title: "Cũ",
				url: "https://x.vn/vi/news/a",
				date: "2026-01-01",
				summary: "a",
			},
			{
				title: "Mới & hay",
				url: "https://x.vn/vi/news/b",
				date: "2026-03-01",
				summary: "b",
			},
		],
	});

	it("escapes XML and lists newest first", () => {
		expect(xml).toContain("<title>Tin &lt;Triệu Lộc&gt;</title>");
		expect(xml).toContain("Mô tả &amp; thông báo");
		expect(xml.indexOf("Mới &amp; hay")).toBeLessThan(xml.indexOf("Cũ"));
		expect(xml).toContain("<language>vi-VN</language>");
		expect(xml).toContain("<pubDate>Sun, 01 Mar 2026 00:00:00 GMT</pubDate>");
		expect(xml).toContain('rel="self"');
	});

	it("builds feed paths", () => {
		expect(feedPath("news", "en")).toBe("/feeds/news-en.xml");
		expect(feedPath("events", "vi")).toBe("/feeds/events-vi.ics");
	});
});

describe("iCalendar feed", () => {
	const now = new Date("2026-01-10T00:00:00Z");
	const occurrences = upcomingEvents(now, 12);
	const ics = buildIcs({
		lang: "vi",
		name: "Lịch, sự kiện; Triệu Lộc",
		url: "https://x.vn/vi/events",
		occurrences,
		now,
	});

	it("has one all-day VEVENT per occurrence with CRLF lines", () => {
		expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
		expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
		expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(occurrences.length);
		expect(ics).toContain("X-WR-CALNAME:Lịch\\, sự kiện\\; Triệu Lộc");
		expect(ics).toContain("DTSTAMP:20260110T000000Z");
		// No bare LF.
		expect(ics.replaceAll("\r\n", "")).not.toContain("\n");
	});

	it("uses exclusive DTEND for multi-day events", () => {
		const o = occurrences[0];
		const start = toISO(o.start).replaceAll("-", "");
		expect(ics).toContain(`DTSTART;VALUE=DATE:${start}`);
		expect(ics).toMatch(/DTEND;VALUE=DATE:\d{8}/);
	});

	it("folds long lines at 75 octets without splitting characters", () => {
		const long = `SUMMARY:${"Lễ hội đền Bà Triệu ".repeat(10)}`;
		const folded = foldLine(long);
		for (const line of folded.split("\r\n"))
			expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
		expect(folded.replaceAll("\r\n ", "")).toBe(long);
	});
});

describe("reading time and related posts", () => {
	it("estimates minutes, at least 1, ignoring HTML tags", () => {
		expect(readingMinutes("")).toBe(1);
		expect(readingMinutes("từ ".repeat(1000))).toBe(5);
		expect(readingMinutes(`<p>${"<b>x</b> ".repeat(400)}</p>`)).toBe(2);
	});

	it("prefers posts sharing words, then the newest", () => {
		const posts = [
			{
				slug: "a",
				title: "Lễ hội đền Bà Triệu",
				summary: "",
				date: "2026-01-01",
			},
			{ slug: "b", title: "Mùa gặt lúa", summary: "", date: "2026-05-01" },
			{
				slug: "c",
				title: "Chuẩn bị lễ hội",
				summary: "đền",
				date: "2025-01-01",
			},
			{ slug: "d", title: "Họp thôn", summary: "", date: "2026-04-01" },
		];
		const r = relatedPosts(posts[0], posts, 2).map((p) => p.slug);
		expect(r).toEqual(["c", "b"]);
		expect(relatedPosts(posts[0], posts).map((p) => p.slug)).not.toContain("a");
	});
});

describe("nextLunarDay", () => {
	it("finds the next new and full moon", () => {
		const from = { day: 1, month: 3, year: 2026 };
		const full = nextLunarDay(from, 15);
		const nm = nextLunarDay(from, 1);
		expect(solarToLunar(full).day).toBe(15);
		expect(solarToLunar(nm).day).toBe(1);
		// Tết 2026 is 17 Feb, so lunar 1/2 is ~19 March and 15/1 is 3 March.
		expect(toISO(full)).toBe("2026-03-03");
		expect(toISO(nm)).toBe("2026-03-19");
	});
});
