// Builds the newsletter digest (subject, HTML, text) for one language.
// Pure: callers pass in the content, so it is unit-testable without a database.
import { escapeHtml } from "./email";

export type DigestLang = "vi" | "en";

export type DigestInput = {
	lang: DigestLang;
	siteUrl: string;
	now: Date;
	news: {
		title: string;
		summary: string;
		date: string;
		url: string;
		community?: boolean;
	}[];
	events: {
		title: string;
		date: string;
		lunar: string;
		location: string;
		url: string;
	}[];
};

export type Digest = {
	subject: string;
	html: string;
	text: string;
	itemCount: number;
};

/** Placeholder replaced per recipient with their personal unsubscribe link. */
export const UNSUBSCRIBE_PLACEHOLDER = "%%UNSUBSCRIBE_URL%%";

const T = {
	vi: {
		subject: (m: string) => `Bản tin Triệu Lộc — ${m}`,
		hello: "Xin chào bà con và các bạn,",
		intro: "Đây là những tin tức và sự kiện mới của quê hương Triệu Lộc.",
		news: "Tin mới",
		events: "Sự kiện sắp tới",
		community: "Bà con kể",
		noNews: "Tháng này chưa có tin mới.",
		noEvents: "Chưa có sự kiện nào trong thời gian tới.",
		visit: "Xem trang Triệu Lộc",
		why: "Bạn nhận được thư này vì đã đăng ký bản tin của trang cộng đồng xã Triệu Lộc.",
		unsubscribe: "Huỷ đăng ký",
	},
	en: {
		subject: (m: string) => `Triệu Lộc newsletter — ${m}`,
		hello: "Hello,",
		intro: "Here is the latest news and upcoming events from Triệu Lộc.",
		news: "Latest news",
		events: "Upcoming events",
		community: "Community story",
		noNews: "No new stories this month.",
		noEvents: "No events coming up yet.",
		visit: "Visit the Triệu Lộc site",
		why: "You are receiving this because you subscribed to the Triệu Lộc community newsletter.",
		unsubscribe: "Unsubscribe",
	},
} as const;

export function monthLabel(lang: DigestLang, d: Date) {
	return d.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", {
		month: "long",
		year: "numeric",
		timeZone: "Asia/Ho_Chi_Minh",
	});
}

export function buildDigest(input: DigestInput): Digest {
	const t = T[input.lang];
	const e = escapeHtml;
	const subject = t.subject(monthLabel(input.lang, input.now));
	const home = `${input.siteUrl}/${input.lang}`;

	const newsHtml = input.news.length
		? input.news
				.map(
					(n) => `<tr><td style="padding:0 0 18px">
<p style="margin:0;font-size:12px;color:#7a4f22;text-transform:uppercase;letter-spacing:.06em">${e(n.date)}${n.community ? ` · ${e(t.community)}` : ""}</p>
<p style="margin:4px 0;font-family:Georgia,serif;font-size:19px"><a href="${e(n.url)}" style="color:#23361a;text-decoration:none">${e(n.title)}</a></p>
<p style="margin:0;color:#5b5747;font-size:14px;line-height:1.5">${e(n.summary)}</p></td></tr>`,
				)
				.join("")
		: `<tr><td style="color:#5b5747;padding-bottom:18px">${e(t.noNews)}</td></tr>`;

	const eventsHtml = input.events.length
		? input.events
				.map(
					(ev) => `<tr><td style="padding:0 0 12px">
<p style="margin:0;font-weight:600"><a href="${e(ev.url)}" style="color:#3f5f23;text-decoration:none">${e(ev.title)}</a></p>
<p style="margin:2px 0 0;color:#5b5747;font-size:14px">${e(ev.date)} · ${e(ev.lunar)}${ev.location ? ` · ${e(ev.location)}` : ""}</p></td></tr>`,
				)
				.join("")
		: `<tr><td style="color:#5b5747">${e(t.noEvents)}</td></tr>`;

	const html = `<!doctype html><html lang="${input.lang}"><body style="margin:0;background:#faf6ec;font-family:system-ui,-apple-system,sans-serif;color:#2b2a22">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6ec"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#3f5f23;color:#faf6ec;padding:24px">
<p style="margin:0;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#d9b77f">Xã Triệu Lộc · Thanh Hoá</p>
<h1 style="margin:6px 0 0;font-family:Georgia,serif;font-size:26px">${e(subject)}</h1></td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 4px">${e(t.hello)}</p><p style="margin:0 0 24px;color:#5b5747">${e(t.intro)}</p>
<h2 style="font-family:Georgia,serif;color:#23361a;font-size:20px;margin:0 0 12px">${e(t.news)}</h2>
<table role="presentation" width="100%">${newsHtml}</table>
<h2 style="font-family:Georgia,serif;color:#23361a;font-size:20px;margin:12px 0 12px">${e(t.events)}</h2>
<table role="presentation" width="100%">${eventsHtml}</table>
<p style="margin:24px 0 0"><a href="${e(home)}" style="display:inline-block;background:#3f5f23;color:#faf6ec;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">${e(t.visit)}</a></p>
</td></tr>
<tr><td style="padding:16px 24px;background:#f2ead7;color:#5b5747;font-size:12px;line-height:1.5">${e(t.why)}<br><a href="${UNSUBSCRIBE_PLACEHOLDER}" style="color:#7a4f22">${e(t.unsubscribe)}</a></td></tr>
</table></td></tr></table></body></html>`;

	const text = [
		subject,
		"",
		t.hello,
		t.intro,
		"",
		`== ${t.news} ==`,
		...(input.news.length
			? input.news.map((n) => `- ${n.title} (${n.date})\n  ${n.url}`)
			: [t.noNews]),
		"",
		`== ${t.events} ==`,
		...(input.events.length
			? input.events.map(
					(ev) =>
						`- ${ev.title}: ${ev.date} · ${ev.lunar}${ev.location ? ` · ${ev.location}` : ""}`,
				)
			: [t.noEvents]),
		"",
		home,
		"",
		`${t.why}`,
		`${t.unsubscribe}: ${UNSUBSCRIBE_PLACEHOLDER}`,
	].join("\n");

	return {
		subject,
		html,
		text,
		itemCount: input.news.length + input.events.length,
	};
}
