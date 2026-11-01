import type { GalleryItem } from "#/lib/content";

const palettes: Record<GalleryItem["season"], [string, string]> = {
	spring: ["#e1ecc9", "#c2543f"],
	summer: ["#f2d98a", "#6d9440"],
	autumn: ["#ead2a8", "#b5813f"],
	winter: ["#dfe3d6", "#5b5747"],
};

/** Shows the real photo when `src` is set, otherwise a warm illustrated placeholder. */
export function Photo({
	item,
	label,
	placeholderText,
}: {
	item: GalleryItem;
	label: string;
	placeholderText: string;
}) {
	if (item.src) {
		return (
			<img
				src={item.src}
				alt={label}
				loading="lazy"
				className="h-full w-full object-cover"
			/>
		);
	}
	const [bg, fg] = palettes[item.season];
	return (
		<div
			className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center"
			style={{ background: bg }}
		>
			<svg viewBox="0 0 64 40" className="w-16 opacity-70" aria-hidden="true">
				<path d="M0 34 Q16 10 28 22 Q38 6 64 30 V40 H0Z" fill={fg} />
				<circle cx="48" cy="9" r="5" fill={fg} opacity="0.6" />
			</svg>
			<span
				className="text-xs font-medium uppercase tracking-wider"
				style={{ color: fg }}
			>
				{placeholderText}
			</span>
		</div>
	);
}
