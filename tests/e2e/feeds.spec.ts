import { expect, test } from "@playwright/test";

test.describe("feeds, sharing and tools", () => {
	test("news RSS feed is valid and discoverable", async ({ page, request }) => {
		const res = await request.get("/feeds/news-vi.xml");
		expect(res.status()).toBe(200);
		expect(res.headers()["content-type"]).toContain("application/rss+xml");
		const xml = await res.text();
		expect(xml).toContain('<rss version="2.0"');
		expect(xml).toContain("<item>");

		await page.goto("/en/news");
		await expect(
			page.locator('link[type="application/rss+xml"]'),
		).toHaveAttribute("href", /\/feeds\/news-en\.xml$/);
		await expect(
			page.getByRole("link", { name: /Follow via RSS/ }),
		).toBeVisible();
	});

	test("events iCalendar feed lists events; bad names 404", async ({
		page,
		request,
	}) => {
		const res = await request.get("/feeds/events-vi.ics");
		expect(res.status()).toBe(200);
		expect(res.headers()["content-type"]).toContain("text/calendar");
		const ics = await res.text();
		expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/);
		expect(ics).toContain("BEGIN:VEVENT");
		expect((await request.get("/feeds/events-vi.xml")).status()).toBe(404);
		expect((await request.get("/feeds/news-fr.xml")).status()).toBe(404);

		await page.goto("/en/events");
		await expect(
			page.getByTestId("calendar-subscribe").getByRole("link", {
				name: "Subscribe",
			}),
		).toHaveAttribute("href", /^webcal:.*\/feeds\/events-en\.ics$/);
	});

	test("news article shows reading time, share links and related posts", async ({
		page,
	}) => {
		await page.goto("/vi/news");
		await page.locator("main a[href*='/vi/news/']").first().click();
		await expect(page.getByText(/phút đọc/)).toBeVisible();
		const share = page.getByTestId("share");
		await expect(share.getByRole("link", { name: "Facebook" })).toHaveAttribute(
			"href",
			/facebook\.com\/sharer/,
		);
		await expect(
			page.getByRole("heading", { name: "Bài viết liên quan" }),
		).toBeVisible();
	});

	test("lunar converter converts both ways", async ({ page }) => {
		await page.goto("/en/info");
		const box = page.getByTestId("lunar-converter");
		await box.locator('input[type="date"]').fill("2026-02-17");
		await expect(box.getByTestId("lunar-result")).toContainText(
			"1/1/2026 lunar",
		);
		await box.getByRole("button", { name: "Lunar → Solar" }).click();
		const inputs = box.locator('input[type="number"]');
		await inputs.nth(0).fill("10");
		await inputs.nth(1).fill("3");
		await inputs.nth(2).fill("2027");
		await expect(box.getByTestId("lunar-result")).toHaveText("16 April 2027");
		await box.getByRole("checkbox").check();
		await expect(box).toContainText("no such leap month");
	});
});
