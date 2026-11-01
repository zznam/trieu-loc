import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { type Kind, kindLabel } from "#/lib/contribute";
import {
	type AdminContribution,
	adminLogin,
	adminLogout,
	deleteContribution,
	getAdminState,
	reviewContribution,
} from "#/server/contributions";
import type { ContributionStatus } from "#/server/schema";

const STATUSES: { value: ContributionStatus; label: string }[] = [
	{ value: "pending", label: "Chờ duyệt" },
	{ value: "approved", label: "Đã duyệt" },
	{ value: "rejected", label: "Từ chối" },
];

export const Route = createFileRoute("/admin")({
	validateSearch: (
		s: Record<string, unknown>,
	): { status?: ContributionStatus } =>
		STATUSES.some((x) => x.value === s.status)
			? { status: s.status as ContributionStatus }
			: {},
	loaderDeps: ({ search }) => ({ status: search.status ?? "pending" }),
	loader: ({ deps }) => getAdminState({ data: { status: deps.status } }),
	head: () => ({
		meta: [
			{ title: "Quản trị đóng góp · Triệu Lộc" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
	component: AdminPage,
});

function AdminPage() {
	const state = Route.useLoaderData();
	const { status = "pending" } = Route.useSearch();

	return (
		<div className="min-h-screen bg-paper">
			<header className="border-b border-earth-300/40 bg-paper-2">
				<div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
					<Link
						to="/$lang"
						params={{ lang: "vi" }}
						className="font-serif text-lg font-semibold text-rice-900"
					>
						← Triệu Lộc
					</Link>
					<span className="text-sm font-semibold uppercase tracking-widest text-earth-700">
						Quản trị đóng góp
					</span>
					{state.authed ? <LogoutButton /> : <span />}
				</div>
			</header>
			<main className="mx-auto max-w-5xl px-4 py-8">
				<ConfigWarnings configured={state.configured} />
				{!state.configured.admin ? null : !state.authed ? (
					<LoginForm />
				) : (
					<>
						<nav className="mb-6 flex flex-wrap gap-2" aria-label="Trạng thái">
							{STATUSES.map((s) => (
								<Link
									key={s.value}
									to="/admin"
									search={{ status: s.value }}
									className={`rounded-full px-4 py-2 text-sm font-medium ${
										status === s.value
											? "bg-rice-700 text-paper"
											: "border border-earth-300 text-ink-soft hover:bg-rice-100"
									}`}
								>
									{s.label}{" "}
									<span className="opacity-70">({state.counts[s.value]})</span>
								</Link>
							))}
						</nav>
						{state.items.length === 0 ? (
							<p className="rounded-2xl bg-paper-2 p-8 text-center text-ink-soft">
								Không có đóng góp nào ở mục này.
							</p>
						) : (
							<ul className="space-y-4">
								{state.items.map((item) => (
									<ContributionCard key={item.id} item={item} />
								))}
							</ul>
						)}
					</>
				)}
			</main>
		</div>
	);
}

function ConfigWarnings({
	configured,
}: {
	configured: { db: boolean; blob: boolean; admin: boolean };
}) {
	const missing = [
		!configured.admin && "ADMIN_PASSWORD (mật khẩu trang quản trị)",
		!configured.db && "DATABASE_URL (cơ sở dữ liệu Neon)",
		!configured.blob &&
			"BLOB_READ_WRITE_TOKEN (lưu ảnh Vercel Blob — chỉ cần nếu muốn nhận ảnh)",
	].filter(Boolean);
	if (missing.length === 0) return null;
	return (
		<div className="mb-6 rounded-2xl border border-earth-500/50 bg-earth-300/20 p-5 text-sm text-ink">
			<p className="font-semibold">
				Chưa cấu hình đủ biến môi trường trên Vercel:
			</p>
			<ul className="mt-2 list-disc pl-5">
				{missing.map((m) => (
					<li key={String(m)}>{m}</li>
				))}
			</ul>
			<p className="mt-2 text-ink-soft">
				Xem hướng dẫn trong README, mục “Contributions”.
			</p>
		</div>
	);
}

function LoginForm() {
	const router = useRouter();
	const [error, setError] = useState(false);
	const [busy, setBusy] = useState(false);
	return (
		<form
			className="mx-auto mt-10 max-w-sm space-y-4 rounded-2xl border border-earth-300/50 bg-card p-6"
			onSubmit={async (e) => {
				e.preventDefault();
				setBusy(true);
				setError(false);
				const password = String(
					new FormData(e.currentTarget).get("password") ?? "",
				);
				const res = await adminLogin({ data: { password } });
				setBusy(false);
				if (res.ok) await router.invalidate();
				else setError(true);
			}}
		>
			<h1 className="text-2xl font-semibold text-rice-900">Đăng nhập</h1>
			<label className="block">
				<span className="mb-1.5 block text-sm font-semibold text-rice-900">
					Mật khẩu quản trị
				</span>
				<input
					name="password"
					type="password"
					required
					autoComplete="current-password"
					className="w-full rounded-xl border border-earth-300 bg-paper px-4 py-2.5 outline-none focus:border-rice-500"
				/>
			</label>
			{error && (
				<p role="alert" className="text-sm font-medium text-lotus">
					Sai mật khẩu.
				</p>
			)}
			<button
				type="submit"
				disabled={busy}
				className="w-full rounded-full bg-rice-700 px-6 py-2.5 font-semibold text-paper disabled:opacity-60"
			>
				{busy ? "Đang kiểm tra…" : "Đăng nhập"}
			</button>
		</form>
	);
}

function LogoutButton() {
	const router = useRouter();
	return (
		<button
			type="button"
			onClick={async () => {
				await adminLogout();
				await router.invalidate();
			}}
			className="rounded-full border border-earth-300 px-3 py-1.5 text-xs font-semibold text-earth-700"
		>
			Đăng xuất
		</button>
	);
}

function ContributionCard({ item }: { item: AdminContribution }) {
	const router = useRouter();
	const [note, setNote] = useState(item.adminNote ?? "");
	const [busy, setBusy] = useState(false);

	async function act(fn: () => Promise<unknown>) {
		setBusy(true);
		try {
			await fn();
			await router.invalidate();
		} finally {
			setBusy(false);
		}
	}

	const setStatus = (status: ContributionStatus) =>
		act(() =>
			reviewContribution({
				data: { id: item.id, status, note: note || undefined },
			}),
		);

	return (
		<li className="rounded-2xl border border-earth-300/50 bg-card p-5">
			<div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-earth-700">
				<span>#{item.id}</span>
				<span>·</span>
				<span>{kindLabel[item.kind as Kind]?.vi ?? item.kind}</span>
				<span>·</span>
				<time dateTime={item.createdAt}>
					{new Date(item.createdAt).toLocaleString("vi-VN")}
				</time>
				<span>·</span>
				<span>{item.lang.toUpperCase()}</span>
				<span
					className={`rounded-full px-2 py-0.5 normal-case tracking-normal ${
						item.consent
							? "bg-rice-100 text-rice-900"
							: "bg-lotus/15 text-lotus"
					}`}
				>
					{item.consent ? "Đồng ý đăng" : "Chưa đồng ý đăng"}
				</span>
			</div>
			<h2 className="mt-2 text-xl font-semibold text-rice-900">{item.title}</h2>
			<p className="mt-1 text-sm text-ink-soft">
				{item.name}
				{item.village && ` · ${item.village}`}
				{item.contact && (
					<>
						{" · "}
						<span className="font-medium text-ink">{item.contact}</span>
					</>
				)}
			</p>
			<p className="mt-3 whitespace-pre-wrap text-ink">{item.message}</p>
			{item.photos.length > 0 && (
				<div className="mt-4 flex flex-wrap gap-3">
					{item.photos.map((p) => (
						<a key={p.url} href={p.url} target="_blank" rel="noreferrer">
							<img
								src={p.url}
								alt=""
								loading="lazy"
								className="h-32 w-32 rounded-xl object-cover ring-1 ring-earth-300"
							/>
						</a>
					))}
				</div>
			)}
			<label className="mt-4 block">
				<span className="mb-1 block text-xs font-semibold text-ink-soft">
					Ghi chú nội bộ
				</span>
				<input
					value={note}
					onChange={(e) => setNote(e.target.value)}
					maxLength={1000}
					className="w-full rounded-xl border border-earth-300 bg-paper px-3 py-2 text-sm outline-none focus:border-rice-500"
				/>
			</label>
			<div className="mt-4 flex flex-wrap gap-2">
				{item.status !== "approved" && (
					<button
						type="button"
						disabled={busy}
						onClick={() => setStatus("approved")}
						className="rounded-full bg-rice-700 px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
					>
						✓ Duyệt
					</button>
				)}
				{item.status !== "rejected" && (
					<button
						type="button"
						disabled={busy}
						onClick={() => setStatus("rejected")}
						className="rounded-full border border-earth-300 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
					>
						✕ Từ chối
					</button>
				)}
				{item.status !== "pending" && (
					<button
						type="button"
						disabled={busy}
						onClick={() => setStatus("pending")}
						className="rounded-full border border-earth-300 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
					>
						↺ Chuyển về chờ duyệt
					</button>
				)}
				<button
					type="button"
					disabled={busy}
					onClick={() => {
						if (
							confirm(
								`Xoá vĩnh viễn đóng góp #${item.id}${item.photos.length ? " và ảnh kèm theo" : ""}?`,
							)
						) {
							void act(() => deleteContribution({ data: { id: item.id } }));
						}
					}}
					className="ml-auto rounded-full px-4 py-2 text-sm font-semibold text-lotus hover:bg-lotus/10 disabled:opacity-60"
				>
					Xoá
				</button>
			</div>
			{item.kind === "photo" && item.status === "approved" && !item.consent && (
				<p className="mt-3 text-xs text-lotus">
					Ảnh này đã duyệt nhưng người gửi chưa đồng ý đăng, nên sẽ không hiện
					trong Thư viện ảnh.
				</p>
			)}
		</li>
	);
}
