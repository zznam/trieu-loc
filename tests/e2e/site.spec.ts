import { expect, test } from "@playwright/test";

test.describe("public site", () => {
	test("home redirects to Vietnamese and switches language on the same page", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page).toHaveURL(/\/vi$/);
		await expect(page.getByRole("heading", { level: 1 })).toContainText(
			"Quê hương Bà Triệu",
		);
		await page.goto("/vi/history");
		await page.getByRole("link", { name: "English" }).click();
		await expect(page).toHaveURL(/\/en\/history$/);
		await expect(page.locator("html")).toHaveAttribute("lang", "en");
	});

	test("dark mode toggle persists across reloads", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "light" });
		await page.goto("/vi");
		await page
			.getByRole("button", { name: "Chuyển sang giao diện tối" })
			.click();
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await page.reload();
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	});

	test("every main page renders without errors", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (e) => errors.push(e.message));
		for (const path of [
			"/vi",
			"/vi/history",
			"/vi/places",
			"/vi/food",
			"/vi/people",
			"/vi/events",
			"/vi/news",
			"/vi/gallery",
			"/vi/villages",
			"/vi/villages/phu-dien",
			"/vi/info",
			"/vi/contribute",
			"/en/people/ba-trieu",
		]) {
			const res = await page.goto(path);
			expect(res?.status(), path).toBe(200);
			await expect(page.locator("h1").first(), path).toBeVisible();
		}
		expect(errors).toEqual([]);
	});

	test("unknown pages return 404", async ({ page }) => {
		expect((await page.goto("/fr"))?.status()).toBe(404);
		expect((await page.goto("/vi/news/khong-ton-tai"))?.status()).toBe(404);
		expect((await page.goto("/vi/villages/nope"))?.status()).toBe(404);
	});

	test("search is accent-insensitive and deep-links to the result", async ({
		page,
	}) => {
		await page.goto("/vi", { waitUntil: "networkidle" }); // shortcut listens after hydration
		await page.keyboard.press("Control+k");
		await expect(page).toHaveURL(/\/vi\/search$/);
		await page.locator("#q").fill("den ba trieu");
		await expect(page).toHaveURL(/q=den\+ba\+trieu/);
		await page
			.getByRole("link", { name: /Đền Bà Triệu/ })
			.first()
			.click();
		await expect(page).toHaveURL(/\/vi\/places#den-ba-trieu$/);
	});

	test("the festival countdown shows the next festival", async ({ page }) => {
		await page.goto("/vi");
		const band = page.locator("section.bg-rice-700");
		await expect(band).toContainText("Lễ hội đền Bà Triệu");
		await expect(
			band.getByText(/Ngày|Lễ hội đang diễn ra/).first(),
		).toBeVisible();
	});

	test("sitemap and robots are served", async ({ request }) => {
		const sitemap = await request.get("/sitemap.xml");
		expect(sitemap.headers()["content-type"]).toContain("application/xml");
		const xml = await sitemap.text();
		expect(xml).toContain("/vi/history</loc>");
		expect(xml).toContain('hreflang="en"');
		const robots = await (await request.get("/robots.txt")).text();
		expect(robots).toContain("Disallow: /admin");
	});
});
