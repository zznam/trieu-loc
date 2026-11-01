import { useEffect, useRef } from "react";
import { type Lang, t } from "#/lib/i18n";

export type Slide = {
	src: string;
	alt: string;
	caption: string;
	credit?: string;
	width?: number;
	height?: number;
};

/**
 * Full-screen photo viewer built on <dialog> (native focus trap, Esc to close).
 * Arrow keys / swipe to move between photos; neighbours are preloaded.
 */
export function Lightbox({
	lang,
	slides,
	index,
	onIndex,
	onClose,
}: {
	lang: Lang;
	slides: Slide[];
	index: number | null;
	onIndex: (i: number) => void;
	onClose: () => void;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	const touchX = useRef<number | null>(null);
	const open = index !== null && slides.length > 0;
	const count = slides.length;
	const go = (delta: number) =>
		index !== null && onIndex((index + delta + count) % count);

	useEffect(() => {
		const d = dialog.current;
		if (!d) return;
		if (open && !d.open) d.showModal();
		if (!open && d.open) d.close();
	}, [open]);

	// Lock page scroll while open.
	useEffect(() => {
		if (!open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [open]);

	// Preload the previous and next photos.
	useEffect(() => {
		if (index === null || count < 2) return;
		for (const i of [index - 1, index + 1]) {
			const img = new Image();
			img.src = slides[(i + count) % count].src;
		}
	}, [index, slides, count]);

	const slide = index !== null ? slides[index] : undefined;

	return (
		<dialog
			ref={dialog}
			aria-label={t(lang, "lightbox.label")}
			onClose={onClose}
			onKeyDown={(e) => {
				if (e.key === "ArrowRight") go(1);
				if (e.key === "ArrowLeft") go(-1);
			}}
			onClick={(e) => {
				// Clicking the dark backdrop (not the photo or controls) closes the viewer.
				if (e.target === e.currentTarget) onClose();
			}}
			onTouchStart={(e) => {
				touchX.current = e.touches[0].clientX;
			}}
			onTouchEnd={(e) => {
				if (touchX.current === null) return;
				const dx = e.changedTouches[0].clientX - touchX.current;
				touchX.current = null;
				if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
			}}
			className="m-0 h-dvh max-h-none w-screen max-w-none bg-[rgb(10_12_8/0.96)] p-0 text-white backdrop:bg-black"
		>
			{slide && (
				<div className="flex h-full w-full flex-col">
					<div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
						<span aria-live="polite" className="tabular-nums text-white/80">
							{(index ?? 0) + 1} / {count}
						</span>
						<button
							type="button"
							onClick={onClose}
							aria-label={t(lang, "lightbox.close")}
							className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl hover:bg-white/20"
						>
							✕
						</button>
					</div>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: click-outside-to-close is a mouse convenience; Esc and the close button cover keyboards */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard users close with Esc (native dialog) or the close button */}
					<div
						className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
						onClick={(e) => {
							if (e.target === e.currentTarget) onClose();
						}}
					>
						<img
							key={slide.src}
							src={slide.src}
							alt={slide.alt}
							width={slide.width}
							height={slide.height}
							className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
						/>
						{count > 1 && (
							<>
								<button
									type="button"
									onClick={() => go(-1)}
									aria-label={t(lang, "lightbox.prev")}
									className="absolute left-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl hover:bg-white/20 sm:grid"
								>
									‹
								</button>
								<button
									type="button"
									onClick={() => go(1)}
									aria-label={t(lang, "lightbox.next")}
									className="absolute right-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl hover:bg-white/20 sm:grid"
								>
									›
								</button>
							</>
						)}
					</div>
					<div className="px-4 py-4 text-center">
						<p className="font-serif text-lg">{slide.caption}</p>
						{slide.credit && (
							<p className="mt-1 text-sm text-white/70">{slide.credit}</p>
						)}
						{count > 1 && (
							<p className="mt-2 text-xs text-white/50 sm:hidden">
								{t(lang, "lightbox.swipe")}
							</p>
						)}
					</div>
				</div>
			)}
		</dialog>
	);
}
