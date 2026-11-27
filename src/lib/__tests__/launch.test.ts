import { afterEach, describe, expect, it } from "vitest";
import {
	contactsByGroup,
	getPeople,
	getPerson,
	publicBusinesses,
	site,
} from "../content";
import type { ContentSnapshot } from "../content-schemas";
import { applySnapshot, fileContent } from "../content-store";
import { upcomingEvents } from "../events";
import { isLaunchReady, launchChecklist, type SetupState } from "../launch";
import { search } from "../search";
import { getPublicVillage, publicVillages, villageLinks } from "../villages";

afterEach(() => applySnapshot(null));

/** Applies a database snapshot where only the site settings changed. */
function withSite(patch: Record<string, unknown>, version = "t1") {
	const files = fileContent();
	const snap: ContentSnapshot = {
		version,
		imported: ["site"],
		site: [{ ...files.site[0], ...patch }],
	};
	applySnapshot(snap);
}

const SETUP: SetupState = {
	db: true,
	accounts: true,
	missingCollections: [],
	blob: true,
	notify: true,
	verifiedSender: true,
	siteUrl: "https://trieuloc.vn",
};

const check = (id: string, setup = SETUP) => {
	const c = launchChecklist(setup).find((x) => x.id === id);
	if (!c) throw new Error(`no check ${id}`);
	return c;
};

describe("sample content", () => {
	it("is shown (with a note) until samples are hidden", () => {
		expect(site.hideSamples).toBeFalsy();
		expect(publicBusinesses().some((b) => b.sample)).toBe(true);
		expect(getPeople("vi").map((p) => p.slug)).toContain("mau-xa-que");
		expect(getPerson("en", "mau-nghe-nhan")).toBeDefined();
		expect(publicVillages()).toHaveLength(17);
	});

	it("disappears from every public list once hideSamples is on", () => {
		withSite({ hideSamples: true });
		expect(site.hideSamples).toBe(true);

		expect(publicBusinesses().filter((b) => b.sample)).toEqual([]);

		const slugs = getPeople("vi").map((p) => p.slug);
		expect(slugs).toContain("ba-trieu");
		expect(slugs).not.toContain("mau-xa-que");
		expect(getPerson("vi", "mau-xa-que")).toBeUndefined();
		expect(getPerson("en", "mau-nghe-nhan")).toBeUndefined();
		expect(getPerson("vi", "ba-trieu")).toBeDefined();

		const contacts = contactsByGroup().flatMap((g) => g.items);
		expect(contacts.some((c) => c.sample)).toBe(false);
		expect(contacts.some((c) => c.phone === "113")).toBe(true);

		const now = new Date("2026-11-20T03:00:00Z");
		const ids = upcomingEvents(now).map((o) => o.event.id);
		expect(ids).not.toContain("hop-mat-dong-huong-2026");
		expect(ids.length).toBeGreaterThan(0);

		expect(publicVillages().map((v) => v.id)).toEqual(["phu-dien"]);
		expect(getPublicVillage("phu-dien")).toBeDefined();
		const placeholder = fileContent().villages.find((v) => v.sample);
		expect(getPublicVillage(placeholder?.id ?? "")).toBeUndefined();
	});

	it("drops sample items from search (the index is rebuilt on toggle)", () => {
		expect(
			search("vi", "nem chua gia truyen").some(
				(h) => h.doc.kind === "business",
			),
		).toBe(true);
		expect(
			search("vi", "dong huong ha noi").some((h) => h.doc.kind === "event"),
		).toBe(true);
		withSite({ hideSamples: true });
		expect(
			search("vi", "nem chua gia truyen").some(
				(h) => h.doc.kind === "business",
			),
		).toBe(false);
		expect(
			search("vi", "dong huong ha noi").some((h) => h.doc.kind === "event"),
		).toBe(false);
		expect(
			search("vi", "nghe nhan mau").some((h) => h.doc.kind === "person"),
		).toBe(false);
		expect(search("vi", "ba trieu").length).toBeGreaterThan(0);
	});

	it("keeps village pages free of hidden people and events", () => {
		withSite({ hideSamples: true });
		const links = villageLinks("phu-dien", "vi");
		expect(links.people.every((p) => !p.sample)).toBe(true);
		expect(links.events.every((e) => !e.sample)).toBe(true);
	});
});

describe("launch checklist", () => {
	it("is not ready with the starter content", () => {
		const checks = launchChecklist(SETUP);
		expect(isLaunchReady(checks)).toBe(false);
		expect(check("hideSamples").ok).toBe(false);
		expect(check("email").ok).toBe(false); // lienhe@trieuloc.example
		expect(check("facebook").ok).toBe(false);
		// Lists the remaining samples per collection.
		const businesses = check("samples-businesses");
		expect(businesses.items).toHaveLength(4);
		expect(businesses.fix).toBe("businesses");
		expect(check("samples-villages").items).toHaveLength(16);
		expect(check("samples-people").items).toEqual(
			expect.arrayContaining(["Nghệ nhân mẫu"]),
		);
		// Places with approximate coordinates and "(Nội dung mẫu.)" text.
		expect(check("coords").items?.length).toBeGreaterThan(0);
		expect(check("placeholderText").items?.length).toBeGreaterThan(0);
	});

	it("is ready once samples are hidden and a real email is set", () => {
		withSite({
			hideSamples: true,
			contact: { ...site.contact, email: "ubnd@trieuloc.vn" },
		});
		const checks = launchChecklist(SETUP);
		expect(check("hideSamples").ok).toBe(true);
		expect(check("hideSamples").detail).toMatch(/đã bị ẩn/);
		expect(check("email").ok).toBe(true);
		expect(isLaunchReady(checks)).toBe(true);
		// Recommended items can still be open.
		expect(checks.some((c) => !c.ok && c.level === "recommended")).toBe(true);
	});

	it("needs a database and a personal owner account", () => {
		withSite({
			hideSamples: true,
			contact: { ...site.contact, email: "ubnd@trieuloc.vn" },
		});
		const noDb = { ...SETUP, db: false, accounts: false };
		expect(check("db", noDb).ok).toBe(false);
		expect(check("accounts", noDb).ok).toBe(false);
		expect(check("imported", noDb).ok).toBe(false);
		expect(isLaunchReady(launchChecklist(noDb))).toBe(false);
	});

	it("flags the default vercel.app address and missing imports", () => {
		const setup = {
			...SETUP,
			siteUrl: "https://trieu-loc.vercel.app",
			missingCollections: ["gallery" as const],
		};
		expect(check("siteUrl", setup).ok).toBe(false);
		expect(check("siteUrl").ok).toBe(true);
		expect(check("imported", setup).items).toEqual(["gallery"]);
		expect(check("imported", setup).fix).toBe("gallery");
	});
});
