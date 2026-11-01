import { describe, expect, it } from "vitest";
import { nextFestival } from "../festival";
import { toISO } from "../lunar";

const at = (iso: string) => new Date(`${iso}+07:00`);

describe("nextFestival", () => {
	it("returns this year's festival before it starts", () => {
		const f = nextFestival(at("2026-03-01T12:00:00"));
		expect(f.lunarYear).toBe(2026);
		expect(toISO(f.start)).toBe("2026-04-08");
		expect(toISO(f.end)).toBe("2026-04-11");
	});

	it("keeps returning the current festival while it is running", () => {
		const now = at("2026-04-11T23:00:00");
		const f = nextFestival(now);
		expect(f.lunarYear).toBe(2026);
		expect(now.getTime()).toBeGreaterThanOrEqual(f.startsAt);
		expect(now.getTime()).toBeLessThan(f.endsAt);
	});

	it("rolls over to next year once it has ended", () => {
		const f = nextFestival(at("2026-04-12T00:30:00"));
		expect(f.lunarYear).toBe(2027);
		expect(toISO(f.start)).toBe("2027-03-28");
		expect(f.yearName).toBe("Đinh Mùi");
	});
});
