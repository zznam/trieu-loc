import { expect, type Page, test } from "@playwright/test";

const ADMIN = process.env.ADMIN_PASSWORD ?? "e2e-admin-password";

async function login(page: Page, url: string) {
	await page.goto(url);
	await page.fill("input[name=password]", ADMIN);
	await page.getByRole("button", { name: "Đăng nhập" }).click();
	await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
}

test.describe("content editor", () => {
	test.skip(!process.env.DATABASE_URL, "needs DATABASE_URL");

	// Other specs expect the original file content, so empty the content table afterwards.
	test.afterAll(async () => {
		const { default: postgres } = await import("postgres");
		const sql = postgres(process.env.DATABASE_URL as string, { max: 1 });
		await sql`TRUNCATE content_items`;
		await sql.end();
	});

	test("import, edit a place, publish and delete a news post", async ({
		page,
	}) => {
		await login(page, "/admin?section=content&collection=places");

		// Before import: file content is listed but read-only
		await expect(
			page.getByText("Nội dung vẫn đang lấy từ các file"),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "＋ Thêm mới" }),
		).toBeDisabled();
		page.once("dialog", (d) => d.accept());
		await page.getByRole("button", { name: "Nhập nội dung từ file" }).click();
		await expect(page.getByRole("status")).toContainText(/Đã nhập \d+ mục/);

		// Edit a place
		const row = page.locator("li", { hasText: "song-len" });
		await row.getByRole("button", { name: "✎ Sửa" }).click();
		await page.getByRole("textbox", { name: "Tên (vi)" }).fill("Dòng sông Lèn");
		await page.getByRole("button", { name: "Lưu", exact: true }).click();
		await expect(page.getByRole("status")).toContainText("Đã lưu");

		await page.goto("/vi/places");
		await expect(
			page.getByRole("heading", { name: "Dòng sông Lèn" }),
		).toBeVisible();

		// Validation errors are shown
		await page.goto("/admin?section=content&collection=news");
		await page.getByRole("button", { name: "＋ Thêm mới" }).click();
		await page
			.getByRole("textbox", { name: "Đường dẫn (slug)" })
			.fill("Không Hợp Lệ");
		await page.getByRole("button", { name: "Lưu", exact: true }).click();
		await expect(page.getByRole("alert")).toContainText(
			"Thông tin chưa hợp lệ",
		);

		// Create a news post with Markdown and an English version
		await page
			.getByRole("textbox", { name: "Đường dẫn (slug)" })
			.fill("2026-12-01-hoi-thi-nau-com");
		await page
			.getByRole("textbox", { name: "Ngày đăng (YYYY-MM-DD)" })
			.fill("2026-12-01");
		await page
			.getByRole("textbox", { name: "Tiêu đề" })
			.fill("Hội thi nấu cơm niêu");
		await page
			.getByRole("textbox", { name: "Tóm tắt" })
			.fill("Thôn Phú Điền tổ chức hội thi.");
		await page
			.getByRole("textbox", { name: "Nội dung (Markdown)" })
			.fill("Có **12 đội** tham gia.\n\n- Giải nhất\n- Giải nhì");
		await page.getByRole("button", { name: "＋ Thêm bản tiếng Anh" }).click();
		await page
			.getByRole("textbox", { name: "Tiêu đề" })
			.nth(1)
			.fill("Clay-pot rice contest");
		await page.getByRole("button", { name: "Lưu", exact: true }).click();
		await expect(page.getByRole("status")).toContainText("Đã lưu");

		await page.goto("/vi/news");
		await page
			.getByRole("link", { name: "Hội thi nấu cơm niêu" })
			.first()
			.click();
		await expect(page.locator("article strong")).toHaveText("12 đội");
		await expect(page.locator("article li")).toHaveCount(2);
		await page.goto("/en/news/2026-12-01-hoi-thi-nau-com");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			"Clay-pot rice contest",
		);

		// It shows up in search and the sitemap
		await page.goto("/vi/search?q=hoi%20thi%20nau%20com");
		await expect(
			page.getByRole("link", { name: /Hội thi nấu cơm niêu/ }),
		).toBeVisible();
		expect(await (await page.request.get("/sitemap.xml")).text()).toContain(
			"/vi/news/2026-12-01-hoi-thi-nau-com",
		);

		// Delete it
		await page.goto("/admin?section=content&collection=news");
		page.once("dialog", (d) => d.accept());
		await page
			.locator("li", { hasText: "2026-12-01-hoi-thi-nau-com" })
			.getByRole("button", { name: "Xoá" })
			.click();
		await expect(page.getByRole("status")).toContainText("Đã xoá");
		expect(
			(await page.request.get("/vi/news/2026-12-01-hoi-thi-nau-com")).status(),
		).toBe(404);
	});
});
