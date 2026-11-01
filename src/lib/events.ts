import eventsData from "#/content/events.json";
import type { L } from "./i18n";
import {
	type LunarDate,
	lunarToSolar,
	type SolarDate,
	solarToLunar,
	todayInVietnam,
	toISO,
	vnMidnight,
} from "./lunar";

export type EventCategory = "festival" | "holiday" | "community";

export type EventDef = {
	id: string;
	category: EventCategory;
	title: L;
	body: L;
	location: L;
	/** Lunar or solar date; omit `year` for an event that repeats every year. `days` = duration (default 1). */
	date: {
		calendar: "lunar" | "solar";
		day: number;
		month: number;
		year?: number;
		days?: number;
	};
};

export type Occurrence = {
	event: EventDef;
	start: SolarDate;
	end: SolarDate;
	lunar: LunarDate;
	startsAt: number;
	endsAt: number;
};

export const events = eventsData as EventDef[];

export const eventCategoryLabel: Record<EventCategory, L> = {
	festival: { vi: "Lễ hội", en: "Festival" },
	holiday: { vi: "Ngày lễ, Tết", en: "Holiday" },
	community: { vi: "Cộng đồng", en: "Community" },
};

function addDays(d: SolarDate, n: number): SolarDate {
	const t = new Date(Date.UTC(d.year, d.month - 1, d.day + n));
	return {
		day: t.getUTCDate(),
		month: t.getUTCMonth() + 1,
		year: t.getUTCFullYear(),
	};
}

function occurrence(event: EventDef, year: number): Occurrence | null {
	const { calendar, day, month, days = 1 } = event.date;
	const start =
		calendar === "lunar"
			? lunarToSolar({ day, month, year, leap: false })
			: { day, month, year };
	if (!start) return null;
	const end = addDays(start, days - 1);
	return {
		event,
		start,
		end,
		lunar: solarToLunar(start),
		startsAt: vnMidnight(start),
		endsAt: vnMidnight(end) + 86_400_000,
	};
}

/** Every occurrence that hasn't ended yet, within the next `months` months, soonest first. */
export function upcomingEvents(now = new Date(), months = 12): Occurrence[] {
	const today = todayInVietnam(now);
	const limit = vnMidnight(addDays(today, Math.round(months * 30.5)));
	const out: Occurrence[] = [];
	for (const event of events) {
		const years = event.date.year
			? [event.date.year]
			: [today.year - 1, today.year, today.year + 1];
		for (const y of years) {
			const o = occurrence(event, y);
			if (o && o.endsAt > now.getTime() && o.startsAt <= limit) out.push(o);
		}
	}
	return out.sort((a, b) => a.startsAt - b.startsAt);
}

export function isoOf(o: Occurrence) {
	return toISO(o.start);
}

/** "Add to Google Calendar" link for an all-day event spanning start..end. */
export function googleCalendarUrl(
	o: { start: SolarDate; end: SolarDate },
	title: string,
	details: string,
	location: string,
) {
	const compact = (d: SolarDate) => toISO(d).replaceAll("-", "");
	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: title,
		dates: `${compact(o.start)}/${compact(addDays(o.end, 1))}`,
		location,
		details,
	});
	return `https://calendar.google.com/calendar/render?${params}`;
}
