import type { L } from "./i18n";

/** WMO weather interpretation codes (as used by Open-Meteo) → icon + label. */
export function describeWeather(
	code: number,
	isDay = true,
): { icon: string; label: L } {
	if (code === 0)
		return {
			icon: isDay ? "☀️" : "🌙",
			label: { vi: "Trời quang", en: "Clear" },
		};
	if (code === 1)
		return {
			icon: isDay ? "🌤️" : "🌙",
			label: { vi: "Ít mây", en: "Mainly clear" },
		};
	if (code === 2)
		return { icon: "⛅", label: { vi: "Có mây", en: "Partly cloudy" } };
	if (code === 3)
		return { icon: "☁️", label: { vi: "Nhiều mây", en: "Overcast" } };
	if (code === 45 || code === 48)
		return { icon: "🌫️", label: { vi: "Sương mù", en: "Fog" } };
	if (code >= 51 && code <= 57)
		return { icon: "🌦️", label: { vi: "Mưa phùn", en: "Drizzle" } };
	if (code >= 61 && code <= 67)
		return { icon: "🌧️", label: { vi: "Mưa", en: "Rain" } };
	if (code >= 71 && code <= 77)
		return { icon: "🌨️", label: { vi: "Tuyết", en: "Snow" } };
	if (code >= 80 && code <= 82)
		return { icon: "🌦️", label: { vi: "Mưa rào", en: "Showers" } };
	if (code === 85 || code === 86)
		return { icon: "🌨️", label: { vi: "Mưa tuyết", en: "Snow showers" } };
	if (code >= 95)
		return { icon: "⛈️", label: { vi: "Dông", en: "Thunderstorm" } };
	return { icon: "🌡️", label: { vi: "Không rõ", en: "Unknown" } };
}
