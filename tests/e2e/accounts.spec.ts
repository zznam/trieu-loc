import { expect, type Page, test } from "@playwright/test";

const SHARED = process.env.ADMIN_PASSWORD ?? "e2e-admin-password";
const OWNER = { email: "owner@example.test", password: "owner-password-1" };
const EDITOR = { email: "editor@example.test", password: "editor-password-1" };

async function db<T>(fn: (sql: import("postgres").Sql) => Promise<T>) {
	const { default: postgres } = await import("postgres");
	const sql = postgres(process.env.DATABASE_URL as string, { max: 1 });
	try {
		return await fn(sql);
	} finally {
		await sql.end();
	}
}

async function signIn(page: Page, email: string, password: string) {
	await page.goto("/admin", { waitUntil: "networkidle" });
	await page.fill("input[name=email]", email);
	await page.fill("input[name=password]", password);
	await page.getByRole("button", { name: "Đăng nhập" }).click();
	// Wait for the outcome before doing anything else (signed in, or an error shown).
	await expect(
		page.getByRole("button", { name: "Đăng xuất" }).or(page.getByRole("alert")),
	).toBeVisible();
}

test.describe("editor accounts", () => {
	test.skip(!process.env.DATABASE_URL, "needs DATABASE_URL");
	test.describe.configure({ mode: "serial" });

	// Other specs sign in with the shared password, which only works while there are no accounts.
	test.afterAll(() =>
		db(
			(sql) =>
				sql`TRUNCATE admin_sessions, admin_users, audit_log RESTART IDENTITY`,
		),
	);

	test("bootstrap with the shared password, then the first owner replaces it", async ({
		page,
	}) => {
		await page.goto("/admin", { waitUntil: "networkidle" });
		await expect(page.locator("input[name=email]")).toHaveCount(0); // no accounts yet: password only
		await page.fill("input[name=password]", SHARED);
		await page.getByRole("button", { name: "Đăng nhập" }).click();
		await expect(page.getByText("Bạn đang đăng nhập bằng")).toBeVisible();

		await page.getByRole("link", { name: "Tạo tài khoản chủ sở hữu" }).click();
		await expect(
			page.getByRole("heading", { name: "Tạo tài khoản chủ sở hữu đầu tiên" }),
		).toBeVisible();
		await page.getByLabel("Họ tên").fill("Chủ trang");
		await page.getByLabel("Email").fill(OWNER.email);
		await page
			.getByLabel("Mật khẩu tạm (ít nhất 10 ký tự)")
			.fill(OWNER.password);
		await page.getByRole("button", { name: "Tạo tài khoản" }).click();
		// Signed straight into the new account
		await expect(page.getByText("Chủ trang · Chủ sở hữu")).toBeVisible();

		// The shared password no longer works
		await page.getByRole("button", { name: "Đăng xuất" }).click();
		await signIn(page, "anyone@example.test", SHARED);
		await expect(page.getByRole("alert")).toHaveText(
			"Sai email hoặc mật khẩu.",
		);
	});

	test("owners manage editors; editors get a limited admin", async ({
		page,
	}) => {
		await signIn(page, OWNER.email, OWNER.password);
		await page.goto("/admin?section=accounts", { waitUntil: "networkidle" });
		await page.getByLabel("Họ tên").fill("Biên tập A");
		await page.getByLabel("Email").fill(EDITOR.email);
		await page.getByLabel("Mật khẩu tạm (ít nhất 10 ký tự)").fill("short");
		await page.getByRole("button", { name: "Tạo tài khoản" }).click();
		await expect(page.locator("input:invalid")).toHaveCount(1); // browser blocks < 10 chars
		await page
			.getByLabel("Mật khẩu tạm (ít nhất 10 ký tự)")
			.fill(EDITOR.password);
		await page.getByRole("button", { name: "Tạo tài khoản" }).click();
		await expect(page.getByRole("status")).toContainText("Đã tạo tài khoản");
		await expect(
			page.getByText("editor@example.test · Biên tập viên"),
		).toBeVisible();
		await page.getByRole("button", { name: "Đăng xuất" }).click();

		await signIn(page, EDITOR.email, EDITOR.password);
		await expect(page.getByText("Biên tập A · Biên tập viên")).toBeVisible();
		await expect(page.getByRole("link", { name: "Tài khoản" })).toHaveCount(0);
		await page.goto("/admin?section=newsletter", { waitUntil: "networkidle" });
		await expect(page.getByRole("button", { name: /Gửi cho/ })).toBeDisabled();
		await page.goto("/admin?section=content", { waitUntil: "networkidle" });
		await expect(
			page.getByRole("button", { name: /Nhập nội dung từ file/ }),
		).toHaveCount(0);
		// …and the server enforces it too
		await page.goto("/admin?section=accounts", { waitUntil: "networkidle" });
		await expect(
			page.getByText("Chỉ chủ sở hữu quản lý tài khoản."),
		).toBeVisible();

		// Editors can change their own password
		await page.goto("/admin", { waitUntil: "networkidle" });
		await page.getByText("Đổi mật khẩu của tôi").click();
		await page.getByLabel("Mật khẩu hiện tại").fill(EDITOR.password);
		await page
			.getByLabel("Mật khẩu mới (ít nhất 10 ký tự)")
			.fill("editor-password-2");
		await page.getByRole("button", { name: "Đổi mật khẩu" }).click();
		await expect(page.getByRole("status")).toContainText("Đã đổi mật khẩu");
		await expect(page.getByText("Biên tập A · Biên tập viên")).toBeVisible(); // still signed in here
	});

	test("the activity log records who did what, and disabling ends sessions", async ({
		browser,
		page,
	}) => {
		// Editor signs in on another device
		const editorCtx = await browser.newContext();
		const editor = await editorCtx.newPage();
		await signIn(editor, EDITOR.email, "editor-password-2");
		await expect(editor.getByText("Biên tập A · Biên tập viên")).toBeVisible();

		await signIn(page, OWNER.email, OWNER.password);
		await page.goto("/admin?section=accounts", { waitUntil: "networkidle" });
		const log = page.locator("ol").last();
		await expect(log).toContainText("Tạo tài khoản");
		await expect(log).toContainText("editor@example.test (editor)");
		await expect(log).toContainText("Đổi mật khẩu");
		await expect(log).toContainText("Biên tập A <editor@example.test>");

		// Can't remove the last owner
		await page
			.locator("li", { hasText: OWNER.email })
			.getByRole("button", { name: "→ Biên tập viên" })
			.click();
		await expect(page.getByRole("alert")).toContainText(
			"ít nhất một chủ sở hữu",
		);

		await page
			.locator("li", { hasText: EDITOR.email })
			.getByRole("button", { name: "Khoá" })
			.click();
		await expect(page.getByRole("status")).toContainText("Đã khoá tài khoản");
		await editor.reload();
		await expect(editor.locator("input[name=email]")).toBeVisible(); // signed out
		await signIn(editor, EDITOR.email, "editor-password-2");
		await expect(editor.getByRole("alert")).toHaveText(
			"Sai email hoặc mật khẩu.",
		);
		await editorCtx.close();
	});

	test("repeated wrong passwords lock the sign-in for a while", async ({
		page,
	}) => {
		test.slow();
		for (let i = 0; i < 10; i++) {
			await signIn(page, OWNER.email, `wrong-${i}-password`);
			await expect(page.getByRole("alert")).toBeVisible();
		}
		await signIn(page, OWNER.email, OWNER.password);
		await expect(page.getByRole("alert")).toContainText("quá nhiều lần");
		await db((sql) => sql`DELETE FROM audit_log WHERE action = 'login_failed'`); // unlock for other tests
	});
});
