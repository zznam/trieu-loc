import { expect, test } from "@playwright/test";

test("mobile layout has no horizontal scroll and the menu opens", async ({
	page,
}) => {
	for (const path of ["/vi", "/vi/events", "/en/places", "/vi/search?q=tet"]) {
		await page.goto(path);
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - window.innerWidth,
		);
		expect(overflow, path).toBeLessThanOrEqual(0);
	}
	await page.goto("/vi");
	await page.getByRole("button", { name: /Menu/ }).click();
	await expect(page.locator("#mobile-nav")).toBeVisible();
	await page
		.locator("#mobile-nav")
		.getByRole("link", { name: "Sự kiện" })
		.click();
	await expect(page).toHaveURL(/\/vi\/events$/);
});
