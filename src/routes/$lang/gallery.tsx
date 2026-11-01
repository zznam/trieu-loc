import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "#/components/PageHeader";
import { Photo } from "#/components/Photo";
import { type GalleryItem, gallery, site } from "#/lib/content";
import { type L, type Lang, pick, t } from "#/lib/i18n";
import { seo } from "#/lib/seo";

export const Route = createFileRoute("/$lang/gallery")({
	head: ({ params }) => {
		const lang = params.lang as Lang;
		return seo(lang, t(lang, "gallery.title"), t(lang, "gallery.lead"));
	},
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
	const [season, setSeason] = useState<GalleryItem["season"] | "all">("all");
	const items =
		season === "all" ? gallery : gallery.filter((g) => g.season === season);

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
					{items.map((item, i) => (
						<figure
							key={item.id}
							className={`overflow-hidden rounded-2xl border border-earth-300/50 bg-card ${i % 5 === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
						>
							<div className={i % 5 === 0 ? "aspect-square" : "aspect-[4/3]"}>
								<Photo
									item={item}
									label={pick(lang, item.caption)}
									placeholderText={t(lang, "common.photoSoon")}
								/>
							</div>
							<figcaption className="px-3 py-2 text-sm text-ink-soft">
								{pick(lang, item.caption)}
							</figcaption>
						</figure>
					))}
				</div>
				<p className="mt-10 text-center text-ink-soft">
					📷{" "}
					<a
						className="font-semibold text-rice-700 underline"
						href={`mailto:${site.contact.email}`}
					>
						{site.contact.email}
					</a>
				</p>
			</section>
		</>
	);
}
