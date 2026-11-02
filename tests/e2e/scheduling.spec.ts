import { expect, type Page, test } from "@playwright/test";

const ADMIN = process.env.ADMIN_PASSWORD ?? "e2e-admin-password";

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

test.describe("scheduled publishing", () => {
	test.skip(!process.env.DATABASE_URL, "needs DATABASE_URL");
	test.describe.configure({ mode: "serial" });
	test.afterAll(() =>
		db((sql) => sql`TRUNCATE content_items, contributions RESTART IDENTITY`),
	);

	test("a news post scheduled for later is hidden until its time", async ({
		page,
	}) => {
		await db((sql) => sql`TRUNCATE content_items`);
		await login(page, "/admin?section=content&collection=news");
		page.once("dialog", (d) => d.accept());
		await page.getByRole("button", { name: "Nhập nội dung từ file" }).click();
		await expect(page.getByRole("status")).toContainText(/Đã nhập/);

		await page.getByRole("button", { name: "＋ Thêm mới" }).click();
		await page
			.getByRole("textbox", { name: "Đường dẫn (slug)" })
			.fill("2030-01-01-tin-hen-gio");
		await page
			.getByRole("textbox", { name: "Ngày đăng (YYYY-MM-DD)" })
			.fill("2030-01-01");
		await page
			.getByLabel("Lên lịch đăng (giờ Việt Nam)")
			.fill("2030-01-01T08:00");
		await expect(page.getByText("⏰ chưa hiển thị")).toBeVisible();
		await page
			.getByRole("textbox", { name: "Tiêu đề" })
			.fill("Tin hẹn giờ năm 2030");
		await page
			.getByRole("textbox", { name: "Nội dung (Markdown)" })
			.fill("Sẽ hiện vào năm 2030.");
		await page.getByRole("button", { name: "Lưu", exact: true }).click();
		await expect(page.getByRole("status")).toContainText("Đã lưu");
		await expect(
			page.locator("li", { hasText: "2030-01-01-tin-hen-gio" }),
		).toContainText("⏰ lên lịch");

		// Hidden everywhere
		await page.goto("/vi/news");
		await expect(page.getByText("Tin hẹn giờ năm 2030")).toHaveCount(0);
		expect(
			(await page.request.get("/vi/news/2030-01-01-tin-hen-gio")).status(),
		).toBe(404);
		expect(await (await page.request.get("/sitemap.xml")).text()).not.toContain(
			"2030-01-01-tin-hen-gio",
		);
		await page.goto("/vi/search?q=tin%20hen%20gio");
		await expect(page.getByText("Không tìm thấy kết quả")).toBeVisible();

		// Move the time into the past → it appears
		await page.goto("/admin?section=content&collection=news", {
			waitUntil: "networkidle",
		});
		await page
			.locator("li", { hasText: "2030-01-01-tin-hen-gio" })
			.getByRole("button", { name: "✎ Sửa" })
			.click();
		await page
			.getByLabel("Lên lịch đăng (giờ Việt Nam)")
			.fill("2020-01-01T08:00");
		await page.getByRole("button", { name: "Lưu", exact: true }).click();
		await expect(page.getByRole("status")).toContainText("Đã lưu");
		expect(
			(await page.request.get("/vi/news/2030-01-01-tin-hen-gio")).status(),
		).toBe(200);
	});

	test("a community story can be scheduled and unscheduled", async ({
		page,
	}) => {
		const [{ id }] = await db(
			(
				sql,
			) => sql`INSERT INTO contributions (kind, name, title, message, consent, status)
				VALUES ('story', 'Bà Năm', 'Chuyện hẹn giờ', 'Kể chuyện xưa.', true, 'pending') RETURNING id`,
		);
		await login(page, "/admin");
		const card = page.locator("main > ul > li", { hasText: "Chuyện hẹn giờ" });
		await card
			.getByLabel("Đăng lúc (giờ Việt Nam) — để trống để đăng ngay")
			.fill("2031-06-01T09:30");
		await card.getByRole("button", { name: "⏰ Lên lịch đăng" }).click();

		await page.goto("/admin?status=approved", { waitUntil: "networkidle" });
		const scheduled = page.locator("main > ul > li", {
			hasText: "Chuyện hẹn giờ",
		});
		await expect(scheduled).toContainText("⏰ Lên lịch: 09:30 1/6/2031");
		expect((await page.request.get(`/vi/news/cong-dong-${id}`)).status()).toBe(
			404,
		);
		await page.goto("/vi/news");
		await expect(page.getByText("Chuyện hẹn giờ")).toHaveCount(0);

		// Cancel the schedule, then publish now
		await page.goto("/admin?status=approved", { waitUntil: "networkidle" });
		await page
			.locator("main > ul > li", { hasText: "Chuyện hẹn giờ" })
			.getByRole("button", { name: "⤓ Huỷ lịch đăng" })
			.click();
		await expect(
			page
				.locator("main > ul > li", { hasText: "Chuyện hẹn giờ" })
				.getByRole("button", { name: "⤒ Đăng lên trang" }),
		).toBeVisible();
		await page
			.locator("main > ul > li", { hasText: "Chuyện hẹn giờ" })
			.getByRole("button", { name: "⤒ Đăng lên trang" })
			.click();
		await expect(
			page.locator("main > ul > li", { hasText: "Chuyện hẹn giờ" }),
		).toContainText("● Đang hiển thị");
		expect((await page.request.get(`/vi/news/cong-dong-${id}`)).status()).toBe(
			200,
		);
	});
});
