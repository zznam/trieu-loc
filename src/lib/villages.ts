import villagesData from "#/content/villages.json";
import { getPeople, places } from "./content";
import { events } from "./events";
import type { L, Lang } from "./i18n";

export type FormerCommune = "dai-loc" | "trieu-loc" | "tien-loc";

export type Village = {
	id: string;
	/** The commune the village belonged to before the July 2025 merger. */
	former: FormerCommune;
	name: L;
	intro: L;
	facts: L[];
	coords?: [number, number];
	photo?: string;
	/** Placeholder entry that still needs a real name and description. */
	sample: boolean;
};

export const villages = villagesData as Village[];

export const formerCommuneLabel: Record<FormerCommune, L> = {
	"dai-loc": { vi: "Xã Đại Lộc (cũ)", en: "Former Đại Lộc commune" },
	"trieu-loc": { vi: "Xã Triệu Lộc (cũ)", en: "Former Triệu Lộc commune" },
	"tien-loc": { vi: "Xã Tiến Lộc (cũ)", en: "Former Tiến Lộc commune" },
};

export const FORMER_ORDER: FormerCommune[] = [
	"dai-loc",
	"trieu-loc",
	"tien-loc",
];

export const getVillage = (id: string) => villages.find((v) => v.id === id);

/** Everything on the site that is tagged with this village. */
export function villageLinks(id: string, lang: Lang) {
	return {
		places: places.filter((p) => p.villageId === id),
		people: getPeople(lang).filter((p) => p.villageId === id),
		events: events.filter((e) => e.villageId === id),
	};
}
