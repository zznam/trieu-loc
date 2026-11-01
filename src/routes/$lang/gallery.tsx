import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ContributeCta } from "#/components/ContributeCta";
import { Lightbox, type Slide } from "#/components/Lightbox";
import { PageHeader } from "#/components/PageHeader";
import { Photo } from "#/components/Photo";
import { type GalleryItem, gallery } from "#/lib/content";
import { type L, type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";
import { getCommunityPhotos } from "#/server/contributions";

export const Route = createFileRoute("/$lang/gallery")({
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(
			lang,
			t(lang, "gallery.title"),
			t(lang, "gallery.lead"),
			"/gallery",
			"gallery",
		);
	},
	loader: () => getCommunityPhotos(),
	component: GalleryPage,
});

const SEASONS: Record<GalleryItem["season"], L> = {
	spring: { vi: "Xuân", en: "Spring" },
	summer: { vi: "Hạ", en: "Summer" },
	autumn: { vi: "Thu", en: "Autumn" },
	winter: { vi: "Đông", en: "Winter" },
};

function GalleryPage() {
	const lang = Route.useParams().lang as Lang;
	const community = Route.useLoaderData();
	const [season, setSeason] = useState<GalleryItem["season"] | "all">("all");
	const [open, setOpen] = useState<number | null>(null);
	const items =
		season === "all" ? gallery : gallery.filter((g) => g.season === season);

	// One slideshow across the visible curated photos (those with a real image) and community photos.
	const communityPhotos = useMemo(
		() => community.flatMap((c) => c.photos.map((p) => ({ ...p, c }))),
		[community],
	);
	const slides: Slide[] = useMemo(
		() => [
			...items
				.filter((i) => i.src)
				.map((i) => ({
					src: i.src,
					alt: pick(lang, i.caption),
					caption: pick(lang, i.caption),
				})),
			...communityPhotos.map((p) => ({
				src: p.url,
				alt: p.c.title,
				caption: p.c.title,
				credit: `${t(lang, "gallery.by")} ${p.c.name}${p.c.village ? ` · ${p.c.village}` : ""}`,
				width: p.width || undefined,
				height: p.height || undefined,
			})),
		],
		[items, communityPhotos, lang],
	);
	const slideIndex = (src: string) => slides.findIndex((s) => s.src === src);

	return (
		<>
			<PageHeader
				title={t(lang, "gallery.title")}
				lead={t(lang, "gallery.lead")}
			/>
			<section className="mx-auto max-w-6xl px-4 py-10">
				<div className="mb-8 flex flex-wrap gap-2">
					{(["all", "spring", "summer", "autumn", "winter"] as const).map(
						(s) => (
							<button
								key={s}
								type="button"
								aria-pressed={season === s}
								onClick={() => setSeason(s)}
								className={`rounded-full px-4 py-2 text-sm font-medium transition ${
									season === s
										? "bg-rice-700 text-paper"
										: "border border-earth-300 text-ink-soft hover:bg-rice-100"
								}`}
							>
								{s === "all"
									? t(lang, "places.filter.all")
									: pick(lang, SEASONS[s])}
							</button>
						),
					)}
				</div>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					{items.map((item, i) => {
						const photo = (
							<div className={i % 5 === 0 ? "aspect-square" : "aspect-[4/3]"}>
								<Photo
									item={item}
									label={pick(lang, item.caption)}
									placeholderText={t(lang, "common.photoSoon")}
								/>
							</div>
						);
						return (
							<figure
								key={item.id}
								className={`overflow-hidden rounded-2xl border border-earth-300/50 bg-card ${i % 5 === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
							>
								{item.src ? (
									<button
										type="button"
										onClick={() => setOpen(slideIndex(item.src))}
										aria-label={`${t(lang, "lightbox.open")}: ${pick(lang, item.caption)}`}
										className="block w-full cursor-zoom-in"
									>
										{photo}
									</button>
								) : (
									photo
								)}
								<figcaption className="px-3 py-2 text-sm text-ink-soft">
									{pick(lang, item.caption)}
								</figcaption>
							</figure>
						);
					})}
				</div>

				{communityPhotos.length > 0 && (
					<div className="mt-16">
						<h2 className="text-2xl font-semibold text-rice-900">
							{t(lang, "gallery.community")}
						</h2>
						<div className="mt-6 columns-2 gap-4 md:columns-3">
							{communityPhotos.map((p) => (
								<figure
									key={p.url}
									className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-earth-300/50 bg-card"
								>
									<button
										type="button"
										onClick={() => setOpen(slideIndex(p.url))}
										aria-label={`${t(lang, "lightbox.open")}: ${p.c.title}`}
										className="block w-full cursor-zoom-in"
									>
										<img
											src={p.url}
											alt={p.c.title}
											loading="lazy"
											width={p.width || undefined}
											height={p.height || undefined}
											className="h-auto w-full transition hover:opacity-90"
										/>
									</button>
									<figcaption className="px-3 py-2 text-sm">
										<span className="block font-medium text-ink">
											{p.c.title}
										</span>
										<span className="text-ink-soft">
											{t(lang, "gallery.by")} {p.c.name}
											{p.c.village && ` · ${p.c.village}`}
										</span>
									</figcaption>
								</figure>
							))}
						</div>
					</div>
				)}

				<ContributeCta
					lang={lang}
					text={t(lang, "gallery.lead")}
					kind="photo"
				/>
			</section>
			<Lightbox
				lang={lang}
				slides={slides}
				index={open}
				onIndex={setOpen}
				onClose={() => setOpen(null)}
			/>
		</>
	);
}
