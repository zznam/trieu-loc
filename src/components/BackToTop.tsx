import { useEffect, useState } from "react";
import { type Lang, t } from "#/lib/i18n";

/** Scroll distance (px) after which the button appears. */
export const BACK_TO_TOP_AFTER = 800;

/** Floating "back to top" button for long pages; instant scroll when reduced motion is preferred. */
export function BackToTop({ lang }: { lang: Lang }) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const update = () => setVisible(window.scrollY > BACK_TO_TOP_AFTER);
		update();
		window.addEventListener("scroll", update, { passive: true });
		return () => window.removeEventListener("scroll", update);
	}, []);

	if (!visible) return null;
	return (
		<button
			type="button"
			onClick={() => {
				const reduce = window.matchMedia(
					"(prefers-reduced-motion: reduce)",
				).matches;
				window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
				document.getElementById("main")?.focus({ preventScroll: true });
			}}
			aria-label={t(lang, "common.backToTop")}
			title={t(lang, "common.backToTop")}
			className="fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center rounded-full border border-earth-300 bg-paper text-lg text-earth-700 shadow-lg hover:bg-rice-50 print:hidden"
		>
			↑
		</button>
	);
}
