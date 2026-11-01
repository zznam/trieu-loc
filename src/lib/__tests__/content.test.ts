import { describe, expect, it } from "vitest";
import {
	businesses,
	gallery,
	getNews,
	getPeople,
	history,
	places,
	specialties,
} from "../content";
import { events } from "../events";
import type { L } from "../i18n";
import { villages } from "../villages";

const filled = (l: L) => l.vi.trim().length > 0 && l.en.trim().length > 0;
const villageIds = new Set(villages.map((v) => v.id));

describe("content integrity", () => {
	it("every bilingual field has both languages", () => {
		for (const p of places)
			expect(filled(p.name) && filled(p.body), p.id).toBe(true);
		for (const s of specialties)
			expect(filled(s.name) && filled(s.body), s.id).toBe(true);
		for (const b of businesses) expect(filled(b.body), b.id).toBe(true);
		for (const g of gallery) expect(filled(g.caption), g.id).toBe(true);
		for (const e of events)
			expect(
				filled(e.title) && filled(e.body) && filled(e.location),
				e.id,
			).toBe(true);
		for (const v of villages)
			expect(filled(v.name) && filled(v.intro), v.id).toBe(true);
		for (const t of history.timeline)
			expect(filled(t.title) && filled(t.body)).toBe(true);
	});

	it("ids are unique", () => {
		for (const list of [
			places,
			specialties,
			businesses,
			gallery,
			events,
			villages,
		]) {
			const ids = list.map((x) => x.id);
			expect(new Set(ids).size).toBe(ids.length);
		}
	});

	it("there are 17 villages across the three former communes", () => {
		expect(villages).toHaveLength(17);
		expect(villages.filter((v) => v.former === "dai-loc")).toHaveLength(4);
		expect(villages.filter((v) => v.former === "trieu-loc")).toHaveLength(8);
		expect(villages.filter((v) => v.former === "tien-loc")).toHaveLength(5);
	});

	it("every villageId points at a real village", () => {
		for (const p of places)
			if (p.villageId) expect(villageIds.has(p.villageId), p.id).toBe(true);
		for (const e of events)
			if (e.villageId) expect(villageIds.has(e.villageId), e.id).toBe(true);
		for (const p of getPeople("vi"))
			if (p.villageId) expect(villageIds.has(p.villageId), p.slug).toBe(true);
	});

	it("places sit roughly inside the commune", () => {
		for (const p of places) {
			expect(p.coords[0], p.id).toBeGreaterThan(19.9);
			expect(p.coords[0], p.id).toBeLessThan(19.99);
			expect(p.coords[1], p.id).toBeGreaterThan(105.76);
			expect(p.coords[1], p.id).toBeLessThan(105.87);
		}
	});

	it("news and people exist in both languages with valid dates", () => {
		const vi = getNews("vi").map((p) => p.slug);
		const en = getNews("en").map((p) => p.slug);
		expect(en).toEqual(vi);
		for (const p of getNews("vi"))
			expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(
			getPeople("en")
				.map((p) => p.slug)
				.sort(),
		).toEqual(
			getPeople("vi")
				.map((p) => p.slug)
				.sort(),
		);
	});
});
