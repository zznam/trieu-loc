import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
	type AccountsState,
	changeOwnPassword,
	createAccount,
	resetAccountPassword,
	updateAccount,
} from "#/server/accounts";
import type { AdminUser } from "#/server/auth";

const input =
	"w-full rounded-lg border border-earth-300 bg-paper px-3 py-2 text-sm outline-none focus:border-rice-500";
const lbl = "mb-1 block text-xs font-semibold text-ink-soft";
const btn =
	"rounded-full border border-earth-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-50";

const ACTIONS: Record<string, string> = {
	login: "Đăng nhập",
	login_failed: "Đăng nhập sai",
	logout: "Đăng xuất",
	account_create: "Tạo tài khoản",
	account_disable: "Khoá tài khoản",
	account_enable: "Mở khoá tài khoản",
	account_role: "Đổi vai trò",
	account_password_reset: "Đặt lại mật khẩu",
	password_change: "Đổi mật khẩu",
	contribution_approved: "Duyệt đóng góp",
	contribution_rejected: "Từ chối đóng góp",
	contribution_pending: "Chuyển về chờ duyệt",
	contribution_edit: "Sửa đóng góp",
	contribution_publish: "Đăng đóng góp",
	contribution_unpublish: "Gỡ đóng góp",
	contribution_delete: "Xoá đóng góp",
	message_approved: "Duyệt lời nhắn",
	message_rejected: "Ẩn lời nhắn",
	message_pending: "Lời nhắn về chờ duyệt",
	message_delete: "Xoá lời nhắn",
	newsletter_test: "Gửi thử bản tin",
	newsletter_send: "Gửi bản tin",
	content_import: "Nhập nội dung từ file",
	content_create: "Thêm nội dung",
	content_edit: "Sửa nội dung",
	content_delete: "Xoá nội dung",
	content_export: "Tải bản sao lưu",
	images_cleanup: "Dọn ảnh",
};

function useAction() {
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<{
		tone: "ok" | "error";
		text: string;
	} | null>(null);
	async function run(
		fn: () => Promise<{ ok: boolean; error?: string }>,
		okText: string,
	) {
		setBusy(true);
		setMessage(null);
		try {
			const r = await fn();
			if (r.ok) {
				setMessage({ tone: "ok", text: okText });
				await router.invalidate();
				return true;
			}
			setMessage({ tone: "error", text: r.error ?? "Có lỗi xảy ra." });
		} catch {
			setMessage({ tone: "error", text: "Có lỗi xảy ra." });
		} finally {
			setBusy(false);
		}
		return false;
	}
	const banner = message && (
		<p
			role={message.tone === "error" ? "alert" : "status"}
			className={`rounded-xl px-3 py-2 text-sm font-medium ${message.tone === "error" ? "bg-lotus/15 text-lotus" : "bg-rice-100 text-rice-900"}`}
		>
			{message.text}
		</p>
	);
	return { busy, run, banner };
}

/** Owner-only: accounts and activity log. */
export function AccountsPanel({
	me,
	state,
}: {
	me: AdminUser;
	state: AccountsState;
}) {
	const { busy, run, banner } = useAction();
	const first = state.accounts.length === 0;

	return (
		<div className="space-y-8">
			{banner}
			<section className="rounded-2xl bg-card p-5 ring-1 ring-earth-300/50">
				<h2 className="text-lg font-semibold text-rice-900">
					{first ? "Tạo tài khoản chủ sở hữu đầu tiên" : "Thêm tài khoản"}
				</h2>
				{first && (
					<p className="mt-1 text-sm text-ink-soft">
						Sau khi tạo, mật khẩu chung (ADMIN_PASSWORD) sẽ không dùng để đăng
						nhập được nữa và bạn được chuyển sang tài khoản mới.
					</p>
				)}
				<form
					className="mt-4 grid gap-3 sm:grid-cols-2"
					onSubmit={async (e) => {
						e.preventDefault();
						const form = e.currentTarget;
						const fd = new FormData(form);
						const ok = await run(
							() =>
								createAccount({
									data: {
										email: String(fd.get("email")),
										name: String(fd.get("name")),
										role: (fd.get("role") as "owner" | "editor") ?? "editor",
										password: String(fd.get("password")),
									},
								}),
							"Đã tạo tài khoản. Hãy gửi email và mật khẩu cho người đó (họ nên đổi mật khẩu sau khi đăng nhập).",
						);
						if (ok) form.reset();
					}}
				>
					<label className="block">
						<span className={lbl}>Họ tên</span>
						<input name="name" required maxLength={100} className={input} />
					</label>
					<label className="block">
						<span className={lbl}>Email</span>
						<input name="email" type="email" required className={input} />
					</label>
					<label className="block">
						<span className={lbl}>Mật khẩu tạm (ít nhất 10 ký tự)</span>
						<input
							name="password"
							type="text"
							required
							minLength={10}
							autoComplete="off"
							className={input}
						/>
					</label>
					<label className="block">
						<span className={lbl}>Vai trò</span>
						<select
							name="role"
							defaultValue={first ? "owner" : "editor"}
							disabled={first}
							className={input}
						>
							<option value="editor">
								Biên tập viên — nội dung, duyệt bài
							</option>
							<option value="owner">
								Chủ sở hữu — toàn quyền, quản lý tài khoản
							</option>
						</select>
					</label>
					<div className="sm:col-span-2">
						<button
							type="submit"
							disabled={busy}
							className="rounded-full bg-rice-700 px-5 py-2 text-sm font-semibold text-paper disabled:opacity-60"
						>
							Tạo tài khoản
						</button>
					</div>
				</form>
			</section>

			{state.accounts.length > 0 && (
				<section>
					<h2 className="mb-3 text-lg font-semibold text-rice-900">
						Tài khoản ({state.accounts.length})
					</h2>
					<ul className="divide-y divide-earth-300/40 rounded-2xl bg-card ring-1 ring-earth-300/50">
						{state.accounts.map((a) => (
							<li
								key={a.id}
								className="flex flex-wrap items-center gap-3 px-4 py-3"
							>
								<div className="min-w-0 flex-1">
									<p className="font-medium text-ink">
										{a.name}{" "}
										{a.id === me.id && (
											<span className="text-xs text-ink-soft">(bạn)</span>
										)}
										{a.disabled && (
											<span className="ml-2 rounded-full bg-lotus/15 px-2 text-xs text-lotus">
												đã khoá
											</span>
										)}
									</p>
									<p className="text-xs text-ink-soft">
										{a.email} ·{" "}
										{a.role === "owner" ? "Chủ sở hữu" : "Biên tập viên"} · đăng
										nhập gần nhất:{" "}
										{a.lastLoginAt
											? new Date(a.lastLoginAt).toLocaleString("vi-VN")
											: "chưa"}
									</p>
								</div>
								<button
									type="button"
									disabled={busy}
									className={btn}
									onClick={() =>
										void run(
											() =>
												updateAccount({
													data: {
														id: a.id,
														role: a.role === "owner" ? "editor" : "owner",
													},
												}),
											"Đã đổi vai trò.",
										)
									}
								>
									{a.role === "owner" ? "→ Biên tập viên" : "→ Chủ sở hữu"}
								</button>
								<button
									type="button"
									disabled={busy}
									className={btn}
									onClick={() => {
										const pw = prompt(
											`Mật khẩu mới cho ${a.email} (ít nhất 10 ký tự):`,
										);
										if (pw)
											void run(
												() =>
													resetAccountPassword({
														data: { id: a.id, password: pw },
													}),
												"Đã đặt lại mật khẩu.",
											);
									}}
								>
									Đặt lại mật khẩu
								</button>
								<button
									type="button"
									disabled={busy}
									className={`${btn} ${a.disabled ? "" : "text-lotus"}`}
									onClick={() =>
										void run(
											() =>
												updateAccount({
													data: { id: a.id, disabled: !a.disabled },
												}),
											a.disabled ? "Đã mở khoá." : "Đã khoá tài khoản.",
										)
									}
								>
									{a.disabled ? "Mở khoá" : "Khoá"}
								</button>
							</li>
						))}
					</ul>
				</section>
			)}

			<section>
				<h2 className="mb-3 text-lg font-semibold text-rice-900">
					Nhật ký hoạt động
				</h2>
				{state.log.length === 0 ? (
					<p className="text-ink-soft">Chưa có hoạt động.</p>
				) : (
					<ol className="divide-y divide-earth-300/40 rounded-2xl bg-card text-sm ring-1 ring-earth-300/50">
						{state.log.map((l) => (
							<li key={l.id} className="flex flex-wrap gap-x-3 px-4 py-2">
								<time className="w-36 shrink-0 text-ink-soft" dateTime={l.at}>
									{new Date(l.at).toLocaleString("vi-VN")}
								</time>
								<span className="font-medium text-ink">
									{ACTIONS[l.action] ?? l.action}
								</span>
								{l.target && <span className="text-ink-soft">{l.target}</span>}
								<span className="ml-auto text-ink-soft">{l.actor}</span>
							</li>
						))}
					</ol>
				)}
			</section>
		</div>
	);
}

/** Every signed-in person can change their own password. */
export function ChangePasswordForm() {
	const { busy, run, banner } = useAction();
	return (
		<details className="rounded-2xl bg-card p-4 ring-1 ring-earth-300/50">
			<summary className="cursor-pointer text-sm font-semibold text-rice-900">
				Đổi mật khẩu của tôi
			</summary>
			<form
				className="mt-3 grid gap-3 sm:grid-cols-3"
				onSubmit={async (e) => {
					e.preventDefault();
					const form = e.currentTarget;
					const fd = new FormData(form);
					const ok = await run(
						() =>
							changeOwnPassword({
								data: {
									current: String(fd.get("current")),
									next: String(fd.get("next")),
								},
							}),
						"Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.",
					);
					if (ok) form.reset();
				}}
			>
				<label className="block">
					<span className={lbl}>Mật khẩu hiện tại</span>
					<input
						name="current"
						type="password"
						required
						autoComplete="current-password"
						className={input}
					/>
				</label>
				<label className="block">
					<span className={lbl}>Mật khẩu mới (ít nhất 10 ký tự)</span>
					<input
						name="next"
						type="password"
						required
						minLength={10}
						autoComplete="new-password"
						className={input}
					/>
				</label>
				<div className="flex items-end">
					<button
						type="submit"
						disabled={busy}
						className="rounded-full bg-rice-700 px-5 py-2 text-sm font-semibold text-paper disabled:opacity-60"
					>
						Đổi mật khẩu
					</button>
				</div>
				<div className="sm:col-span-3">{banner}</div>
			</form>
		</details>
	);
}
