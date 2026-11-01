import { expect, test } from "@playwright/test";

const ADMIN = process.env.ADMIN_PASSWORD ?? "e2e-admin-password";

test.describe("guestbook", () => {
	test.skip(!process.env.DATABASE_URL, "needs DATABASE_URL");

	test("a message appears only after an editor approves it", async ({
		page,
	}) => {
		await page.goto("/vi/guestbook");
		await page.fill("#guestbook-name", "Chị Lan");
		await page.fill("#guestbook-place", "Đức");
		await page.fill("#guestbook-message", "Nhớ quê lắm, Tết này con về!");
		await page.waitForTimeout(3200);
		await page.getByRole("button", { name: "Gửi" }).click();
		await expect(page.getByText("Cảm ơn bạn đã gửi lời nhắn!")).toBeVisible();

		await page.reload();
		await expect(page.getByText("Nhớ quê lắm")).toHaveCount(0); // still pending

		await page.goto("/admin?section=guestbook");
		await page.fill("input[name=password]", ADMIN);
		await page.getByRole("button", { name: "Đăng nhập" }).click();
		const card = page.locator("main li", { hasText: "Nhớ quê lắm" });
		await expect(card).toBeVisible();
		await card.getByRole("button", { name: "✓ Duyệt & hiển thị" }).click();
		await expect(
			page.locator("main li", { hasText: "Nhớ quê lắm" }),
		).toHaveCount(0);

		await page.goto("/vi/guestbook");
		const entry = page.locator("main li", { hasText: "Nhớ quê lắm" });
		await expect(entry).toContainText("Chị Lan");
		await expect(entry).toContainText("Đức");
	});

	test("messages full of links are refused", async ({ page }) => {
		await page.goto("/en/guestbook");
		await page.fill("#guestbook-name", "Spammer");
		await page.fill(
			"#guestbook-message",
			"http://a.example http://b.example http://c.example",
		);
		await page.waitForTimeout(3200);
		await page.getByRole("button", { name: "Send" }).click();
		await expect(page.getByRole("alert")).toContainText("Too many links");
	});
});
