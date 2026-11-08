import { useEffect, useState } from "react";
import { formatDate, type Lang, t } from "#/lib/i18n";
import {
	type LunarDate,
	lunarToSolar,
	nextLunarDay,
	type SolarDate,
	solarToLunar,
	todayInVietnam,
	toISO,
	yearName,
} from "#/lib/lunar";

const MIN_YEAR = 1800;
const MAX_YEAR = 2199;

const fieldCls =
	"w-full rounded-xl border border-earth-300 bg-card px-3 py-2 text-ink focus:border-rice-500 focus:outline-none";

function lunarText(lang: Lang, l: LunarDate) {
	return `${l.day}/${l.month}${l.leap ? ` (${t(lang, "events.leap")})` : ""}/${l.year} ${t(lang, "events.lunarDate")} · ${t(lang, "events.year")} ${yearName(l.year)}`;
}

function validSolar(d: SolarDate) {
	const dt = new Date(Date.UTC(d.year, d.month - 1, d.day));
	return (
		d.year >= MIN_YEAR &&
		d.year <= MAX_YEAR &&
		dt.getUTCDate() === d.day &&
		dt.getUTCMonth() === d.month - 1
	);
}

/** Two-way converter between the solar and Vietnamese lunar calendars. */
export function LunarConverter({ lang }: { lang: Lang }) {
	const [mode, setMode] = useState<"toLunar" | "toSolar">("toLunar");
	// Server and client agree on the first render; the real "today" is set after hydration.
	const [today, setToday] = useState<SolarDate | null>(null);
	const [solar, setSolar] = useState("");
	const [lunar, setLunar] = useState({
		day: 1,
		month: 1,
		year: 2026,
		leap: false,
	});
	useEffect(() => {
		const now = todayInVietnam();
		setToday(now);
		setSolar(toISO(now));
		setLunar({ ...solarToLunar(now), leap: false });
	}, []);

	let result: string | null = null;
	let error: string | null = null;
	if (mode === "toLunar") {
		const [year, month, day] = solar.split("-").map(Number);
		const d = { day, month, year };
		if (solar && validSolar(d)) result = lunarText(lang, solarToLunar(d));
		else if (solar) error = t(lang, "lunar.invalid");
	} else {
		const ok =
			lunar.year >= MIN_YEAR &&
			lunar.year <= MAX_YEAR &&
			lunar.day >= 1 &&
			lunar.day <= 30 &&
			lunar.month >= 1 &&
			lunar.month <= 12;
		const s = ok ? lunarToSolar(lunar) : null;
		// A lunar month has 29 or 30 days: day 30 of a short month rolls into the next month.
		const roundTrip = s ? solarToLunar(s) : null;
		if (!ok) error = t(lang, "lunar.invalid");
		else if (!s) error = t(lang, "lunar.noLeap");
		else if (roundTrip && roundTrip.day !== lunar.day)
			error = t(lang, "lunar.invalid");
		else if (s) result = formatDate(lang, toISO(s));
	}

	const tab = (m: typeof mode) =>
		`rounded-full px-4 py-2 text-sm font-medium transition ${
			mode === m
				? "bg-rice-700 text-paper"
				: "border border-earth-300 text-ink-soft hover:bg-rice-100"
		}`;

	return (
		<div
			className="rounded-2xl border border-earth-300/50 bg-card/70 p-5"
			data-testid="lunar-converter"
		>
			{today && (
				<dl className="mb-5 grid gap-3 text-sm sm:grid-cols-3">
					{[
						{
							label: t(lang, "lunar.today"),
							value: lunarText(lang, solarToLunar(today)),
						},
						{
							label: t(lang, "lunar.nextNew"),
							value: formatDate(lang, toISO(nextLunarDay(today, 1))),
						},
						{
							label: t(lang, "lunar.nextFull"),
							value: formatDate(lang, toISO(nextLunarDay(today, 15))),
						},
					].map((x) => (
						<div key={x.label} className="rounded-xl bg-paper-2 px-3 py-2">
							<dt className="text-xs font-semibold uppercase tracking-widest text-earth-700">
								{x.label}
							</dt>
							<dd className="mt-0.5 text-ink">{x.value}</dd>
						</div>
					))}
				</dl>
			)}

			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					aria-pressed={mode === "toLunar"}
					className={tab("toLunar")}
					onClick={() => setMode("toLunar")}
				>
					{t(lang, "lunar.toLunar")}
				</button>
				<button
					type="button"
					aria-pressed={mode === "toSolar"}
					className={tab("toSolar")}
					onClick={() => setMode("toSolar")}
				>
					{t(lang, "lunar.toSolar")}
				</button>
			</div>

			{mode === "toLunar" ? (
				<label className="mt-4 block max-w-xs text-sm font-medium text-ink">
					{t(lang, "lunar.solarDate")}
					<input
						type="date"
						min={`${MIN_YEAR}-01-01`}
						max={`${MAX_YEAR}-12-31`}
						value={solar}
						onChange={(e) => setSolar(e.target.value)}
						className={`mt-1 ${fieldCls}`}
					/>
				</label>
			) : (
				<div className="mt-4 grid max-w-md grid-cols-3 gap-3">
					{(["day", "month", "year"] as const).map((k) => (
						<label key={k} className="text-sm font-medium text-ink">
							{t(lang, `lunar.${k}`)}
							<input
								type="number"
								inputMode="numeric"
								min={k === "year" ? MIN_YEAR : 1}
								max={k === "day" ? 30 : k === "month" ? 12 : MAX_YEAR}
								value={lunar[k]}
								onChange={(e) =>
									setLunar({ ...lunar, [k]: Number(e.target.value) })
								}
								className={`mt-1 ${fieldCls}`}
							/>
						</label>
					))}
					<label className="col-span-3 inline-flex items-center gap-2 text-sm text-ink">
						<input
							type="checkbox"
							checked={lunar.leap}
							onChange={(e) => setLunar({ ...lunar, leap: e.target.checked })}
						/>
						{t(lang, "lunar.leapMonth")}
					</label>
				</div>
			)}

			<p className="mt-5 min-h-7 text-lg" aria-live="polite">
				{result && (
					<>
						<span className="text-sm font-semibold uppercase tracking-widest text-earth-700">
							{t(lang, "lunar.result")}:
						</span>{" "}
						<strong className="text-rice-900" data-testid="lunar-result">
							{result}
						</strong>
					</>
				)}
				{error && <span className="text-lotus">{error}</span>}
			</p>
		</div>
	);
}
