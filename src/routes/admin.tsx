import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { type Kind, kindLabel } from "#/lib/contribute";
import { getVillage, villages } from "#/lib/villages";
import {
	type AdminContribution,
	adminLogin,
	adminLogout,
	deleteContribution,
	getAdminState,
	type PublishError,
	reviewContribution,
	setPublished,
	updateContribution,
} from "#/server/contributions";
import {
	type AdminMessage,
	deleteMessage,
	getMessagesAdmin,
	moderateMessage,
} from "#/server/messages";
import type { ContributionStatus } from "#/server/schema";

const STATUSES: { value: ContributionStatus; label: string }[] = [
	{ value: "pending", label: "Chờ duyệt" },
	{ value: "approved", label: "Đã duyệt" },
	{ value: "rejected", label: "Từ chối" },
];

const SECTIONS = [
	{ value: "contributions", label: "Đóng góp" },
	{ value: "guestbook", label: "Sổ lưu bút" },
] as const;
type Section = (typeof SECTIONS)[number]["value"];

export const Route = createFileRoute("/admin")({
	validateSearch: (
		s: Record<string, unknown>,
	): { status?: ContributionStatus; section?: Section } => ({
		...(STATUSES.some((x) => x.value === s.status)
			? { status: s.status as ContributionStatus }
			: {}),
		...(SECTIONS.some((x) => x.value === s.section) &&
		s.section !== "contributions"
			? { section: s.section as Section }
			: {}),
	}),
	loaderDeps: ({ search }) => ({
		status: search.status ?? "pending",
		section: search.section ?? "contributions",
	}),
	loader: async ({ deps }) =>
		deps.section === "contributions"
			? {
					contrib: await getAdminState({ data: { status: deps.status } }),
					msgs: null,
				}
			: {
					contrib: null,
					msgs: await getMessagesAdmin({
						data: { kind: deps.section, status: deps.status },
					}),
				},
	head: () => ({
		meta: [
			{ title: "Quản trị · Triệu Lộc" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
	component: AdminPage,
});

function AdminPage() {
	const { contrib, msgs } = Route.useLoaderData();
	const { status = "pending", section = "contributions" } = Route.useSearch();
	const authed = contrib?.authed ?? msgs?.authed ?? false;
	const configured = contrib?.configured ?? {
		db: msgs?.configured.db ?? false,
		admin: msgs?.configured.admin ?? false,
		blob: true, // not relevant outside contributions
		notify: true,
	};
	const counts = contrib?.counts ??
		msgs?.counts ?? { pending: 0, approved: 0, rejected: 0 };
	const count = contrib?.items.length ?? msgs?.items.length ?? 0;

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
						Quản trị
					</span>
					{authed ? <LogoutButton /> : <span />}
				</div>
				{authed && (
					<nav
						className="mx-auto flex max-w-5xl gap-1 px-4"
						aria-label="Mục quản trị"
					>
						{SECTIONS.map((s) => (
							<Link
								key={s.value}
								to="/admin"
								search={s.value === "contributions" ? {} : { section: s.value }}
								className={`rounded-t-xl px-4 py-2 text-sm font-semibold ${
									section === s.value
										? "bg-paper text-rice-900"
										: "text-ink-soft hover:text-rice-900"
								}`}
							>
								{s.label}
							</Link>
						))}
					</nav>
				)}
			</header>
			<main className="mx-auto max-w-5xl px-4 py-8">
				<ConfigWarnings configured={configured} />
				{!configured.admin ? null : !authed ? (
					<LoginForm />
				) : (
					<>
						<nav className="mb-6 flex flex-wrap gap-2" aria-label="Trạng thái">
							{STATUSES.map((s) => (
								<Link
									key={s.value}
									to="/admin"
									search={{
										status: s.value,
										...(section === "contributions" ? {} : { section }),
									}}
									className={`rounded-full px-4 py-2 text-sm font-medium ${
										status === s.value
											? "bg-rice-700 text-paper"
											: "border border-earth-300 text-ink-soft hover:bg-rice-100"
									}`}
								>
									{s.label}{" "}
									<span className="opacity-70">({counts[s.value]})</span>
								</Link>
							))}
						</nav>
						{count === 0 ? (
							<p className="rounded-2xl bg-paper-2 p-8 text-center text-ink-soft">
								Không có mục nào ở đây.
							</p>
						) : contrib ? (
							<ul className="space-y-4">
								{contrib.items.map((item) => (
									<ContributionCard key={item.id} item={item} />
								))}
							</ul>
						) : (
							<ul className="space-y-3">
								{msgs?.items.map((m) => (
									<MessageCard key={m.id} item={m} />
								))}
							</ul>
						)}
					</>
				)}
			</main>
		</div>
	);
}

function MessageCard({ item }: { item: AdminMessage }) {
	const router = useRouter();
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
	const btn =
		"rounded-full border border-earth-300 px-3 py-1.5 text-sm font-semibold text-ink disabled:opacity-60";
	return (
		<li className="rounded-2xl border border-earth-300/50 bg-card p-4">
			<p className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-widest text-earth-700">
				<span>#{item.id}</span>
				<span>·</span>
				<time dateTime={item.createdAt}>
					{new Date(item.createdAt).toLocaleString("vi-VN")}
				</time>
				<span>·</span>
				<span>{item.lang.toUpperCase()}</span>
				{item.target && (
					<>
						<span>·</span>
						<span className="normal-case tracking-normal">{item.target}</span>
					</>
				)}
			</p>
			<p className="mt-2 whitespace-pre-line text-ink">{item.message}</p>
			<p className="mt-2 text-sm text-ink-soft">
				— <span className="font-semibold text-ink">{item.name}</span>
				{item.place && ` · ${item.place}`}
			</p>
			<div className="mt-3 flex flex-wrap gap-2">
				{item.status !== "approved" && (
					<button
						type="button"
						disabled={busy}
						onClick={() =>
							void act(() =>
								moderateMessage({ data: { id: item.id, status: "approved" } }),
							)
						}
						className="rounded-full bg-rice-700 px-3 py-1.5 text-sm font-semibold text-paper disabled:opacity-60"
					>
						✓ Duyệt & hiển thị
					</button>
				)}
				{item.status !== "rejected" && (
					<button
						type="button"
						disabled={busy}
						onClick={() =>
							void act(() =>
								moderateMessage({ data: { id: item.id, status: "rejected" } }),
							)
						}
						className={btn}
					>
						{item.status === "approved" ? "Ẩn" : "✕ Từ chối"}
					</button>
				)}
				{item.status !== "pending" && (
					<button
						type="button"
						disabled={busy}
						onClick={() =>
							void act(() =>
								moderateMessage({ data: { id: item.id, status: "pending" } }),
							)
						}
						className={btn}
					>
						↺ Chờ duyệt
					</button>
				)}
				<button
					type="button"
					disabled={busy}
					onClick={() => {
						if (confirm(`Xoá vĩnh viễn lời nhắn #${item.id}?`))
							void act(() => deleteMessage({ data: { id: item.id } }));
					}}
					className="ml-auto rounded-full px-3 py-1.5 text-sm font-semibold text-lotus hover:bg-lotus/10 disabled:opacity-60"
				>
					Xoá
				</button>
			</div>
		</li>
	);
}

function ConfigWarnings({
	configured,
}: {
	configured: { db: boolean; blob: boolean; admin: boolean; notify: boolean };
}) {
	const missing = [
		!configured.admin && "ADMIN_PASSWORD (mật khẩu trang quản trị)",
		!configured.db && "DATABASE_URL (cơ sở dữ liệu Neon)",
		!configured.blob &&
			"BLOB_READ_WRITE_TOKEN (lưu ảnh Vercel Blob — chỉ cần nếu muốn nhận ảnh)",
		!configured.notify &&
			"RESEND_API_KEY + NOTIFY_EMAIL (email báo khi có đóng góp mới — không bắt buộc)",
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

const PUBLISH_ERRORS: Record<PublishError, string> = {
	not_found: "Không tìm thấy đóng góp.",
	no_consent: "Người gửi chưa đồng ý cho đăng, nên không thể đăng lên trang.",
	unsupported:
		"Loại đóng góp này chỉ để ban biên tập đọc, không đăng lên trang.",
	missing_date: "Sự kiện cần có ngày diễn ra trước khi đăng.",
	missing_photo: "Không có ảnh để đăng.",
};

/** Where a published item appears on the site. */
function liveLink(item: AdminContribution) {
	if (item.kind === "story")
		return {
			to: "/$lang/news/$slug",
			params: { lang: "vi", slug: `cong-dong-${item.id}` },
			label: "Tin tức",
		};
	if (item.kind === "event")
		return { to: "/$lang/events", params: { lang: "vi" }, label: "Sự kiện" };
	if (item.kind === "business")
		return {
			to: "/$lang/food",
			params: { lang: "vi" },
			label: "Danh bạ cơ sở",
		};
	if (item.kind === "photo")
		return {
			to: "/$lang/gallery",
			params: { lang: "vi" },
			label: "Thư viện ảnh",
		};
	return null;
}

const field =
	"w-full rounded-xl border border-earth-300 bg-paper px-3 py-2 text-sm outline-none focus:border-rice-500";
const fieldLabel = "mb-1 block text-xs font-semibold text-ink-soft";

function ContributionCard({ item }: { item: AdminContribution }) {
	const router = useRouter();
	const [note, setNote] = useState(item.adminNote ?? "");
	const [busy, setBusy] = useState(false);
	const [editing, setEditing] = useState(false);
	const [message, setMessage] = useState<{
		tone: "ok" | "error";
		text: string;
	} | null>(null);
	const [form, setForm] = useState({
		title: item.title,
		message: item.message,
		villageId: item.villageId ?? "",
		eventDate: item.eventDate ?? "",
		eventDays: item.eventDays,
		eventLocation: item.eventLocation ?? item.village ?? "",
		businessCategory: item.businessCategory ?? "",
		businessPhone: item.businessPhone ?? "",
	});
	const publishable = ["story", "event", "business", "photo"].includes(
		item.kind,
	);
	const live = item.publishedAt !== null;
	const link = liveLink(item);

	async function act(fn: () => Promise<unknown>, done?: string) {
		setBusy(true);
		setMessage(null);
		try {
			await fn();
			if (done) setMessage({ tone: "ok", text: done });
			await router.invalidate();
		} catch {
			setMessage({ tone: "error", text: "Có lỗi xảy ra, vui lòng thử lại." });
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

	const save = () =>
		act(async () => {
			await updateContribution({
				data: {
					id: item.id,
					title: form.title,
					message: form.message,
					villageId: form.villageId || null,
					eventDate: form.eventDate || null,
					eventDays: Number(form.eventDays) || 1,
					eventLocation: form.eventLocation || null,
					businessCategory: form.businessCategory || null,
					businessPhone: form.businessPhone || null,
				},
			});
			setEditing(false);
		}, "Đã lưu.");

	async function publish(on: boolean) {
		setBusy(true);
		setMessage(null);
		try {
			const res = await setPublished({ data: { id: item.id, publish: on } });
			if (res.ok) {
				setMessage({
					tone: "ok",
					text: on ? "Đã đăng lên trang." : "Đã gỡ khỏi trang.",
				});
				await router.invalidate();
			} else {
				setMessage({ tone: "error", text: PUBLISH_ERRORS[res.error] });
			}
		} catch {
			setMessage({ tone: "error", text: "Có lỗi xảy ra, vui lòng thử lại." });
		} finally {
			setBusy(false);
		}
	}

	const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
		setForm((f) => ({
			...f,
			[k]: k === "eventDays" ? Number(e.target.value) : e.target.value,
		}));

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
				{live && (
					<span className="rounded-full bg-rice-700 px-2 py-0.5 normal-case tracking-normal text-paper">
						● Đang hiển thị
					</span>
				)}
			</div>

			{editing ? (
				<div className="mt-4 space-y-3 rounded-xl bg-paper-2 p-4">
					<label className="block">
						<span className={fieldLabel}>Tiêu đề</span>
						<input
							value={form.title}
							onChange={set("title")}
							maxLength={200}
							className={field}
						/>
					</label>
					<label className="block">
						<span className={fieldLabel}>
							Nội dung (hiển thị dạng văn bản thường)
						</span>
						<textarea
							value={form.message}
							onChange={set("message")}
							rows={8}
							maxLength={5000}
							className={field}
						/>
					</label>
					<label className="block">
						<span className={fieldLabel}>Thôn</span>
						<select
							value={form.villageId}
							onChange={set("villageId")}
							className={field}
						>
							<option value="">— Không gắn thôn —</option>
							{villages.map((v) => (
								<option key={v.id} value={v.id}>
									{v.name.vi}
								</option>
							))}
						</select>
					</label>
					{item.kind === "event" && (
						<div className="grid gap-3 sm:grid-cols-3">
							<label className="block">
								<span className={fieldLabel}>Ngày diễn ra (dương lịch)</span>
								<input
									type="date"
									value={form.eventDate}
									onChange={set("eventDate")}
									className={field}
								/>
							</label>
							<label className="block">
								<span className={fieldLabel}>Số ngày</span>
								<input
									type="number"
									min={1}
									max={30}
									value={form.eventDays}
									onChange={set("eventDays")}
									className={field}
								/>
							</label>
							<label className="block">
								<span className={fieldLabel}>Địa điểm</span>
								<input
									value={form.eventLocation}
									onChange={set("eventLocation")}
									maxLength={200}
									className={field}
								/>
							</label>
						</div>
					)}
					{item.kind === "business" && (
						<div className="grid gap-3 sm:grid-cols-2">
							<label className="block">
								<span className={fieldLabel}>
									Ngành hàng (vd: Ẩm thực, Nông sản)
								</span>
								<input
									value={form.businessCategory}
									onChange={set("businessCategory")}
									maxLength={80}
									className={field}
								/>
							</label>
							<label className="block">
								<span className={fieldLabel}>Số điện thoại công khai</span>
								<input
									value={form.businessPhone}
									onChange={set("businessPhone")}
									maxLength={40}
									className={field}
								/>
							</label>
						</div>
					)}
					<div className="flex gap-2">
						<button
							type="button"
							disabled={busy}
							onClick={() => void save()}
							className="rounded-full bg-rice-700 px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
						>
							Lưu thay đổi
						</button>
						<button
							type="button"
							onClick={() => setEditing(false)}
							className="rounded-full border border-earth-300 px-4 py-2 text-sm font-semibold text-ink"
						>
							Huỷ
						</button>
					</div>
				</div>
			) : (
				<>
					<h2 className="mt-2 text-xl font-semibold text-rice-900">
						{item.title}
					</h2>
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
					{(item.eventDate || item.businessCategory || item.villageId) && (
						<p className="mt-2 flex flex-wrap gap-2 text-xs">
							{item.villageId && (
								<span className="rounded-full bg-paper-2 px-2 py-1">
									🏘️ {getVillage(item.villageId)?.name.vi ?? item.villageId}
								</span>
							)}
							{item.eventDate && (
								<span className="rounded-full bg-paper-2 px-2 py-1">
									📅 {item.eventDate}
									{item.eventDays > 1 && ` (${item.eventDays} ngày)`}
									{item.eventLocation && ` · ${item.eventLocation}`}
								</span>
							)}
							{item.businessCategory && (
								<span className="rounded-full bg-paper-2 px-2 py-1">
									🏪 {item.businessCategory}
									{item.businessPhone && ` · ☎ ${item.businessPhone}`}
								</span>
							)}
						</p>
					)}
					<p className="mt-3 whitespace-pre-wrap text-ink">{item.message}</p>
					{item.original && (
						<details className="mt-2 text-sm text-ink-soft">
							<summary className="cursor-pointer">
								Xem bản gốc người gửi
							</summary>
							<p className="mt-2 font-semibold">{item.original.title}</p>
							<p className="whitespace-pre-wrap">{item.original.message}</p>
						</details>
					)}
				</>
			)}

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
				<span className={fieldLabel}>Ghi chú nội bộ</span>
				<input
					value={note}
					onChange={(e) => setNote(e.target.value)}
					maxLength={1000}
					className="w-full rounded-xl border border-earth-300 bg-paper px-3 py-2 text-sm outline-none focus:border-rice-500"
				/>
			</label>

			{message && (
				<p
					role={message.tone === "error" ? "alert" : "status"}
					className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${
						message.tone === "error"
							? "bg-lotus/15 text-lotus"
							: "bg-rice-100 text-rice-900"
					}`}
				>
					{message.text}
				</p>
			)}

			<div className="mt-4 flex flex-wrap items-center gap-2">
				{publishable && !editing && (
					<button
						type="button"
						disabled={busy}
						onClick={() => setEditing(true)}
						className="rounded-full border border-earth-300 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
					>
						✎ Sửa
					</button>
				)}
				{publishable &&
					(live ? (
						<button
							type="button"
							disabled={busy}
							onClick={() => void publish(false)}
							className="rounded-full border border-rice-700 px-4 py-2 text-sm font-semibold text-rice-900 disabled:opacity-60"
						>
							⤓ Gỡ khỏi trang
						</button>
					) : (
						<button
							type="button"
							disabled={busy || !item.consent}
							title={item.consent ? undefined : PUBLISH_ERRORS.no_consent}
							onClick={() => void publish(true)}
							className="rounded-full bg-rice-700 px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
						>
							⤒ Đăng lên trang
						</button>
					))}
				{item.status !== "approved" && (
					<button
						type="button"
						disabled={busy}
						onClick={() => void setStatus("approved")}
						className="rounded-full border border-earth-300 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
					>
						✓ Duyệt (không đăng)
					</button>
				)}
				{item.status !== "rejected" && (
					<button
						type="button"
						disabled={busy}
						onClick={() => void setStatus("rejected")}
						className="rounded-full border border-earth-300 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
					>
						✕ Từ chối
					</button>
				)}
				{item.status !== "pending" && (
					<button
						type="button"
						disabled={busy}
						onClick={() => void setStatus("pending")}
						className="rounded-full border border-earth-300 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
					>
						↺ Chờ duyệt
					</button>
				)}
				{live && link && (
					<Link
						to={link.to}
						params={link.params}
						target="_blank"
						className="text-sm font-semibold text-rice-700 hover:underline"
					>
						Xem trên trang ({link.label}) ↗
					</Link>
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
		</li>
	);
}
