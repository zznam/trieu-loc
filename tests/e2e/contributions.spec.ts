import { expect, type Page, test } from "@playwright/test";

const ADMIN = process.env.ADMIN_PASSWORD ?? "e2e-admin-password";

test.describe("contributions → admin → publish", () => {
	test.skip(!process.env.DATABASE_URL, "needs DATABASE_URL");

	async function submitStory(page: Page, title: string) {
		await page.goto("/vi/contribute?kind=story");
		await page.fill("#name", "Người Thử");
		await page.fill("#village", "Phú Điền");
		await page.fill("#title", title);
		await page.fill(
			"#message",
			"Đoạn một.\n\nĐoạn hai <script>window.__xss = 1</script>",
		);
		await page.check("input[name=consent]");
		await page.waitForTimeout(3200); // the form rejects submissions faster than a human
		await page.getByRole("button", { name: "Gửi" }).click();
		await expect(page.getByText("Cảm ơn bạn!")).toBeVisible();
	}

	test("a story can be submitted, published and shown safely", async ({
		page,
	}) => {
		await submitStory(page, "Câu chuyện E2E");

		await page.goto("/admin");
		await page.fill("input[name=password]", "wrong");
		await page.getByRole("button", { name: "Đăng nhập" }).click();
		await expect(page.getByRole("alert")).toHaveText("Sai mật khẩu.");
		await page.fill("input[name=password]", ADMIN);
		await page.getByRole("button", { name: "Đăng nhập" }).click();
		await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();

		const card = page.locator("main > ul > li", { hasText: "Câu chuyện E2E" });
		await card.getByRole("button", { name: "⤒ Đăng lên trang" }).click();
		await expect(
			page.locator("main > ul > li", { hasText: "Câu chuyện E2E" }),
		).toHaveCount(0); // moved to "approved"

		await page.goto("/vi/news");
		await page.getByRole("link", { name: "Câu chuyện E2E" }).first().click();
		await expect(page.locator("article")).toContainText(
			"<script>window.__xss = 1</script>",
		);
		expect(
			await page.evaluate(
				() => (window as unknown as { __xss?: number }).__xss,
			),
		).toBeUndefined();
	});

	test("the honeypot silently drops bots", async ({ page }) => {
		await page.goto("/vi/contribute");
		await page.fill("#name", "Bot");
		await page.fill("#title", "Spam");
		await page.fill("#message", "spam");
		await page.evaluate(() => {
			(
				document.querySelector("input[name=website]") as HTMLInputElement
			).value = "http://spam";
		});
		await page.waitForTimeout(3200);
		await page.getByRole("button", { name: "Gửi" }).click();
		await expect(page.getByText("Cảm ơn bạn!")).toBeVisible();

		await page.goto("/admin");
		await page.fill("input[name=password]", ADMIN);
		await page.getByRole("button", { name: "Đăng nhập" }).click();
		await expect(
			page.locator("main > ul > li", { hasText: "Spam" }),
		).toHaveCount(0);
	});

	test("admin data is never shown without logging in", async ({ page }) => {
		await page.goto("/admin?status=approved");
		await expect(page.locator("input[name=password]")).toBeVisible();
		await expect(page.locator("body")).not.toContainText("Câu chuyện E2E");
	});
});
