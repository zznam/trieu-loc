import { useEffect, useState } from "react";
import { type Lang, t } from "#/lib/i18n";
import { SITE_URL } from "#/lib/seo";
import { buildShareLinks } from "#/lib/share";

/**
 * Share row for a page. `path` is the page path *including* the language prefix, e.g. "/vi/news/abc".
 * Uses the native share sheet when the browser has one, plus plain links that work without JavaScript.
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
	const url = `${SITE_URL}${path}`;
	const [canNativeShare, setCanNativeShare] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
	}, []);

	useEffect(() => {
		if (!copied) return;
		const id = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(id);
	}, [copied]);

	async function nativeShare() {
		try {
			await navigator.share({ title, url });
		} catch {
			// The user closed the sheet; nothing to do.
		}
	}

	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
		} catch {
			window.prompt(t(lang, "share.copy"), url);
		}
	}

	const button =
		"rounded-full border border-earth-300/70 px-3 py-1 text-sm font-semibold text-earth-700 hover:bg-rice-100";

	return (
		<section
			aria-label={t(lang, "share.title")}
			className="mt-10 flex flex-wrap items-center gap-2"
		>
			<span className="mr-1 text-sm font-semibold text-ink-soft">
				{t(lang, "share.title")}
			</span>
			{canNativeShare && (
				<button type="button" onClick={nativeShare} className={button}>
					📤 {t(lang, "share.native")}
				</button>
			)}
			{buildShareLinks(url, title).map((link) => (
				<a
					key={link.target}
					href={link.href}
					target={link.target === "email" ? undefined : "_blank"}
					rel="noopener noreferrer"
					className={button}
				>
					{link.label}
				</a>
			))}
			<button
				type="button"
				onClick={copy}
				className={button}
				aria-live="polite"
			>
				{copied
					? `✓ ${t(lang, "share.copied")}`
					: `🔗 ${t(lang, "share.copy")}`}
			</button>
		</section>
	);
}
