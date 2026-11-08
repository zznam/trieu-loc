import { useState } from "react";
import { feedPath } from "#/lib/feeds";
import { type Lang, t } from "#/lib/i18n";
import { SITE_URL } from "#/lib/seo";

/** "Subscribe in your calendar app" box: webcal:// link, .ics download and a copyable URL. */
export function CalendarSubscribe({ lang }: { lang: Lang }) {
	const path = feedPath("events", lang);
	const https = `${SITE_URL}${path}`;
	// webcal:// makes iOS/macOS Calendar and Outlook offer a live subscription.
	const webcal = https.replace(/^https?:/, "webcal:");
	const [copied, setCopied] = useState(false);
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(https);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			window.prompt(t(lang, "feed.copyUrl"), https);
		}
	};
	return (
		<div
			className="mb-10 rounded-2xl border border-rice-300/60 bg-rice-50 p-5"
			data-testid="calendar-subscribe"
		>
			<p className="font-semibold text-rice-900">
				📆 {t(lang, "feed.subscribe")}
			</p>
			<p className="mt-1 text-sm text-ink-soft">
				{t(lang, "feed.subscribeHint")}
			</p>
			<div className="mt-3 flex flex-wrap gap-2 text-sm">
				<a
					href={webcal}
					className="rounded-full bg-rice-700 px-4 py-2 font-semibold text-paper"
				>
					{t(lang, "feed.subscribeButton")}
				</a>
				<a
					href={path}
					download
					className="rounded-full border border-earth-300 px-4 py-2 font-medium text-ink-soft hover:bg-rice-100"
				>
					⤓ {t(lang, "feed.download")}
				</a>
				<button
					type="button"
					onClick={() => void copy()}
					className="rounded-full border border-earth-300 px-4 py-2 font-medium text-ink-soft hover:bg-rice-100"
				>
					🔗 {copied ? t(lang, "share.copied") : t(lang, "feed.copyUrl")}
				</button>
			</div>
		</div>
	);
}
