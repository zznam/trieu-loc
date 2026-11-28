import { expect, type Page, test } from "@playwright/test";

const ADMIN = process.env.ADMIN_PASSWORD ?? "e2e-admin-password";

const ldTypes = async (page: Page) =>
	(
		await page.locator('script[type="application/ld+json"]').allTextContents()
	).flatMap((t) => {
		const v = JSON.parse(t);
		return (Array.isArray(v) ? v : [v]).map((x) => x["@type"] as string);
	});

test.describe("visitor-facing basics", () => {
	test("visitor guide and privacy pages are linked and listed", async ({
		page,
		request,
	}) => {
		await page.goto("/vi");
		await page
			.locator("footer")
			.getByRole("link", { name: "Cẩm nang du khách" })
			.click();
		await expect(
			page.getByRole("heading", { level: 1, name: "Cẩm nang du khách" }),
		).toBeVisible();
		await expect(page.locator("#temple")).toContainText("Ăn mặc kín đáo");

		await page
			.locator("footer")
			.getByRole("link", { name: "Quyền riêng tư" })
			.click();
		await expect(page).toHaveURL(/\/vi\/privacy$/);
		await expect(page.locator("#guidelines")).toContainText("Không quảng cáo");
		await page.goto("/en/visit");
		await expect(
			page.getByRole("heading", { level: 2, name: /Visiting the temple/ }),
		).toBeVisible();

		const sitemap = await (await request.get("/sitemap.xml")).text();
		expect(sitemap).toContain("/vi/visit");
		expect(sitemap).toContain("/en/privacy");
	});

	test("security headers and the health check", async ({ request }) => {
		const res = await request.get("/vi");
		expect(res.headers()["x-content-type-options"]).toBe("nosniff");
		expect(res.headers()["referrer-policy"]).toBe(
			"strict-origin-when-cross-origin",
		);
		expect(res.headers()["x-frame-options"]).toBe("SAMEORIGIN");

		const health = await request.get("/api/health");
		expect(health.status()).toBe(200);
		expect(health.headers()["cache-control"]).toBe("no-store");
		const body = await health.json();
		expect(body.ok).toBe(true);
		expect(body.db).toBe(process.env.DATABASE_URL ? "ok" : "unconfigured");
	});

	test("404 offers a search box that works", async ({ page }) => {
		await page.goto("/vi/khong-co-trang-nay");
		await expect(page.getByText("404")).toBeVisible();
		await page
			.getByRole("searchbox", { name: "Tìm trên trang…" })
			.fill("nem chua");
		await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
		await expect(page).toHaveURL(/\/vi\/search\?q=nem/);
		await expect(page.getByText("Nem chua").first()).toBeVisible();
	});

	test("skip link, text size and back to top", async ({ page }) => {
		await page.goto("/vi/history", { waitUntil: "networkidle" });
		await page.keyboard.press("Tab");
		const skip = page.getByRole("link", { name: "Bỏ qua, tới nội dung chính" });
		await expect(skip).toBeFocused();
		await page.keyboard.press("Enter");
		await expect(page.locator("#main")).toBeFocused();

		const toggle = page.getByRole("button", { name: /^Cỡ chữ/ });
		await toggle.click();
		await expect(page.locator("html")).toHaveAttribute("data-text-size", "lg");
		await page.reload({ waitUntil: "networkidle" });
		await expect(page.locator("html")).toHaveAttribute("data-text-size", "lg");
		await page.getByRole("button", { name: /^Cỡ chữ/ }).click();
		await expect(page.locator("html")).toHaveAttribute("data-text-size", "xl");
		await page.getByRole("button", { name: /^Cỡ chữ/ }).click();
		await expect(page.locator("html")).not.toHaveAttribute("data-text-size");

		await expect(
			page.getByRole("button", { name: "Lên đầu trang" }),
		).toHaveCount(0);
		await page.mouse.wheel(0, 4000);
		const top = page.getByRole("button", { name: "Lên đầu trang" });
		await expect(top).toBeVisible();
		await top.click();
		await expect
			.poll(() => page.evaluate(() => window.scrollY))
			.toBeLessThan(50);
	});

	test("breadcrumbs and structured data", async ({ page }) => {
		await page.goto("/vi");
		expect(await ldTypes(page)).toEqual(
			expect.arrayContaining(["WebSite", "Place"]),
		);

		await page.goto("/vi/people/ba-trieu");
		const crumbs = page.getByRole("navigation", { name: "Bạn đang ở" });
		await expect(
			crumbs.getByRole("link", { name: "Con người" }),
		).toHaveAttribute("href", "/vi/people");
		await expect(crumbs.locator('[aria-current="page"]')).toContainText(
			"Bà Triệu",
		);
		expect(await ldTypes(page)).toEqual(
			expect.arrayContaining(["BreadcrumbList", "Person"]),
		);

		await page.goto("/en/news/2026-11-01-ra-mat-trang-web");
		expect(await ldTypes(page)).toContain("NewsArticle");
		await page.goto("/vi/events");
		expect(await ldTypes(page)).toContain("Event");
	});

	test("directions and suggest-an-edit on places", async ({ page }) => {
		await page.goto("/vi/places", { waitUntil: "networkidle" });
		const card = page.locator("article#den-ba-trieu");
		await expect(card.getByRole("link", { name: /Chỉ đường/ })).toHaveAttribute(
			"href",
			/google\.com\/maps\/dir\/\?api=1&destination=/,
		);
		await card.getByRole("link", { name: /Góp ý sửa thông tin/ }).click();
		await expect(page).toHaveURL(/\/vi\/contribute\?.*kind=correction/);
		await expect(page.locator("#title")).toHaveValue(/^Góp ý về: Đền/);
		await expect(
			page.locator('input[name=kind][value="correction"]'),
		).toBeChecked();
		// Forms remind people of the rules
		await expect(
			page.getByRole("link", { name: "Nội quy & quyền riêng tư" }),
		).toHaveAttribute("href", "/vi/privacy#guidelines");
	});

	test("people search filters the list", async ({ page }) => {
		await page.goto("/vi/people", { waitUntil: "networkidle" });
		const search = page.getByRole("searchbox", { name: /Tìm theo tên/ });
		await search.fill("trieu");
		await expect(page.getByRole("heading", { name: "Bà Triệu" })).toBeVisible();
		await search.fill("khong ai ten nay");
		await expect(
			page.getByText("Không có ai khớp với tìm kiếm."),
		).toBeVisible();
	});
});

test.describe("admin tools", () => {
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

	async function login(page: Page, url: string) {
		await page.goto(url, { waitUntil: "networkidle" });
		await page.fill("input[name=password]", ADMIN);
		await page.getByRole("button", { name: "Đăng nhập" }).click();
		await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
	}

	test.afterAll(() =>
		db(async (sql) => {
			await sql`DELETE FROM messages WHERE message LIKE 'Hàng loạt %'`;
			await sql`TRUNCATE content_items`;
		}),
	);

	test("pending badges and bulk approval of guestbook messages", async ({
		page,
	}) => {
		await db(
			(sql) =>
				sql`DELETE FROM messages WHERE kind = 'guestbook' AND status = 'pending'`,
		);
		await db(
			(sql) => sql`INSERT INTO messages (kind, name, place, message)
				VALUES ('guestbook', 'Anh Một', 'Huế', 'Hàng loạt một'),
				       ('guestbook', 'Chị Hai', 'Đà Nẵng', 'Hàng loạt hai')`,
		);
		await login(page, "/admin?section=guestbook");
		const tab = page.getByRole("link", { name: /Sổ lưu bút/ });
		await expect(tab).toContainText("2");

		await page.getByRole("checkbox", { name: "Chọn tất cả" }).check();
		await expect(page.getByText("Đã chọn 2")).toBeVisible();
		await page.getByRole("button", { name: "✓ Duyệt 2 mục" }).click();
		await expect(page.getByText("Không có mục nào ở đây.")).toBeVisible();
		await expect(tab).not.toContainText("2");

		await page.goto("/vi/guestbook");
		await expect(page.getByText("Hàng loạt một")).toBeVisible();
		await expect(page.getByText("Hàng loạt hai")).toBeVisible();
	});

	test("CSV downloads for contributions and subscribers", async ({ page }) => {
		await login(page, "/admin");
		const [contribDl] = await Promise.all([
			page.waitForEvent("download"),
			page.getByRole("button", { name: /Tải tất cả đóng góp/ }).click(),
		]);
		expect(contribDl.suggestedFilename()).toMatch(
			/^dong-gop-\d{4}-\d{2}-\d{2}\.csv$/,
		);
		const text = await (await contribDl.createReadStream())
			.toArray()
			.then((c) => Buffer.concat(c).toString("utf8"));
		expect(text.startsWith('﻿"id","loai"')).toBe(true);

		await page.goto("/admin?section=newsletter", { waitUntil: "networkidle" });
		const [subsDl] = await Promise.all([
			page.waitForEvent("download"),
			page.getByRole("button", { name: /Tải tất cả \(CSV\)/ }).click(),
		]);
		expect(subsDl.suggestedFilename()).toMatch(/^ban-tin-.*\.csv$/);
	});

	test("a news draft stays hidden until it is unticked", async ({
		page,
		request,
	}) => {
		await db((sql) => sql`TRUNCATE content_items`);
		await login(page, "/admin?section=content&collection=news");
		page.once("dialog", (d) => d.accept());
		await page.getByRole("button", { name: "Nhập nội dung từ file" }).click();
		await expect(page.getByRole("status")).toContainText(/Đã nhập/);

		await page.getByRole("button", { name: "＋ Thêm mới" }).click();
		await page
			.getByRole("textbox", { name: "Đường dẫn (slug)" })
			.fill("2026-11-25-ban-nhap");
		await page
			.getByRole("textbox", { name: "Ngày đăng (YYYY-MM-DD)" })
			.fill("2026-11-25");
		await page.getByRole("checkbox", { name: /Bản nháp/ }).check();
		await page
			.getByRole("textbox", { name: "Tiêu đề" })
			.fill("Tin nháp chưa đăng");
		await page.getByRole("textbox", { name: "Tóm tắt" }).fill("Nháp");
		await page
			.getByRole("textbox", { name: "Nội dung (Markdown)" })
			.fill("Nội dung nháp");
		await page.getByRole("button", { name: "Lưu", exact: true }).click();
		await expect(page.getByRole("status")).toContainText("Đã lưu");
		await expect(
			page.locator("main li", { hasText: "Tin nháp chưa đăng" }),
		).toContainText("📝 nháp");

		await page.goto("/vi/news");
		await expect(page.getByText("Tin nháp chưa đăng")).toHaveCount(0);
		expect((await request.get("/vi/news/2026-11-25-ban-nhap")).status()).toBe(
			404,
		);

		await page.goto("/admin?section=content&collection=news", {
			waitUntil: "networkidle",
		});
		await page
			.locator("main li", { hasText: "Tin nháp chưa đăng" })
			.getByRole("button", { name: "✎ Sửa" })
			.click();
		await page.getByRole("checkbox", { name: /Bản nháp/ }).uncheck();
		await page.getByRole("button", { name: "Lưu", exact: true }).click();
		await expect(page.getByRole("status")).toContainText("Đã lưu");
		await page.goto("/vi/news");
		await expect(page.getByText("Tin nháp chưa đăng")).toBeVisible();
	});
});
