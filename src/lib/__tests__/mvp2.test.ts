import { afterEach, describe, expect, it } from "vitest";
import { getNews, getPost, site } from "../content";
import type { ContentSnapshot, NewsItem } from "../content-schemas";
import { applySnapshot, fileContent } from "../content-store";
import { toCsv } from "../csv";
import { upcomingEvents } from "../events";
import { groupByYear, matchesQuery } from "../listing";
import { PRIVACY, VISITOR_GUIDE } from "../pages";
import { search } from "../search";
import {
	articleLd,
	breadcrumbLd,
	eventsLd,
	ldJson,
	websiteLd,
} from "../structured-data";

afterEach(() => applySnapshot(null));

describe("structured data", () => {
	it("describes the site with a search action and the commune's location", () => {
		const [web, place] = websiteLd("vi", site);
		expect(web["@type"]).toBe("WebSite");
		expect(JSON.stringify(web)).toContain(
			"https://example.test/vi/search?q={search_term_string}",
		);
		expect(place["@type"]).toBe("Place");
		expect(place.geo).toEqual({
			"@type": "GeoCoordinates",
			latitude: site.center[0],
			longitude: site.center[1],
		});
	});

	it("builds breadcrumbs with absolute URLs and positions", () => {
		const ld = breadcrumbLd([
			{ name: "Trang chủ", path: "/vi" },
			{ name: "Tin tức", path: "/vi/news" },
		]);
		expect(ld.itemListElement).toEqual([
			{
				"@type": "ListItem",
				position: 1,
				name: "Trang chủ",
				item: "https://example.test/vi",
			},
			{
				"@type": "ListItem",
				position: 2,
				name: "Tin tức",
				item: "https://example.test/vi/news",
			},
		]);
	});

	it("credits community stories to their author and posts to the site", () => {
		const base = {
			lang: "vi" as const,
			path: "/vi/news/x",
			title: "T",
			summary: "S",
			date: "2026-11-01",
			publisher: "Xã Triệu Lộc",
		};
		expect(articleLd(base).author).toEqual({
			"@type": "Organization",
			name: "Xã Triệu Lộc",
		});
		expect(articleLd({ ...base, author: "Bác Ba" }).author).toEqual({
			"@type": "Person",
			name: "Bác Ba",
		});
	});

	it("turns lunar festivals into dated events", () => {
		const list = upcomingEvents(new Date("2027-01-10T00:00:00Z"));
		const ld = eventsLd("en", list, "/en/events");
		const festival = ld.find((e) => String(e.url).endsWith("#le-hoi-ba-trieu"));
		expect(festival?.startDate).toBe("2027-03-28");
		expect(festival?.endDate).toBe("2027-03-31");
	});

	it("can't break out of the <script> tag", () => {
		const json = ldJson({ name: "</script><script>alert(1)</script> & co" });
		expect(json).not.toContain("<");
		expect(json).not.toContain(">");
		expect(JSON.parse(json).name).toBe(
			"</script><script>alert(1)</script> & co",
		);
	});
});

describe("csv", () => {
	it("quotes, escapes and adds a BOM for Excel", () => {
		const csv = toCsv(["a", "b"], [["Bà Triệu", 'say "hi", ok']]);
		expect(csv.startsWith("﻿")).toBe(true);
		expect(csv).toBe('﻿"a","b"\r\n"Bà Triệu","say ""hi"", ok"\r\n');
	});

	it("neutralises spreadsheet formulas and handles empty cells", () => {
		const csv = toCsv(["x"], [["=HYPERLINK(1)"], ["+1"], ["-2"], [null], [3]]);
		expect(csv).toContain(`"'=HYPERLINK(1)"`);
		expect(csv).toContain(`"'+1"`);
		expect(csv).toContain(`"'-2"`);
		expect(csv).toContain('""\r\n"3"');
	});
});

describe("listing helpers", () => {
	it("groups newest-first items by year", () => {
		const g = groupByYear([
			{ date: "2026-11-01" },
			{ date: "2026-04-08" },
			{ date: "2025-07-01" },
		]);
		expect(g.map((y) => [y.year, y.items.length])).toEqual([
			["2026", 2],
			["2025", 1],
		]);
	});

	it("matches every word, ignoring accents and case", () => {
		expect(matchesQuery("ba trieu", "Bà Triệu", "Phú Điền")).toBe(true);
		expect(matchesQuery("TRIEU phu dien", "Bà Triệu", "Phú Điền")).toBe(true);
		expect(matchesQuery("trieu hanoi", "Bà Triệu", "Phú Điền")).toBe(false);
		expect(matchesQuery("  ", "anything")).toBe(true);
	});
});

describe("news drafts", () => {
	it("are hidden from the list, the page and search, like scheduled posts", () => {
		const files = fileContent();
		const draft: NewsItem = {
			slug: "2026-11-20-ban-nhap",
			date: "2026-11-20",
			draft: true,
			vi: {
				title: "Bản nháp hội thi",
				summary: "Chưa đăng",
				body: "Nội dung nháp độc nhất xyzzy",
			},
		};
		const snap: ContentSnapshot = {
			version: "drafts-1",
			imported: ["news"],
			news: [...files.news, draft],
		};
		applySnapshot(snap);
		expect(getNews("vi").some((p) => p.slug === draft.slug)).toBe(false);
		expect(getPost("vi", draft.slug)).toBeUndefined();
		expect(search("vi", "xyzzy")).toEqual([]);

		applySnapshot({
			...snap,
			version: "drafts-2",
			news: [...files.news, { ...draft, draft: false }],
		});
		expect(getPost("vi", draft.slug)?.title).toBe("Bản nháp hội thi");
		expect(search("vi", "xyzzy")).toHaveLength(1);
	});
});

describe("static pages", () => {
	it("have every text in both languages", () => {
		const texts = [
			...VISITOR_GUIDE.flatMap((s) => [
				s.title,
				...s.items,
				...(s.link ? [s.link.label] : []),
			]),
			...PRIVACY.flatMap((s) => [s.title, ...s.items]),
		];
		for (const t of texts) {
			expect(t.vi.trim(), JSON.stringify(t)).not.toBe("");
			expect(t.en.trim(), JSON.stringify(t)).not.toBe("");
		}
		expect(PRIVACY.some((s) => s.id === "guidelines")).toBe(true);
	});
});
