import { describe, expect, it } from "vitest";
import { communityEvent, upcomingEvents } from "../events";
import { toISO } from "../lunar";

const now = new Date("2026-11-01T10:00:00+07:00");

describe("upcomingEvents", () => {
	const list = upcomingEvents(now);

	it("is sorted and only contains events that haven't ended", () => {
		for (let i = 1; i < list.length; i++)
			expect(list[i].startsAt).toBeGreaterThanOrEqual(list[i - 1].startsAt);
		for (const o of list) expect(o.endsAt).toBeGreaterThan(now.getTime());
	});

	it("places lunar events on the right solar dates", () => {
		const tet = list.find((o) => o.event.id === "tet");
		expect(tet && toISO(tet.start)).toBe("2027-02-06");
		const festival = list.find((o) => o.event.id === "le-hoi-ba-trieu");
		expect(festival && toISO(festival.start)).toBe("2027-03-28");
		expect(festival && toISO(festival.end)).toBe("2027-03-31");
	});

	it("includes extra (community) events", () => {
		const extra = communityEvent({
			id: 7,
			title: "Hội thi",
			message: "x",
			eventDate: "2026-12-05",
			eventDays: 2,
			eventLocation: null,
			village: "Phú Điền",
			villageId: "phu-dien",
		});
		expect(extra).not.toBeNull();
		const withExtra = upcomingEvents(now, 12, extra ? [extra] : []);
		const o = withExtra.find((x) => x.event.id === "cong-dong-7");
		expect(o && toISO(o.end)).toBe("2026-12-06");
		expect(o?.event.location.vi).toBe("Phú Điền");
	});

	it("ignores community events without a date", () => {
		expect(
			communityEvent({
				id: 1,
				title: "x",
				message: "x",
				eventDate: null,
				eventDays: 1,
				eventLocation: null,
				village: null,
				villageId: null,
			}),
		).toBeNull();
	});
});
