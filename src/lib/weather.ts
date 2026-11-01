export type Weather = {
	current: {
		temp: number;
		feelsLike: number;
		humidity: number;
		wind: number;
		code: number;
		isDay: boolean;
		time: string;
	};
	daily: {
		date: string;
		code: number;
		max: number;
		min: number;
		rainChance: number | null;
	}[];
	sunrise: string;
	sunset: string;
};

// Triệu Lộc commune centre. Fetched from the visitor's browser (Open-Meteo allows CORS, no key):
// each visitor has their own free quota, unlike a shared server IP that can be rate-limited.
export const WEATHER_URL =
	"https://api.open-meteo.com/v1/forecast?latitude=19.9421&longitude=105.8195" +
	"&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day" +
	"&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset" +
	"&timezone=Asia%2FHo_Chi_Minh&forecast_days=4";

const CACHE_KEY = "tl-weather-v1";
const TTL = 15 * 60_000;

type OpenMeteo = {
	current: {
		time: string;
		temperature_2m: number;
		apparent_temperature: number;
		relative_humidity_2m: number;
		weather_code: number;
		wind_speed_10m: number;
		is_day: number;
	};
	daily: {
		time: string[];
		weather_code: number[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		precipitation_probability_max: (number | null)[];
		sunrise: string[];
		sunset: string[];
	};
};

export function parseOpenMeteo(j: OpenMeteo): Weather {
	return {
		current: {
			temp: j.current.temperature_2m,
			feelsLike: j.current.apparent_temperature,
			humidity: j.current.relative_humidity_2m,
			wind: j.current.wind_speed_10m,
			code: j.current.weather_code,
			isDay: j.current.is_day === 1,
			time: j.current.time,
		},
		daily: j.daily.time.map((date, i) => ({
			date,
			code: j.daily.weather_code[i],
			max: j.daily.temperature_2m_max[i],
			min: j.daily.temperature_2m_min[i],
			rainChance: j.daily.precipitation_probability_max[i],
		})),
		sunrise: j.daily.sunrise[0],
		sunset: j.daily.sunset[0],
	};
}

let inflight: Promise<Weather | null> | null = null;

/** Current conditions + 4-day forecast, cached in sessionStorage for 15 minutes. Null on failure. */
export function fetchWeather(): Promise<Weather | null> {
	try {
		const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null") as {
			at: number;
			data: Weather;
		} | null;
		if (cached && Date.now() - cached.at < TTL)
			return Promise.resolve(cached.data);
	} catch {
		// storage unavailable — just fetch
	}
	// The home chip and the info card can mount together; share one request.
	inflight ??= fetch(WEATHER_URL, { signal: AbortSignal.timeout(8000) })
		.then((r) =>
			r.ok
				? (r.json() as Promise<OpenMeteo>)
				: Promise.reject(new Error(String(r.status))),
		)
		.then((j) => {
			const data = parseOpenMeteo(j);
			try {
				sessionStorage.setItem(
					CACHE_KEY,
					JSON.stringify({ at: Date.now(), data }),
				);
			} catch {}
			return data;
		})
		.catch(() => null)
		.finally(() => {
			inflight = null;
		});
	return inflight;
}
