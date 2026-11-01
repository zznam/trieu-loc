import { expect, test } from "@playwright/test";

const ADMIN = process.env.ADMIN_PASSWORD ?? "e2e-admin-password";
const MOCK = "http://localhost:4599/__log";

type Sent = {
	to: string[];
	subject: string;
	html: string;
	text: string;
	headers?: Record<string, string>;
};

test.describe("newsletter (double opt-in)", () => {
	test.skip(!process.env.DATABASE_URL, "needs DATABASE_URL");

	test("subscribe → confirm by email → receive the digest → one-click unsubscribe", async ({
		page,
		request,
	}) => {
		await request.delete(MOCK);

		// 1. Sign up from the footer
		await page.goto("/en", { waitUntil: "networkidle" });
		await page.fill("#newsletter-email", "Reader@Example.test");
		await page.waitForTimeout(1600);
		await page.getByRole("button", { name: "Subscribe" }).click();
		await expect(page.getByText("Almost done!")).toBeVisible();

		// 2. The confirmation email arrives with a personal link
		const sent: Sent[] = await (await request.get(MOCK)).json();
		const confirm = sent.find((m) => m.to.includes("reader@example.test"));
		expect(confirm?.subject).toBe(
			"Confirm your Triệu Lộc newsletter subscription",
		);
		const link = confirm?.text.match(
			/https?:\/\/\S+\/en\/newsletter\/confirm\?token=[a-f0-9]{48}/,
		)?.[0];
		expect(link).toBeTruthy();

		// 3. Opening the link alone doesn't confirm (link scanners) — the button does
		await page.goto(
			new URL(link as string).pathname + new URL(link as string).search,
		);
		await expect(page.getByText("r•••••@example.test")).toBeVisible();
		await page.getByRole("button", { name: "Confirm" }).click();
		await expect(page.getByText("Confirmed!")).toBeVisible();

		// 4. Editor sends the newsletter
		await request.delete(MOCK);
		await page.goto("/admin?section=newsletter");
		await page.fill("input[name=password]", ADMIN);
		await page.getByRole("button", { name: "Đăng nhập" }).click();
		await expect(page.getByText("Tiếng Việt / English")).toBeVisible();
		await expect(
			page.locator("iframe[title='Xem trước bản tin']"),
		).toBeVisible();
		page.once("dialog", (d) => d.accept());
		await page.getByRole("button", { name: "Gửi cho 1 người" }).click();
		await expect(page.getByRole("status")).toContainText("Đã gửi cho 1 người");

		const digest: Sent[] = await (await request.get(MOCK)).json();
		expect(digest).toHaveLength(1);
		expect(digest[0].to).toEqual(["reader@example.test"]);
		expect(digest[0].subject).toMatch(/^Triệu Lộc newsletter — /); // English subscriber gets English
		expect(digest[0].html).not.toContain("%%UNSUBSCRIBE_URL%%");
		const oneClick =
			digest[0].headers?.["List-Unsubscribe"]?.slice(1, -1) ?? "";
		expect(digest[0].headers?.["List-Unsubscribe-Post"]).toBe(
			"List-Unsubscribe=One-Click",
		);

		// 5. A second send within the hour is blocked
		page.once("dialog", (d) => d.accept());
		await page.getByRole("button", { name: /Gửi cho/ }).click();
		await expect(page.getByRole("alert")).toContainText("vừa được gửi");

		// 6. One-click unsubscribe from the mail app (RFC 8058 POST)
		const url = new URL(oneClick);
		const res = await request.post(url.pathname + url.search);
		expect(res.status()).toBe(200);
		await page.reload();
		await expect(page.locator("dl")).toContainText("Đã huỷ1");
	});

	test("an invalid email is rejected and a bad link is handled", async ({
		page,
	}) => {
		await page.goto("/vi", { waitUntil: "networkidle" });
		await page.fill("#newsletter-email", "not-an-email@");
		// Bypass the browser's own type=email check to exercise the server validation.
		await page.evaluate(() =>
			document
				.querySelector<HTMLInputElement>("#newsletter-email")
				?.setAttribute("type", "text"),
		);
		await page.waitForTimeout(1600);
		await page.getByRole("button", { name: "Đăng ký" }).click();
		await expect(page.getByRole("alert")).toContainText(
			"Email chưa đúng định dạng",
		);

		await page.goto("/vi/newsletter/unsubscribe?token=abc");
		await expect(page.getByText("Liên kết không hợp lệ")).toBeVisible();
	});
});
