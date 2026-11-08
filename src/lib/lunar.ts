/**
 * Vietnamese lunar calendar conversion (UTC+7), after Hồ Ngọc Đức's
 * astronomical algorithm ("Âm lịch Việt Nam"). Accurate for 1800–2199.
 */

const TZ = 7; // Vietnam
const PI = Math.PI;
const INT = Math.floor;

export type SolarDate = { day: number; month: number; year: number };
export type LunarDate = {
	day: number;
	month: number;
	year: number;
	leap: boolean;
};

function jdFromDate(dd: number, mm: number, yy: number): number {
	const a = INT((14 - mm) / 12);
	const y = yy + 4800 - a;
	const m = mm + 12 * a - 3;
	let jd =
		dd +
		INT((153 * m + 2) / 5) +
		365 * y +
		INT(y / 4) -
		INT(y / 100) +
		INT(y / 400) -
		32045;
	if (jd < 2299161)
		jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
	return jd;
}

function jdToDate(jd: number): SolarDate {
	let b: number;
	let c: number;
	if (jd > 2299160) {
		const a = jd + 32044;
		b = INT((4 * a + 3) / 146097);
		c = a - INT((b * 146097) / 4);
	} else {
		b = 0;
		c = jd + 32082;
	}
	const d = INT((4 * c + 3) / 1461);
	const e = c - INT((1461 * d) / 4);
	const m = INT((5 * e + 2) / 153);
	return {
		day: e - INT((153 * m + 2) / 5) + 1,
		month: m + 3 - 12 * INT(m / 10),
		year: b * 100 + d - 4800 + INT(m / 10),
	};
}

function newMoon(k: number): number {
	const T = k / 1236.85;
	const T2 = T * T;
	const T3 = T2 * T;
	const dr = PI / 180;
	let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
	jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
	const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
	const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
	const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
	let C1 =
		(0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
	C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
	C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
	C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
	C1 =
		C1 -
		0.0074 * Math.sin(dr * (M - Mpr)) +
		0.0004 * Math.sin(dr * (2 * F + M));
	C1 =
		C1 -
		0.0004 * Math.sin(dr * (2 * F - M)) -
		0.0006 * Math.sin(dr * (2 * F + Mpr));
	C1 =
		C1 +
		0.001 * Math.sin(dr * (2 * F - Mpr)) +
		0.0005 * Math.sin(dr * (2 * Mpr + M));
	const deltat =
		T < -11
			? 0.001 +
				0.000839 * T +
				0.0002261 * T2 -
				0.00000845 * T3 -
				0.000000081 * T * T3
			: -0.000278 + 0.000265 * T + 0.000262 * T2;
	return jd1 + C1 - deltat;
}

function sunLongitude(jdn: number): number {
	const T = (jdn - 2451545.0) / 36525;
	const T2 = T * T;
	const dr = PI / 180;
	const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
	const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
	let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
	DL +=
		(0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) +
		0.00029 * Math.sin(dr * 3 * M);
	let L = (L0 + DL) * dr;
	L -= PI * 2 * INT(L / (PI * 2));
	return L;
}

const getSunLongitude = (dayNumber: number) =>
	INT((sunLongitude(dayNumber - 0.5 - TZ / 24) / PI) * 6);
const getNewMoonDay = (k: number) => INT(newMoon(k) + 0.5 + TZ / 24);

function getLunarMonth11(yy: number): number {
	const off = jdFromDate(31, 12, yy) - 2415021;
	const k = INT(off / 29.530588853);
	let nm = getNewMoonDay(k);
	if (getSunLongitude(nm) >= 9) nm = getNewMoonDay(k - 1);
	return nm;
}

function getLeapMonthOffset(a11: number): number {
	const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
	let last: number;
	let i = 1;
	let arc = getSunLongitude(getNewMoonDay(k + i));
	do {
		last = arc;
		i++;
		arc = getSunLongitude(getNewMoonDay(k + i));
	} while (arc !== last && i < 14);
	return i - 1;
}

export function solarToLunar({ day, month, year }: SolarDate): LunarDate {
	const dayNumber = jdFromDate(day, month, year);
	const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
	let monthStart = getNewMoonDay(k + 1);
	if (monthStart > dayNumber) monthStart = getNewMoonDay(k);
	let a11 = getLunarMonth11(year);
	let b11 = a11;
	let lunarYear: number;
	if (a11 >= monthStart) {
		lunarYear = year;
		a11 = getLunarMonth11(year - 1);
	} else {
		lunarYear = year + 1;
		b11 = getLunarMonth11(year + 1);
	}
	const lunarDay = dayNumber - monthStart + 1;
	const diff = INT((monthStart - a11) / 29);
	let leap = false;
	let lunarMonth = diff + 11;
	if (b11 - a11 > 365) {
		const leapMonthDiff = getLeapMonthOffset(a11);
		if (diff >= leapMonthDiff) {
			lunarMonth = diff + 10;
			if (diff === leapMonthDiff) leap = true;
		}
	}
	if (lunarMonth > 12) lunarMonth -= 12;
	if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
	return { day: lunarDay, month: lunarMonth, year: lunarYear, leap };
}

/** Returns null when the requested leap month doesn't exist that year. */
export function lunarToSolar({
	day,
	month,
	year,
	leap,
}: LunarDate): SolarDate | null {
	let a11: number;
	let b11: number;
	if (month < 11) {
		a11 = getLunarMonth11(year - 1);
		b11 = getLunarMonth11(year);
	} else {
		a11 = getLunarMonth11(year);
		b11 = getLunarMonth11(year + 1);
	}
	const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
	let off = month - 11;
	if (off < 0) off += 12;
	if (b11 - a11 > 365) {
		const leapOff = getLeapMonthOffset(a11);
		let leapMonth = leapOff - 2;
		if (leapMonth < 0) leapMonth += 12;
		if (leap && month !== leapMonth) return null;
		if (leap || off >= leapOff) off += 1;
	} else if (leap) {
		return null;
	}
	return jdToDate(getNewMoonDay(k + off) + day - 1);
}

/** Today's date in Vietnam, regardless of the visitor's timezone. */
export function todayInVietnam(now = new Date()): SolarDate {
	const shifted = new Date(now.getTime() + TZ * 3600_000);
	return {
		day: shifted.getUTCDate(),
		month: shifted.getUTCMonth() + 1,
		year: shifted.getUTCFullYear(),
	};
}

/** Midnight Vietnam time of a solar date, as a JS timestamp. */
export function vnMidnight({ day, month, year }: SolarDate): number {
	return Date.UTC(year, month - 1, day) - TZ * 3600_000;
}

export const toISO = ({ day, month, year }: SolarDate) =>
	`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const CAN = [
	"Giáp",
	"Ất",
	"Bính",
	"Đinh",
	"Mậu",
	"Kỷ",
	"Canh",
	"Tân",
	"Nhâm",
	"Quý",
];
const CHI = [
	"Tý",
	"Sửu",
	"Dần",
	"Mão",
	"Thìn",
	"Tỵ",
	"Ngọ",
	"Mùi",
	"Thân",
	"Dậu",
	"Tuất",
	"Hợi",
];

/** Can–Chi name of a lunar year, e.g. 2026 → "Bính Ngọ". */
export const yearName = (lunarYear: number) =>
	`${CAN[(lunarYear + 6) % 10]} ${CHI[(lunarYear + 8) % 12]}`;

/** The first solar date on or after `from` whose lunar day is `lunarDay` (1 = new moon, 15 = full moon). */
export function nextLunarDay(from: SolarDate, lunarDay: number): SolarDate {
	for (let i = 0; i < 31; i++) {
		const d = new Date(Date.UTC(from.year, from.month - 1, from.day + i));
		const solar = {
			day: d.getUTCDate(),
			month: d.getUTCMonth() + 1,
			year: d.getUTCFullYear(),
		};
		if (solarToLunar(solar).day === lunarDay) return solar;
	}
	return from;
}
