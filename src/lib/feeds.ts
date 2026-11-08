// Builders for the RSS news feed and the iCalendar events feed. Pure functions: the
// server routes in src/routes/feeds/ gather the data and call these.
import type { Occurrence } from "./events";
import { type Lang, pick } from "./i18n";
import { type SolarDate, toISO } from "./lunar";

export type FeedKind = "news" | "events";

/** Feed URLs: /feeds/news-vi.xml (RSS) and /feeds/events-en.ics (iCalendar). */
export const feedPath = (kind: FeedKind, lang: Lang) =>
	`/feeds/${kind}-${lang}.${kind === "news" ? "xml" : "ics"}`;

export type FeedItem = {
	title: string;
	/** Absolute URL of the article. */
	url: string;
	/** YYYY-MM-DD or a full ISO timestamp. */
	date: string;
	summary: string;
};

const xmlEscape = (s: string) =>
	s
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		// Control characters are not allowed in XML 1.0.
		// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping them is the point
		.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");

/** RFC 822 date as RSS wants it. A bare date is taken as 07:00 Vietnam time (00:00 UTC). */
function rfc822(date: string) {
	const d = new Date(date.length === 10 ? `${date}T00:00:00Z` : date);
	return Number.isNaN(d.getTime())
		? new Date(0).toUTCString()
		: d.toUTCString();
}

export function buildRss(opts: {
	lang: Lang;
	title: string;
	description: string;
	/** Absolute URL of the news page. */
	link: string;
	/** Absolute URL of this feed. */
	self: string;
	items: FeedItem[];
}): string {
	const items = [...opts.items]
		.sort((a, b) => b.date.localeCompare(a.date))
		.map(
			(i) =>
				`<item><title>${xmlEscape(i.title)}</title><link>${xmlEscape(i.url)}</link><guid isPermaLink="true">${xmlEscape(i.url)}</guid><pubDate>${rfc822(i.date)}</pubDate><description>${xmlEscape(i.summary)}</description></item>`,
		)
		.join("");
	const latest = opts.items
		.map((i) => i.date)
		.sort()
		.at(-1);
	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${xmlEscape(opts.title)}</title><link>${xmlEscape(opts.link)}</link><description>${xmlEscape(opts.description)}</description><language>${opts.lang === "vi" ? "vi-VN" : "en"}</language>${latest ? `<lastBuildDate>${rfc822(latest)}</lastBuildDate>` : ""}<atom:link href="${xmlEscape(opts.self)}" rel="self" type="application/rss+xml"/>${items}</channel></rss>
`;
}

// ---------- iCalendar (RFC 5545) ----------

const icsEscape = (s: string) =>
	s
		.replaceAll("\\", "\\\\")
		.replaceAll(";", "\\;")
		.replaceAll(",", "\\,")
		.replace(/\r?\n/g, "\\n");

/** Folds a content line to ≤75 octets, never splitting a UTF-8 character. */
export function foldLine(line: string): string {
	const enc = new TextEncoder();
	const out: string[] = [];
	let cur = "";
	let bytes = 0;
	for (const ch of line) {
		const n = enc.encode(ch).length;
		// Continuation lines start with a space, which counts toward their 75 octets.
		const limit = out.length === 0 ? 75 : 74;
		if (bytes + n > limit) {
			out.push(cur);
			cur = "";
			bytes = 0;
		}
		cur += ch;
		bytes += n;
	}
	out.push(cur);
	return out.join("\r\n ");
}

const compact = (d: SolarDate) => toISO(d).replaceAll("-", "");

function nextDay(d: SolarDate): SolarDate {
	const t = new Date(Date.UTC(d.year, d.month - 1, d.day + 1));
	return {
		day: t.getUTCDate(),
		month: t.getUTCMonth() + 1,
		year: t.getUTCFullYear(),
	};
}

function stamp(now: Date) {
	return `${now.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
}

/**
 * An iCalendar file with one all-day VEVENT per occurrence. Lunar events are listed
 * occurrence by occurrence (calendar apps can't repeat on the lunar calendar).
 */
export function buildIcs(opts: {
	lang: Lang;
	name: string;
	/** Absolute URL of the events page, used as each event's URL. */
	url: string;
	occurrences: Occurrence[];
	now?: Date;
	/** Extra text appended to each description, e.g. the lunar date. */
	describe?: (o: Occurrence) => string;
}): string {
	const dtstamp = stamp(opts.now ?? new Date());
	const host = new URL(opts.url).host;
	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Trieu Loc//Events//VI",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		`X-WR-CALNAME:${icsEscape(opts.name)}`,
		"X-WR-TIMEZONE:Asia/Ho_Chi_Minh",
		"REFRESH-INTERVAL;VALUE=DURATION:P1D",
		"X-PUBLISHED-TTL:P1D",
	];
	for (const o of opts.occurrences) {
		const body = pick(opts.lang, o.event.body);
		const extra = opts.describe?.(o);
		lines.push(
			"BEGIN:VEVENT",
			`UID:${o.event.id}-${toISO(o.start)}@${host}`,
			`DTSTAMP:${dtstamp}`,
			`DTSTART;VALUE=DATE:${compact(o.start)}`,
			`DTEND;VALUE=DATE:${compact(nextDay(o.end))}`,
			`SUMMARY:${icsEscape(pick(opts.lang, o.event.title))}`,
			`DESCRIPTION:${icsEscape([extra, body].filter(Boolean).join("\n\n"))}`,
			`LOCATION:${icsEscape(pick(opts.lang, o.event.location))}`,
			`URL:${opts.url}#${o.event.id}`,
			"TRANSP:TRANSPARENT",
			"END:VEVENT",
		);
	}
	lines.push("END:VCALENDAR");
	return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
