import { afterEach, describe, expect, it, vi } from "vitest";
import { getNews, getPost } from "../content";
import { COLLECTION_NAMES } from "../content-schemas";
import { applySnapshot, fileContent } from "../content-store";
import { dateToVnLocal, isLive, vnLocalToDate } from "../schedule";
import { search } from "../search";

describe("Vietnam-time helpers", () => {
	it("reads datetime-local values as UTC+7", () => {
		expect(vnLocalToDate("2026-12-01T08:30")?.toISOString()).toBe(
			"2026-12-01T01:30:00.000Z",
		);
		expect(vnLocalToDate("2026-12-01")).toBeNull();
		expect(vnLocalToDate("garbage")).toBeNull();
	});

	it("round-trips", () => {
		expect(dateToVnLocal(new Date("2026-12-31T20:15:00Z"))).toBe(
			"2027-01-01T03:15",
		);
		expect(dateToVnLocal(vnLocalToDate("2027-02-06T00:00") as Date)).toBe(
			"2027-02-06T00:00",
		);
	});

	it("isLive", () => {
		expect(isLive(undefined)).toBe(true);
		expect(isLive(null)).toBe(true);
		expect(isLive(1000, 999)).toBe(false);
		expect(isLive(1000, 1000)).toBe(true);
	});
});

describe("scheduled news", () => {
	afterEach(() => {
		vi.useRealTimers();
		applySnapshot(null);
	});

	it("stays hidden from lists, pages and search until its time", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-11-30T23:00:00+07:00"));
		const f = fileContent();
		f.news.push({
			slug: "2026-12-01-thong-bao-hen-gio",
			date: "2026-12-01",
			publishAt: "2026-12-01T08:00",
			vi: {
				title: "Thông báo hẹn giờ",
				summary: "x",
				body: "Nội dung hẹn giờ",
			},
		});
		applySnapshot({ version: "sched", imported: [...COLLECTION_NAMES], ...f });

		expect(
			getNews("vi").some((p) => p.slug === "2026-12-01-thong-bao-hen-gio"),
		).toBe(false);
		expect(getPost("vi", "2026-12-01-thong-bao-hen-gio")).toBeUndefined();
		expect(search("vi", "thong bao hen gio")).toHaveLength(0);

		vi.setSystemTime(new Date("2026-12-01T08:00:00+07:00"));
		expect(getNews("vi")[0].slug).toBe("2026-12-01-thong-bao-hen-gio");
		expect(getPost("en", "2026-12-01-thong-bao-hen-gio")?.title).toBe(
			"Thông báo hẹn giờ",
		);
		// The cached search index picks it up without being rebuilt
		expect(search("vi", "thong bao hen gio")[0]?.doc.title).toBe(
			"Thông báo hẹn giờ",
		);
	});
});
