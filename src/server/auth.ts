// Admin authentication: per-person accounts (email + password, owner / editor roles).
//
// Bootstrap: while no account exists, the shared ADMIN_PASSWORD still signs you in (as an
// owner) so you can create the first owner account. As soon as one account exists, the
// shared password stops working.
import {
	createHash,
	createHmac,
	randomBytes,
	scrypt as scryptCb,
	timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";
import { and, count, eq, gt, gte } from "drizzle-orm";
import { requestIpHash } from "./abuse";
import { getDb, isDbConfigured } from "./db";
import { type AdminRole, adminSessions, adminUsers, auditLog } from "./schema";

const scrypt = promisify(scryptCb) as (
	pw: string,
	salt: Buffer,
	len: number,
	opts: object,
) => Promise<Buffer>;

const SESSION_COOKIE = "tl_session";
const LEGACY_COOKIE = "tl_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type AdminUser = {
	id: number;
	email: string;
	name: string;
	role: AdminRole;
	bootstrap: boolean;
};

/** Admin sign-in is possible: accounts need the database; bootstrap needs ADMIN_PASSWORD. */
export function isAdminConfigured() {
	return isDbConfigured() || Boolean(process.env.ADMIN_PASSWORD);
}

// ---------- passwords (scrypt) ----------

const N = 16384;
const R = 8;
const P = 1;

export async function hashPassword(password: string) {
	const salt = randomBytes(16);
	const hash = await scrypt(password.normalize("NFKC"), salt, 32, {
		N,
		r: R,
		p: P,
	});
	return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
	const [algo, n, r, p, salt, hash] = stored.split("$");
	if (algo !== "scrypt" || !salt || !hash) return false;
	const expected = Buffer.from(hash, "base64");
	const actual = await scrypt(
		password.normalize("NFKC"),
		Buffer.from(salt, "base64"),
		expected.length,
		{
			N: Number(n),
			r: Number(r),
			p: Number(p),
		},
	);
	return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// ---------- bootstrap (shared ADMIN_PASSWORD, only while there are no accounts) ----------

const legacyToken = (password: string) =>
	createHmac("sha256", password)
		.update("trieu-loc-admin-session-v1")
		.digest("hex");

function safeEqual(a: string, b: string) {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function accountsExist() {
	if (!isDbConfigured()) return false;
	const [{ n }] = await getDb().select({ n: count() }).from(adminUsers);
	return n > 0;
}

const BOOTSTRAP_USER: AdminUser = {
	id: 0,
	email: "",
	name: "Mật khẩu chung",
	role: "owner",
	bootstrap: true,
};

// ---------- sessions ----------

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const cookieOptions = () => ({
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax" as const,
	path: "/",
	maxAge: MAX_AGE,
});

async function startSession(userId: number) {
	const token = randomBytes(32).toString("base64url");
	await getDb()
		.insert(adminSessions)
		.values({
			tokenHash: sha256(token),
			userId,
			expiresAt: new Date(Date.now() + MAX_AGE * 1000),
		});
	setCookie(SESSION_COOKIE, token, cookieOptions());
}

/** The signed-in admin for this request, or null. */
export async function currentAdmin(): Promise<AdminUser | null> {
	const token = getCookie(SESSION_COOKIE);
	if (token && isDbConfigured()) {
		const [row] = await getDb()
			.select({
				id: adminUsers.id,
				email: adminUsers.email,
				name: adminUsers.name,
				role: adminUsers.role,
			})
			.from(adminSessions)
			.innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
			.where(
				and(
					eq(adminSessions.tokenHash, sha256(token)),
					gt(adminSessions.expiresAt, new Date()),
					eq(adminUsers.disabled, false),
				),
			);
		if (row) return { ...row, bootstrap: false };
	}
	const legacy = getCookie(LEGACY_COOKIE);
	const password = process.env.ADMIN_PASSWORD;
	if (
		legacy &&
		password &&
		safeEqual(legacy, legacyToken(password)) &&
		!(await accountsExist())
	) {
		return BOOTSTRAP_USER;
	}
	return null;
}

export async function isAdminRequest() {
	return (await currentAdmin()) !== null;
}

export async function requireAdmin(): Promise<AdminUser> {
	const user = await currentAdmin();
	if (!user) throw new Error("UNAUTHORIZED");
	return user;
}

export async function requireOwner(): Promise<AdminUser> {
	const user = await requireAdmin();
	if (user.role !== "owner") throw new Error("FORBIDDEN");
	return user;
}

// ---------- activity log ----------

export async function audit(
	user: AdminUser | null,
	action: string,
	target?: string,
) {
	if (!isDbConfigured()) return;
	try {
		await getDb()
			.insert(auditLog)
			.values({
				userId: user && !user.bootstrap ? user.id : null,
				actor: user
					? user.bootstrap
						? user.name
						: `${user.name} <${user.email}>`
					: "—",
				action,
				target: target?.slice(0, 200) ?? null,
				ipHash: requestIpHash(),
			});
	} catch (err) {
		console.error("audit log write failed", err);
	}
}

// ---------- sign in / out ----------

const FAIL_WINDOW_MS = 15 * 60_000;
const MAX_FAILS = 10;

export type LoginResult =
	| { ok: true }
	| { ok: false; error: "invalid" | "locked" };

export async function login(
	email: string,
	password: string,
): Promise<LoginResult> {
	const slowDown = () => new Promise((r) => setTimeout(r, 800));
	if (isDbConfigured()) {
		// Lock out an IP after repeated failures (brute-force protection).
		const [{ fails }] = await getDb()
			.select({ fails: count() })
			.from(auditLog)
			.where(
				and(
					eq(auditLog.action, "login_failed"),
					eq(auditLog.ipHash, requestIpHash()),
					gte(auditLog.at, new Date(Date.now() - FAIL_WINDOW_MS)),
				),
			);
		if (fails >= MAX_FAILS) return { ok: false, error: "locked" };
	}

	if (await accountsExist()) {
		const [user] = await getDb()
			.select()
			.from(adminUsers)
			.where(eq(adminUsers.email, email.trim().toLowerCase()));
		if (
			!user ||
			user.disabled ||
			!(await verifyPassword(password, user.passwordHash))
		) {
			await audit(null, "login_failed", email.trim().toLowerCase());
			await slowDown();
			return { ok: false, error: "invalid" };
		}
		await startSession(user.id);
		await getDb()
			.update(adminUsers)
			.set({ lastLoginAt: new Date() })
			.where(eq(adminUsers.id, user.id));
		await audit({ ...user, bootstrap: false }, "login");
		return { ok: true };
	}

	// Bootstrap: no accounts yet, so the shared password signs in as owner.
	const shared = process.env.ADMIN_PASSWORD;
	if (!shared || !safeEqual(legacyToken(password), legacyToken(shared))) {
		await audit(null, "login_failed", "(mật khẩu chung)");
		await slowDown();
		return { ok: false, error: "invalid" };
	}
	setCookie(LEGACY_COOKIE, legacyToken(shared), cookieOptions());
	await audit(BOOTSTRAP_USER, "login");
	return { ok: true };
}

export async function logout() {
	const token = getCookie(SESSION_COOKIE);
	if (token && isDbConfigured()) {
		await getDb()
			.delete(adminSessions)
			.where(eq(adminSessions.tokenHash, sha256(token)));
	}
	deleteCookie(SESSION_COOKIE, { path: "/" });
	deleteCookie(LEGACY_COOKIE, { path: "/" });
}

/** Signs a user out everywhere (after a password reset or when disabling the account). */
export async function endAllSessions(userId: number) {
	await getDb().delete(adminSessions).where(eq(adminSessions.userId, userId));
}
