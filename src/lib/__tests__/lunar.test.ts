import { describe, expect, it } from "vitest";
import { lunarToSolar, solarToLunar, toISO, yearName } from "../lunar";

describe("lunar calendar (UTC+7)", () => {
	it.each([
		[2020, "2020-01-25"],
		[2023, "2023-01-22"],
		[2024, "2024-02-10"],
		[2025, "2025-01-29"],
		[2026, "2026-02-17"],
		[2027, "2027-02-06"],
	])("Tết %i falls on %s", (year, iso) => {
		const solar = lunarToSolar({ day: 1, month: 1, year, leap: false });
		expect(solar && toISO(solar)).toBe(iso);
	});

	it("resolves leap months", () => {
		const leap2 = lunarToSolar({ day: 1, month: 2, year: 2023, leap: true });
		expect(leap2 && toISO(leap2)).toBe("2023-03-22");
		expect(
			lunarToSolar({ day: 1, month: 6, year: 2025, leap: true }),
		).not.toBeNull();
		expect(
			lunarToSolar({ day: 1, month: 5, year: 2025, leap: true }),
		).toBeNull();
		expect(
			lunarToSolar({ day: 1, month: 1, year: 2026, leap: true }),
		).toBeNull();
	});

	it("round-trips solar → lunar → solar for 2000–2050", () => {
		for (
			let t = Date.UTC(2000, 0, 1);
			t < Date.UTC(2051, 0, 1);
			t += 7 * 86_400_000
		) {
			const d = new Date(t);
			const solar = {
				day: d.getUTCDate(),
				month: d.getUTCMonth() + 1,
				year: d.getUTCFullYear(),
			};
			const back = lunarToSolar(solarToLunar(solar));
			expect(back).toEqual(solar);
		}
	});

	it("names Can–Chi years", () => {
		expect(yearName(2024)).toBe("Giáp Thìn");
		expect(yearName(2026)).toBe("Bính Ngọ");
		expect(yearName(2027)).toBe("Đinh Mùi");
	});
});
