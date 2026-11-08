import { useEffect, useState } from "react";
import { type Lang, t } from "#/lib/i18n";
import { SITE_URL } from "#/lib/seo";

const pill =
	"inline-flex items-center gap-1.5 rounded-full border border-earth-300 px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-rice-100";

/**
 * Share links for a page: the phone's share sheet (where supported — it covers
 * Zalo, Messenger, etc.), Facebook and copy-link. `path` is the page path without the language prefix.
 */
export function ShareButtons({
	lang,
	path,
	title,
}: {
	lang: Lang;
	path: string;
	title: string;
}) {
	const url = `${SITE_URL}/${lang}${path}`;
	// navigator.share only exists in the browser; render it after hydration.
	const [canShare, setCanShare] = useState(false);
	const [copied, setCopied] = useState(false);
	useEffect(() => setCanShare(typeof navigator.share === "function"), []);
	useEffect(() => {
		if (!copied) return;
		const id = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(id);
	}, [copied]);

	const copy = async () => {
		// The current origin, so preview deployments copy their own address.
		const here = `${window.location.origin}/${lang}${path}`;
		try {
			await navigator.clipboard.writeText(here);
			setCopied(true);
		} catch {
			// Clipboard blocked (e.g. insecure context): let the visitor copy it by hand.
			window.prompt(t(lang, "share.copy"), here);
		}
	};

	const enc = encodeURIComponent(url);
	return (
		<div
			className="mt-10 flex flex-wrap items-center gap-2"
			data-testid="share"
		>
			<span className="mr-1 text-sm font-semibold text-rice-900">
				{t(lang, "share.title")}:
			</span>
			{canShare && (
				<button
					type="button"
					className={pill}
					onClick={() =>
						navigator
							.share({ title, url: `${window.location.origin}/${lang}${path}` })
							.catch(() => {
								/* cancelled */
							})
					}
				>
					📤 {t(lang, "share.native")}
				</button>
			)}
			<a
				className={pill}
				href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`}
				target="_blank"
				rel="noreferrer"
			>
				Facebook
			</a>
			<button type="button" className={pill} onClick={() => void copy()}>
				🔗 {copied ? t(lang, "share.copied") : t(lang, "share.copy")}
			</button>
			<span className="sr-only" aria-live="polite">
				{copied ? t(lang, "share.copied") : ""}
			</span>
		</div>
	);
}
