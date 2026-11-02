import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import {
	type AdminUser,
	accountsExist,
	audit,
	currentAdmin,
	endAllSessions,
	hashPassword,
	isAdminConfigured,
	login,
	requireAdmin,
	requireOwner,
	verifyPassword,
} from "./auth";
import { getDb, isDbConfigured } from "./db";
import { ADMIN_ROLES, adminUsers, auditLog } from "./schema";

const PASSWORD = z.string().min(10, "Mật khẩu cần ít nhất 10 ký tự").max(200);

export type AdminSession = {
	me: AdminUser | null;
	/** False while only the shared ADMIN_PASSWORD can sign in. */
	accountsExist: boolean;
	configured: boolean;
};

/** Who is signed in (for the admin header and the login form). */
export const getAdminSession = createServerFn({ method: "GET" }).handler(
	async (): Promise<AdminSession> => ({
		me: await currentAdmin(),
		accountsExist: await accountsExist(),
		configured: isAdminConfigured(),
	}),
);

export type Account = {
	id: number;
	email: string;
	name: string;
	role: (typeof ADMIN_ROLES)[number];
	disabled: boolean;
	createdAt: string;
	lastLoginAt: string | null;
};

export type LogEntry = {
	id: number;
	actor: string;
	action: string;
	target: string | null;
	at: string;
};

export type AccountsState = { accounts: Account[]; log: LogEntry[] };

export const getAccountsAdmin = createServerFn({ method: "GET" }).handler(
	async (): Promise<AccountsState> => {
		await requireOwner();
		if (!isDbConfigured()) return { accounts: [], log: [] };
		const db = getDb();
		const [users, log] = await Promise.all([
			db.select().from(adminUsers).orderBy(adminUsers.createdAt),
			db.select().from(auditLog).orderBy(desc(auditLog.at)).limit(200),
		]);
		return {
			accounts: users.map((u) => ({
				id: u.id,
				email: u.email,
				name: u.name,
				role: u.role,
				disabled: u.disabled,
				createdAt: u.createdAt.toISOString(),
				lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
			})),
			log: log.map((l) => ({
				id: l.id,
				actor: l.actor,
				action: l.action,
				target: l.target,
				at: l.at.toISOString(),
			})),
		};
	},
);

type Result = { ok: true } | { ok: false; error: string };

const fail = (error: string): Result => ({ ok: false, error });

async function activeOwnerCount(exceptId?: number) {
	const [{ n }] = await getDb()
		.select({ n: count() })
		.from(adminUsers)
		.where(
			and(
				eq(adminUsers.role, "owner"),
				eq(adminUsers.disabled, false),
				...(exceptId !== undefined ? [ne(adminUsers.id, exceptId)] : []),
			),
		);
	return n;
}

export const createAccount = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				email: z
					.string()
					.trim()
					.toLowerCase()
					.email("Email chưa đúng")
					.max(254),
				name: z.string().trim().min(1, "Cần nhập tên").max(100),
				role: z.enum(ADMIN_ROLES),
				password: PASSWORD,
			})
			.safeParse(input),
	)
	.handler(async ({ data: parsed }): Promise<Result> => {
		const me = await requireOwner();
		if (!parsed.success)
			return fail(parsed.error.issues[0]?.message ?? "Thông tin chưa hợp lệ");
		const data = parsed.data;
		const first = !(await accountsExist());
		// The very first account replaces the shared password, so it must be an owner.
		const role = first ? "owner" : data.role;
		const db = getDb();
		const [exists] = await db
			.select({ id: adminUsers.id })
			.from(adminUsers)
			.where(eq(adminUsers.email, data.email));
		if (exists) return fail("Email này đã có tài khoản");
		await db.insert(adminUsers).values({
			email: data.email,
			name: data.name,
			role,
			passwordHash: await hashPassword(data.password),
		});
		await audit(me, "account_create", `${data.email} (${role})`);
		// The shared password stops working now; sign the creator straight into the new account.
		if (first) await login(data.email, data.password);
		return { ok: true };
	});

export const updateAccount = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({
				id: z.number().int().positive(),
				role: z.enum(ADMIN_ROLES).optional(),
				disabled: z.boolean().optional(),
			})
			.parse(input),
	)
	.handler(async ({ data }): Promise<Result> => {
		const me = await requireOwner();
		const db = getDb();
		const [target] = await db
			.select()
			.from(adminUsers)
			.where(eq(adminUsers.id, data.id));
		if (!target) return fail("Không tìm thấy tài khoản");
		const losesOwner =
			target.role === "owner" &&
			(data.role === "editor" || data.disabled === true);
		if (losesOwner && (await activeOwnerCount(target.id)) === 0) {
			return fail("Cần giữ lại ít nhất một chủ sở hữu đang hoạt động");
		}
		await db
			.update(adminUsers)
			.set({
				...(data.role ? { role: data.role } : {}),
				...(data.disabled !== undefined ? { disabled: data.disabled } : {}),
			})
			.where(eq(adminUsers.id, data.id));
		if (data.disabled) await endAllSessions(data.id);
		await audit(
			me,
			data.disabled !== undefined
				? data.disabled
					? "account_disable"
					: "account_enable"
				: "account_role",
			`${target.email}${data.role ? ` → ${data.role}` : ""}`,
		);
		return { ok: true };
	});

export const resetAccountPassword = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z
			.object({ id: z.number().int().positive(), password: PASSWORD })
			.safeParse(input),
	)
	.handler(async ({ data: parsed }): Promise<Result> => {
		const me = await requireOwner();
		if (!parsed.success)
			return fail(parsed.error.issues[0]?.message ?? "Mật khẩu chưa hợp lệ");
		const db = getDb();
		const [target] = await db
			.select()
			.from(adminUsers)
			.where(eq(adminUsers.id, parsed.data.id));
		if (!target) return fail("Không tìm thấy tài khoản");
		await db
			.update(adminUsers)
			.set({ passwordHash: await hashPassword(parsed.data.password) })
			.where(eq(adminUsers.id, target.id));
		await endAllSessions(target.id);
		await audit(me, "account_password_reset", target.email);
		return { ok: true };
	});

export const changeOwnPassword = createServerFn({ method: "POST" })
	.validator((input: unknown) =>
		z.object({ current: z.string().max(200), next: PASSWORD }).safeParse(input),
	)
	.handler(async ({ data: parsed }): Promise<Result> => {
		const me = await requireAdmin();
		if (!parsed.success)
			return fail(parsed.error.issues[0]?.message ?? "Mật khẩu chưa hợp lệ");
		if (me.bootstrap) return fail("Hãy tạo tài khoản trước");
		const db = getDb();
		const [user] = await db
			.select()
			.from(adminUsers)
			.where(eq(adminUsers.id, me.id));
		if (
			!user ||
			!(await verifyPassword(parsed.data.current, user.passwordHash))
		) {
			return fail("Mật khẩu hiện tại chưa đúng");
		}
		await db
			.update(adminUsers)
			.set({ passwordHash: await hashPassword(parsed.data.next) })
			.where(eq(adminUsers.id, me.id));
		// Sign out other devices; keep this one by signing in again.
		await endAllSessions(me.id);
		await login(user.email, parsed.data.next);
		await audit(me, "password_change");
		return { ok: true };
	});
