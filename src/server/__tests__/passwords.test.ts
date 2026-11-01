import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../auth";

describe("password hashing (scrypt)", () => {
	it("verifies the right password and rejects others", async () => {
		const stored = await hashPassword("mật-khẩu-dài-123");
		expect(stored).toMatch(
			/^scrypt\$16384\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/,
		);
		expect(await verifyPassword("mật-khẩu-dài-123", stored)).toBe(true);
		expect(await verifyPassword("mật-khẩu-dài-124", stored)).toBe(false);
		expect(await verifyPassword("", stored)).toBe(false);
	});

	it("salts every hash", async () => {
		expect(await hashPassword("same-password!")).not.toBe(
			await hashPassword("same-password!"),
		);
	});

	it("treats composed and decomposed Vietnamese the same (NFKC)", async () => {
		const stored = await hashPassword("Triệu Lộc 2026".normalize("NFC"));
		expect(
			await verifyPassword("Triệu Lộc 2026".normalize("NFD"), stored),
		).toBe(true);
	});

	it("rejects malformed hashes", async () => {
		expect(await verifyPassword("x", "plain-text")).toBe(false);
		expect(await verifyPassword("x", "bcrypt$1$2$3$a$b")).toBe(false);
	});
});
