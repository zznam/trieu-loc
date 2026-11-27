import { useEffect, useState } from "react";
import { type Lang, t } from "#/lib/i18n";

/** Floating button that appears after scrolling down a screen or so. */
export function BackToTop({ lang }: { lang: Lang }) {
	const [show, setShow] = useState(false);
	useEffect(() => {
		const onScroll = () => setShow(window.scrollY > window.innerHeight * 1.2);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	if (!show) return null;
	return (
		<button
			type="button"
			onClick={() => {
				window.scrollTo({ top: 0 });
				document.getElementById("main")?.focus({ preventScroll: true });
			}}
			aria-label={t(lang, "a11y.backToTop")}
			title={t(lang, "a11y.backToTop")}
			className="no-print fixed right-4 bottom-4 z-[900] grid h-11 w-11 place-items-center rounded-full bg-rice-700 text-lg text-paper shadow-lg hover:bg-rice-900"
		>
			<span aria-hidden="true">↑</span>
		</button>
	);
}
