import { useEffect, useState } from "react";
import { type Lang, t } from "#/lib/i18n";
import {
	applyTextSize,
	readTextSize,
	TEXT_SIZES,
	type TextSize,
} from "#/lib/theme";

/** Cycles the base font size: normal → larger → largest (remembered per device). */
export function TextSizeToggle({ lang }: { lang: Lang }) {
	const [size, setSize] = useState<TextSize | null>(null);
	useEffect(() => setSize(readTextSize()), []);
	const next =
		TEXT_SIZES[(TEXT_SIZES.indexOf(size ?? "md") + 1) % TEXT_SIZES.length];
	const label = `${t(lang, "a11y.textSize")}: ${t(lang, `a11y.textSize.${size ?? "md"}`)}`;
	return (
		<button
			type="button"
			onClick={() => {
				applyTextSize(next);
				setSize(next);
			}}
			aria-label={label}
			title={label}
			data-size={size ?? "md"}
			className="grid h-8 min-w-8 place-items-center rounded-full border border-earth-300 px-1.5 font-serif text-xs font-semibold text-earth-700 hover:bg-earth-300/20"
		>
			<span aria-hidden="true">
				A
				<span className="text-[0.7em] align-super">
					{size === "xl" ? "++" : size === "lg" ? "+" : ""}
				</span>
			</span>
		</button>
	);
}
