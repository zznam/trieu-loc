import {
	lunarToSolar,
	type SolarDate,
	solarToLunar,
	todayInVietnam,
	vnMidnight,
	yearName,
} from "./lunar";

/** Bà Triệu Temple Festival: 21st–24th of the 2nd lunar month (she died on the 22nd). */
export const FESTIVAL = { month: 2, startDay: 21, endDay: 24 } as const;

export type FestivalInfo = {
	lunarYear: number;
	yearName: string;
	start: SolarDate;
	end: SolarDate;
	/** Timestamps (ms) of the opening day's start and the day after closing, Vietnam time. */
	startsAt: number;
	endsAt: number;
};

function festivalFor(lunarYear: number): FestivalInfo {
	const start = lunarToSolar({
		day: FESTIVAL.startDay,
		month: FESTIVAL.month,
		year: lunarYear,
		leap: false,
	});
	const end = lunarToSolar({
		day: FESTIVAL.endDay,
		month: FESTIVAL.month,
		year: lunarYear,
		leap: false,
	});
	if (!start || !end) throw new Error(`No festival date for ${lunarYear}`);
	return {
		lunarYear,
		yearName: yearName(lunarYear),
		start,
		end,
		startsAt: vnMidnight(start),
		endsAt: vnMidnight(end) + 86_400_000,
	};
}

/** The festival currently running, or the next one to come. */
export function nextFestival(now = new Date()): FestivalInfo {
	const lunarYear = solarToLunar(todayInVietnam(now)).year;
	const thisYear = festivalFor(lunarYear);
	return now.getTime() < thisYear.endsAt
		? thisYear
		: festivalFor(lunarYear + 1);
}
