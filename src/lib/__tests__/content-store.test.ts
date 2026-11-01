import { afterEach, describe, expect, it } from "vitest";
import {
	businesses,
	contacts,
	getNews,
	getPerson,
	history,
	places,
	site,
} from "../content";
import {
	COLLECTION_NAMES,
	COLLECTIONS,
	type ContentSnapshot,
	itemId,
} from "../content-schemas";
import { applySnapshot, contentVersion, fileContent } from "../content-store";
import { search } from "../search";
import { getVillage } from "../villages";

afterEach(() => applySnapshot(null));

describe("content import", () => {
	it("every item in the bundled files passes the editor's validation", () => {
		const files = fileContent();
		for (const c of COLLECTION_NAMES) {
			for (const item of files[c] as unknown as Record<string, unknown>[]) {
				const r = COLLECTIONS[c].safeParse(item);
				expect(
					r.success,
					`${c}/${itemId(c, item)}: ${r.error?.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
				).toBe(true);
			}
		}
	});

	it("keeps the Markdown source of news and people", () => {
		const { news, people } = fileContent();
		expect(
			news.find((n) => n.slug === "2026-11-01-ra-mat-trang-web")?.vi.body,
		).toContain("**Triệu Lộc — Quê hương Bà Triệu**");
		expect(people.find((p) => p.slug === "ba-trieu")?.en?.name).toBe(
			"Lady Triệu (Triệu Thị Trinh)",
		);
	});

	it("flattens contacts and normalises timeline years for the editor", () => {
		const {
			contacts: c,
			history: [h],
		} = fileContent();
		expect(c.find((x) => x.phone === "113")?.id).toBe("emergency-1");
		expect(h.timeline[0].year).toEqual({ vi: "248", en: "248" });
	});
});

describe("applySnapshot", () => {
	const snapshot = (): ContentSnapshot => {
		const f = fileContent();
		f.places[0] = {
			...f.places[0],
			name: { vi: "Đền Bà Triệu (đã sửa)", en: "Bà Triệu Temple (edited)" },
		};
		f.news.push({
			slug: "2026-12-01-tin-moi",
			date: "2026-12-01",
			vi: { title: "Tin mới từ CSDL", summary: "x", body: "**đậm**" },
		});
		f.villages = f.villages.map((v) =>
			v.id === "dai-loc-1"
				? { ...v, name: { vi: "Thôn Đông", en: "Đông village" }, sample: false }
				: v,
		);
		return { version: "v1", imported: [...COLLECTION_NAMES], ...f };
	};

	it("replaces content in place for every reader", () => {
		const before = places;
		applySnapshot(snapshot());
		expect(places).toBe(before); // same array object, new contents
		expect(places[0].name.vi).toBe("Đền Bà Triệu (đã sửa)");
		expect(getVillage("dai-loc-1")?.name.vi).toBe("Thôn Đông");
		const post = getNews("vi").find((p) => p.slug === "2026-12-01-tin-moi");
		expect(post?.html).toContain("<strong>đậm</strong>");
		// English falls back to Vietnamese when there is no translation
		expect(
			getNews("en").find((p) => p.slug === "2026-12-01-tin-moi")?.title,
		).toBe("Tin mới từ CSDL");
		expect(contentVersion()).toBe("v1");
	});

	it("rebuilds the search index", () => {
		expect(search("vi", "da sua")).toHaveLength(0);
		applySnapshot(snapshot());
		expect(search("vi", "da sua")[0]?.doc.title).toBe("Đền Bà Triệu (đã sửa)");
		expect(
			search("vi", "thon dong").some((h) => h.doc.kind === "village"),
		).toBe(true);
	});

	it("goes back to the files when given null", () => {
		applySnapshot(snapshot());
		applySnapshot(null);
		expect(places[0].name.vi).toBe("Đền Bà Triệu");
		expect(getPerson("vi", "ba-trieu")?.name).toBe(
			"Bà Triệu (Triệu Thị Trinh)",
		);
		expect(contentVersion()).toBe("files");
	});

	it("keeps using files for collections that aren't imported", () => {
		const f = fileContent();
		f.places[0] = { ...f.places[0], name: { vi: "Đã sửa", en: "Edited" } };
		f.businesses = [];
		applySnapshot({
			version: "partial",
			imported: ["places", "businesses"],
			...f,
			contacts: [],
		});
		expect(places[0].name.vi).toBe("Đã sửa");
		expect(businesses).toHaveLength(0); // imported, then emptied: stays empty
		expect(contacts.length).toBeGreaterThan(0); // not imported: still the files
	});

	it("updates the site texts and history in place", () => {
		const f = fileContent();
		f.site[0] = {
			...f.site[0],
			name: { vi: "Xã Triệu Lộc mới", en: "New Triệu Lộc" },
		};
		f.history[0] = { ...f.history[0], timeline: [] };
		const siteRef = site;
		applySnapshot({
			version: "singletons",
			imported: ["site", "history"],
			...f,
		});
		expect(site).toBe(siteRef);
		expect(site.name.vi).toBe("Xã Triệu Lộc mới");
		expect("id" in site).toBe(false);
		expect(history.timeline).toHaveLength(0);
		applySnapshot(null);
		expect(site.name.vi).toBe("Xã Triệu Lộc");
		expect(history.timeline.length).toBeGreaterThan(0);
	});

	it("ignores re-applying the same version", () => {
		const s = snapshot();
		applySnapshot(s);
		if (s.places) s.places[0].name.vi = "khác";
		applySnapshot(s); // same version → no change
		expect(places[0].name.vi).toBe("Đền Bà Triệu (đã sửa)");
	});
});
