import { describe, expect, it } from "vitest";
import { buildShareLinks } from "../share";

describe("buildShareLinks", () => {
	const url = "https://trieuloc.example/vi/news/le-hoi?x=1&y=2";
	const title = "Lễ hội Đền Bà Triệu & rước kiệu";
	const links = buildShareLinks(url, title);

	it("offers Facebook, Zalo, X and email in that order", () => {
		expect(links.map((l) => l.target)).toEqual([
			"facebook",
			"zalo",
			"x",
			"email",
		]);
	});

	it("encodes the page URL so query strings survive", () => {
		for (const link of links.slice(0, 3)) {
			expect(link.href).toContain(encodeURIComponent(url));
			expect(link.href).not.toContain("&y=2");
		}
	});

	it("encodes Vietnamese titles and ampersands", () => {
		const x = links.find((l) => l.target === "x");
		expect(x?.href).toContain(`text=${encodeURIComponent(title)}`);
		const email = links.find((l) => l.target === "email");
		expect(decodeURIComponent(email?.href.split("body=")[1] ?? "")).toBe(
			`${title}\n\n${url}`,
		);
	});
});
