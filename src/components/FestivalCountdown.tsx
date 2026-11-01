import { useEffect, useState } from "react";
import { googleCalendarUrl } from "#/lib/events";
import { nextFestival } from "#/lib/festival";
import { formatDate, type Lang, t } from "#/lib/i18n";
import { toISO } from "#/lib/lunar";

function useNow(intervalMs: number) {
	const [now, setNow] = useState<Date | null>(null);
	useEffect(() => {
		setNow(new Date());
		const id = setInterval(() => setNow(new Date()), intervalMs);
		return () => clearInterval(id);
	}, [intervalMs]);
	return now;
}

/**
 * Countdown to the next Bà Triệu festival. The festival date is the same on server and
 * client; the ticking numbers render only after mount to avoid a hydration mismatch.
 */
export function FestivalCountdown({ lang }: { lang: Lang }) {
	const now = useNow(30_000);
	const festival = nextFestival(now ?? new Date());
	const ongoing = now !== null && now.getTime() >= festival.startsAt;
	const ms = now ? Math.max(0, festival.startsAt - now.getTime()) : 0;
	const units = [
		{ value: Math.floor(ms / 86_400_000), label: t(lang, "countdown.days") },
		{
			value: Math.floor((ms % 86_400_000) / 3_600_000),
			label: t(lang, "countdown.hours"),
		},
		{
			value: Math.floor((ms % 3_600_000) / 60_000),
			label: t(lang, "countdown.minutes"),
		},
	];

	return (
		<div className="rounded-2xl bg-paper/10 p-5 ring-1 ring-paper/20">
			<p className="text-xs font-semibold uppercase tracking-widest text-earth-300">
				{t(lang, "countdown.year")} {festival.yearName} · {festival.lunarYear}
			</p>
			<p className="mt-1 font-serif text-lg">
				{formatDate(lang, toISO(festival.start))} –{" "}
				{formatDate(lang, toISO(festival.end))}
			</p>
			{ongoing ? (
				<p className="mt-4 inline-flex items-center gap-2 rounded-full bg-lotus px-4 py-2 font-semibold text-white">
					<span className="h-2 w-2 animate-pulse rounded-full bg-white" />
					{t(lang, "countdown.ongoing")}
				</p>
			) : (
				<div className="mt-4 flex gap-3" aria-live="polite">
					{units.map((u) => (
						<div
							key={u.label}
							className="min-w-16 rounded-xl bg-paper px-3 py-2 text-center text-rice-900"
						>
							<span className="block font-serif text-3xl font-semibold tabular-nums">
								{now ? u.value : "–"}
							</span>
							<span className="text-[11px] font-semibold uppercase tracking-wider text-earth-700">
								{u.label}
							</span>
						</div>
					))}
				</div>
			)}
			<a
				href={googleCalendarUrl(
					festival,
					t(lang, "home.festival.title"),
					t(lang, "home.festival.body"),
					"Đền Bà Triệu, thôn Phú Điền, xã Triệu Lộc, Thanh Hoá",
				)}
				target="_blank"
				rel="noreferrer"
				className="mt-4 inline-block text-sm font-semibold text-paper underline-offset-4 hover:underline"
			>
				📅 {t(lang, "countdown.addToCalendar")}
			</a>
		</div>
	);
}
