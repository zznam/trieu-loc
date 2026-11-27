import { expect, type Page, test } from "@playwright/test";

const ADMIN = process.env.ADMIN_PASSWORD ?? "e2e-admin-password";

async function login(page: Page, url: string) {
	await page.goto(url, { waitUntil: "networkidle" });
	await page.fill("input[name=password]", ADMIN);
	await page.getByRole("button", { name: "Đăng nhập" }).click();
	await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
}

test.describe("launch readiness", () => {
	test.skip(!process.env.DATABASE_URL, "needs DATABASE_URL");

	async function db<T>(fn: (sql: import("postgres").Sql) => Promise<T>) {
		const { default: postgres } = await import("postgres");
		const sql = postgres(process.env.DATABASE_URL as string, { max: 1 });
		try {
			return await fn(sql);
		} finally {
			await sql.end();
		}
	}

	// Other specs expect the original file content (samples visible).
	test.beforeEach(() => db((sql) => sql`TRUNCATE content_items`));
	test.afterAll(() => db((sql) => sql`TRUNCATE content_items`));

	test("checklist, then hiding sample content from the public site", async ({
		page,
		request,
	}) => {
		// Starter content: samples are public, with a "sample" note
		await page.goto("/vi/food");
		await expect(page.getByText("Nem chua gia truyền (mẫu)")).toBeVisible();
		expect((await request.get("/vi/people/mau-xa-que")).status()).toBe(200);

		await login(page, "/admin?section=launch");
		await expect(page.getByTestId("launch-summary")).toContainText(
			"Chưa sẵn sàng ra mắt",
		);
		const hide = page.getByTestId("launch-check-hideSamples");
		await expect(hide).toHaveAttribute("data-ok", "false");
		await expect(hide).toContainText(/\d+ mục mẫu đang hiện trên trang/);
		await expect(page.getByTestId("launch-check-email")).toHaveAttribute(
			"data-ok",
			"false",
		);
		await expect(
			page.getByTestId("launch-check-samples-businesses"),
		).toContainText("Nem chua gia truyền (mẫu)");
		// Bootstrap sign-in: the owner account is still missing
		await expect(page.getByTestId("launch-check-accounts")).toHaveAttribute(
			"data-ok",
			"false",
		);

		// "Sửa trong Nội dung" on the switch opens the site settings
		await hide.getByRole("link", { name: /Sửa trong Nội dung/ }).click();
		await expect(page).toHaveURL(/collection=site/);
		await page.waitForLoadState("networkidle");
		page.once("dialog", (d) => d.accept());
		await page.getByRole("button", { name: "Nhập nội dung từ file" }).click();
		await expect(page.getByRole("status")).toContainText(/Đã nhập/);
		await page.getByRole("button", { name: "✎ Sửa" }).click();
		await page.getByRole("checkbox", { name: /Ẩn mọi nội dung mẫu/ }).check();
		await page
			.getByRole("textbox", { name: "Email liên hệ" })
			.fill("ubnd@trieuloc.vn");
		await page.getByRole("button", { name: "Lưu", exact: true }).click();
		await expect(page.getByRole("status")).toContainText("Đã lưu");

		// Samples are gone from pages, search, the sitemap and comment targets
		await page.goto("/vi/food");
		await expect(page.getByText("Nem chua gia truyền (mẫu)")).toHaveCount(0);
		await expect(page.getByText("Thông tin mẫu", { exact: false })).toHaveCount(
			0,
		);
		expect((await request.get("/vi/people/mau-xa-que")).status()).toBe(404);
		expect((await request.get("/vi/people/ba-trieu")).status()).toBe(200);

		await page.goto("/vi/people");
		await expect(page.getByText("Nghệ nhân mẫu")).toHaveCount(0);
		await expect(page.getByText("Bà Triệu").first()).toBeVisible();

		await page.goto("/vi/villages");
		await expect(page.locator("main ul > li")).toHaveCount(1);
		await expect(page.getByText("Phú Điền").first()).toBeVisible();

		await page.goto("/vi/search?q=nem%20chua%20gia%20truyen");
		await expect(page.getByText("Nem chua gia truyền (mẫu)")).toHaveCount(0);

		const sitemap = await (await request.get("/sitemap.xml")).text();
		expect(sitemap).toContain("/people/ba-trieu");
		expect(sitemap).not.toContain("/people/mau-xa-que");

		await expect(page.locator("footer")).toContainText("ubnd@trieuloc.vn");

		// The checklist picks up the change
		await page.goto("/admin?section=launch", { waitUntil: "networkidle" });
		await expect(page.getByTestId("launch-check-hideSamples")).toHaveAttribute(
			"data-ok",
			"true",
		);
		await expect(page.getByTestId("launch-check-hideSamples")).toContainText(
			"đã bị ẩn khỏi trang công khai",
		);
		await expect(page.getByTestId("launch-check-email")).toHaveAttribute(
			"data-ok",
			"true",
		);
	});
});
