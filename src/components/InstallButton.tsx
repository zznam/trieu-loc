import { useEffect, useState } from "react";
import { type Lang, t } from "#/lib/i18n";
import { onInstallAvailable, promptInstall } from "#/lib/pwa";

/** Shown only when the browser says the site can be installed (Chrome/Edge/Android). */
export function InstallButton({ lang }: { lang: Lang }) {
	const [available, setAvailable] = useState(false);
	useEffect(() => {
		const off = onInstallAvailable(setAvailable);
		return () => {
			off();
		};
	}, []);
	if (!available) return null;
	return (
		<button
			type="button"
			onClick={() => void promptInstall()}
			className="mt-2 inline-flex items-center gap-2 rounded-full border border-paper/40 px-4 py-2 text-sm font-semibold text-paper hover:bg-paper/10"
		>
			📲 {t(lang, "pwa.install")}
		</button>
	);
}
