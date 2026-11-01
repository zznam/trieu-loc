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

	async function db<T>(fn: (sql: import("postgres").Sql) => Promise<T>) {
		const { default: postgres } = await import("postgres");
		const sql = postgres(process.env.DATABASE_URL as string, { max: 1 });
		try {
			return await fn(sql);
		} finally {
			await sql.end();
		}
	}

	// Each test starts from the files; other specs expect the original file content too.
	test.beforeEach(() => db((sql) => sql`TRUNCATE content_items`));
	test.afterAll(() => db((sql) => sql`TRUNCATE content_items`));

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

	test("an earlier partial import is completed without touching edited collections", async ({
		page,
	}) => {
		// State of a site imported before this release: places only, no marker rows.
		await db(
			(sql) =>
				sql`INSERT INTO content_items (collection, id, data) VALUES ('places', 'legacy-place', ${sql.json(
					{
						id: "legacy-place",
						category: "relic",
						name: { vi: "Địa danh cũ", en: "Old place" },
						village: { vi: "Thôn", en: "Village" },
						coords: [19.94, 105.82],
						approx: true,
						body: { vi: "x", en: "x" },
					},
				)})`,
		);
		await login(page, "/admin?section=content&collection=places");
		await expect(
			page.getByText("Một số loại nội dung vẫn đang lấy từ file."),
		).toBeVisible();
		await expect(
			page.getByText(/Chưa nhập: .*Đặc sản.*Thông tin chung.*Lịch sử/),
		).toBeVisible();
		page.once("dialog", (d) => d.accept());
		await page
			.getByRole("button", { name: "Nhập phần còn thiếu từ file" })
			.click();
		await expect(page.getByRole("status")).toContainText(/Đã nhập \d+ mục/);
		await expect(page.getByText("Một số loại nội dung")).toHaveCount(0);
		// Places were left exactly as they were
		await expect(page.locator("main li")).toHaveCount(1);
		await expect(page.locator("main li")).toContainText("Địa danh cũ");
	});

	test("site texts, history timeline and contacts are editable", async ({
		page,
	}) => {
		await login(page, "/admin?section=content&collection=site");
		page.once("dialog", (d) => d.accept());
		await page.getByRole("button", { name: "Nhập nội dung từ file" }).click();
		await expect(page.getByRole("status")).toContainText(/Đã nhập/);

		// Singleton: one row, no add / delete
		await expect(
			page.getByRole("button", { name: "＋ Thêm mới" }),
		).toBeHidden();
		await page.getByRole("button", { name: "✎ Sửa" }).click();
		await page
			.getByRole("textbox", { name: "Diện tích (trang chủ)" })
			.fill("30,00 km²");
		await page.getByRole("button", { name: "Lưu", exact: true }).click();
		await expect(page.getByRole("status")).toContainText("Đã lưu");
		await page.goto("/vi");
		await expect(page.locator("dl")).toContainText("30,00 km²");

		// History: add a timeline entry with the list editor
		await page.goto("/admin?section=content&collection=history");
		await page.getByRole("button", { name: "✎ Sửa" }).click();
		await page.getByRole("button", { name: "＋ Thêm mốc" }).click();
		const last = page
			.locator("fieldset", { hasText: "Dòng thời gian" })
			.locator("> div")
			.last();
		await last
			.getByRole("textbox", { name: "Năm / thời kỳ (vi)" })
			.fill("2030");
		await last
			.getByRole("textbox", { name: "Năm / thời kỳ (en)" })
			.fill("2030");
		await last
			.getByRole("textbox", { name: "Tiêu đề (vi)" })
			.fill("Mốc thử nghiệm");
		await last
			.getByRole("textbox", { name: "Tiêu đề (en)" })
			.fill("Test milestone");
		await last.getByRole("textbox", { name: "Nội dung (vi)" }).fill("Nội dung");
		await last.getByRole("textbox", { name: "Nội dung (en)" }).fill("Body");
		await page.getByRole("button", { name: "Lưu", exact: true }).click();
		await expect(page.getByRole("status")).toContainText("Đã lưu");
		await page.goto("/en/history");
		await expect(page.getByText("Test milestone")).toBeVisible();

		// Contacts: give the commune office a phone number
		await page.goto("/admin?section=content&collection=contacts");
		await page
			.locator("li", { hasText: "UBND xã Triệu Lộc" })
			.getByRole("button", { name: "✎ Sửa" })
			.click();
		await page
			.getByRole("textbox", {
				name: "Số điện thoại (để trống = đang cập nhật)",
			})
			.fill("0237 000 000");
		await page.getByRole("button", { name: "Lưu", exact: true }).click();
		await expect(page.getByRole("status")).toContainText("Đã lưu");
		await page.goto("/vi/info");
		await expect(page.locator('a[href="tel:0237000000"]')).toBeVisible();
	});
});
