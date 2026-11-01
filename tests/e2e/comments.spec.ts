import { expect, test } from "@playwright/test";

const ADMIN = process.env.ADMIN_PASSWORD ?? "e2e-admin-password";

test.describe("comments and reactions", () => {
	test.skip(!process.env.DATABASE_URL, "needs DATABASE_URL");

	test("a comment is moderated before it appears on the page", async ({
		page,
	}) => {
		await page.goto("/vi/people/ba-trieu");
		await expect(
			page.getByRole("heading", { name: "Bình luận" }),
		).toBeVisible();
		await expect(page.getByText("Chưa có bình luận nào.")).toBeVisible();
		await page.fill("#comment-name", "Ông Bảy");
		await page.fill("#comment-message", "Mỗi năm tôi đều đi lễ đền Bà.");
		await page.waitForTimeout(3200);
		await page.getByRole("button", { name: "Gửi" }).click();
		await expect(page.getByText("Cảm ơn bạn đã gửi lời nhắn!")).toBeVisible();

		await page.goto("/admin?section=comment");
		await page.fill("input[name=password]", ADMIN);
		await page.getByRole("button", { name: "Đăng nhập" }).click();
		const card = page.locator("main li", { hasText: "Mỗi năm tôi đều đi lễ" });
		await expect(
			card.getByRole("link", { name: /people:ba-trieu/ }),
		).toHaveAttribute("href", "/vi/people/ba-trieu");
		await card.getByRole("button", { name: "✓ Duyệt & hiển thị" }).click();
		await expect(
			page.locator("main li", { hasText: "Mỗi năm tôi đều đi lễ" }),
		).toHaveCount(0);

		await page.goto("/vi/people/ba-trieu");
		await expect(page.locator("#comments-title")).toContainText("(1)");
		await expect(
			page.locator("section[aria-labelledby=comments-title] li"),
		).toContainText("Ông Bảy");
		// Only on this page
		await page.goto("/vi/villages/phu-dien");
		await expect(page.getByText("Chưa có bình luận nào.")).toBeVisible();
	});

	test("the heart toggles and is remembered per visitor", async ({ page }) => {
		await page.goto("/vi/news/2026-11-01-ra-mat-trang-web");
		const heart = page.getByRole("button", { name: /Thả tim|Bỏ tim/ });
		await expect(heart).toHaveAttribute("aria-pressed", "false");
		await expect(heart).toContainText("0");
		await heart.click();
		await expect(heart).toHaveAttribute("aria-pressed", "true");
		await expect(heart).toContainText("1");
		await page.reload();
		await expect(page.getByRole("button", { name: /Bỏ tim/ })).toContainText(
			"1",
		);
		await page.getByRole("button", { name: /Bỏ tim/ }).click();
		await expect(page.getByRole("button", { name: /Thả tim/ })).toContainText(
			"0",
		);
	});
});
