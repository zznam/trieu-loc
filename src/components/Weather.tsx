import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { type Lang, pick, t } from "#/lib/i18n";
import { fetchWeather, type Weather } from "#/lib/weather";
import { describeWeather } from "#/lib/weatherCodes";

/** Loads weather in the browser after render, so a slow forecast never delays the page itself. */
function useWeather() {
	const [state, setState] = useState<{
		status: "loading" | "ready" | "error";
		data: Weather | null;
	}>({
		status: "loading",
		data: null,
	});
	useEffect(() => {
		let alive = true;
		fetchWeather()
			.then(
				(data) => alive && setState({ status: data ? "ready" : "error", data }),
			)
			.catch(() => alive && setState({ status: "error", data: null }));
		return () => {
			alive = false;
		};
	}, []);
	return state;
}

const round = (n: number) => Math.round(n);

function dayName(lang: Lang, iso: string, i: number) {
	if (i === 0) return t(lang, "weather.today");
	return new Date(`${iso}T00:00:00Z`).toLocaleDateString(
		lang === "vi" ? "vi-VN" : "en-GB",
		{
			weekday: "short",
			day: "numeric",
			month: "numeric",
			timeZone: "UTC",
		},
	);
}

/** One-line weather summary for the home page. Renders nothing if the forecast is unavailable. */
export function WeatherChip({ lang }: { lang: Lang }) {
	const { status, data } = useWeather();
	if (status === "error") return null;
	const d = data && describeWeather(data.current.code, data.current.isDay);
	return (
		<Link
			to="/$lang/info"
			params={{ lang }}
			className="inline-flex min-h-9 items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-sm text-ink-soft ring-1 ring-earth-300/50 hover:bg-card"
		>
			{data && d ? (
				<>
					<span aria-hidden="true">{d.icon}</span>
					<span>
						<span className="font-semibold text-rice-900">
							{round(data.current.temp)}°C
						</span>{" "}
						· {pick(lang, d.label)} · {t(lang, "weather.inTrieuLoc")}
					</span>
					<span className="font-semibold text-rice-700">→</span>
				</>
			) : (
				<span className="h-4 w-48 animate-pulse rounded bg-earth-300/30" />
			)}
		</Link>
	);
}

/** Full weather card: current conditions + 4-day forecast. */
export function WeatherCard({ lang }: { lang: Lang }) {
	const { status, data } = useWeather();

	if (status === "error") {
		return (
			<div className="rounded-2xl border border-earth-300/50 bg-card/70 p-6 text-ink-soft">
				{t(lang, "weather.unavailable")}
			</div>
		);
	}
	if (!data) {
		return (
			<div
				className="h-64 animate-pulse rounded-2xl bg-paper-2"
				aria-busy="true"
			/>
		);
	}

	const now = describeWeather(data.current.code, data.current.isDay);
	const time = (iso: string) => iso.slice(11, 16);

	return (
		<div className="overflow-hidden rounded-2xl border border-earth-300/50 bg-card/70">
			<div className="flex flex-wrap items-center gap-6 bg-rice-700 p-6 text-paper">
				<span className="text-6xl" aria-hidden="true">
					{now.icon}
				</span>
				<div>
					<p className="font-serif text-5xl font-semibold">
						{round(data.current.temp)}°C
					</p>
					<p className="text-rice-100">{pick(lang, now.label)}</p>
				</div>
				<dl className="ml-auto grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-rice-100">
					<dt>{t(lang, "weather.feelsLike")}</dt>
					<dd className="font-semibold text-paper">
						{round(data.current.feelsLike)}°C
					</dd>
					<dt>{t(lang, "weather.humidity")}</dt>
					<dd className="font-semibold text-paper">{data.current.humidity}%</dd>
					<dt>{t(lang, "weather.wind")}</dt>
					<dd className="font-semibold text-paper">
						{round(data.current.wind)} km/h
					</dd>
					<dt>{t(lang, "weather.sun")}</dt>
					<dd className="font-semibold text-paper">
						{time(data.sunrise)} – {time(data.sunset)}
					</dd>
				</dl>
			</div>
			<ol className="grid grid-cols-2 divide-earth-300/50 sm:grid-cols-4 sm:divide-x">
				{data.daily.map((day, i) => {
					const d = describeWeather(day.code);
					return (
						<li key={day.date} className="p-4 text-center">
							<p className="text-xs font-semibold uppercase tracking-widest text-earth-700">
								{dayName(lang, day.date, i)}
							</p>
							<p className="mt-2 text-3xl" aria-hidden="true">
								{d.icon}
							</p>
							<p className="mt-1 text-sm text-ink-soft">
								{pick(lang, d.label)}
							</p>
							<p className="mt-1 font-semibold text-rice-900">
								{round(day.max)}°{" "}
								<span className="font-normal text-ink-soft">
									/ {round(day.min)}°
								</span>
							</p>
							{day.rainChance !== null && (
								<p className="mt-1 text-xs text-ink-soft">
									💧 {day.rainChance}%
								</p>
							)}
						</li>
					);
				})}
			</ol>
			<p className="border-t border-earth-300/50 px-4 py-2 text-right text-xs text-ink-soft">
				{t(lang, "weather.source")}{" "}
				<a
					href="https://open-meteo.com/"
					target="_blank"
					rel="noreferrer"
					className="underline"
				>
					Open-Meteo
				</a>
			</p>
		</div>
	);
}
