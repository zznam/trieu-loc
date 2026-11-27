import { Link } from "@tanstack/react-router";
import type { LaunchCheck } from "#/lib/launch";
import type { LaunchState } from "#/server/launch";
import { COLLECTION_LABELS } from "./ContentEditor";

const MAX_ITEMS = 8;

export function LaunchPanel({ state }: { state: LaunchState }) {
	const { ready, checks } = state;
	const required = checks.filter((c) => c.level === "required");
	const todo = checks.filter((c) => !c.ok).length;
	return (
		<div className="space-y-8">
			<div
				className={`rounded-2xl border p-6 ${
					ready
						? "border-rice-500/50 bg-rice-100/60"
						: "border-earth-500/50 bg-earth-300/20"
				}`}
				data-testid="launch-summary"
			>
				<h2 className="text-2xl font-semibold text-rice-900">
					{ready ? "✅ Sẵn sàng ra mắt" : "⏳ Chưa sẵn sàng ra mắt"}
				</h2>
				<p className="mt-2 text-sm text-ink-soft">
					{required.filter((c) => c.ok).length}/{required.length} mục bắt buộc
					đã xong
					{todo > 0 ? ` · còn ${todo} việc nên làm` : " · không còn việc gì"}.
					Danh sách được kiểm tra lại mỗi lần mở trang này.
				</p>
			</div>
			<CheckGroup
				title="Cài đặt"
				checks={checks.filter((c) => c.group === "setup")}
			/>
			<CheckGroup
				title="Nội dung"
				checks={checks.filter((c) => c.group === "content")}
			/>
		</div>
	);
}

function CheckGroup({
	title,
	checks,
}: {
	title: string;
	checks: LaunchCheck[];
}) {
	// Open items first, required before recommended.
	const sorted = [...checks].sort(
		(a, b) =>
			Number(a.ok) - Number(b.ok) ||
			Number(a.level !== "required") - Number(b.level !== "required"),
	);
	return (
		<section>
			<h3 className="mb-3 text-lg font-semibold text-rice-900">{title}</h3>
			<ul className="space-y-3">
				{sorted.map((c) => (
					<CheckRow key={c.id} check={c} />
				))}
			</ul>
		</section>
	);
}

function CheckRow({ check: c }: { check: LaunchCheck }) {
	const icon = c.ok ? "✅" : c.level === "required" ? "❌" : "⚠️";
	const items = (c.ok ? [] : (c.items ?? [])).map((name) =>
		c.id === "imported"
			? (COLLECTION_LABELS[name as keyof typeof COLLECTION_LABELS] ?? name)
			: name,
	);
	return (
		<li
			className="rounded-2xl border border-earth-300/50 bg-card/70 p-4"
			data-testid={`launch-check-${c.id}`}
			data-ok={c.ok}
		>
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<p className="font-semibold text-ink">
					<span aria-hidden="true">{icon}</span> {c.title}
					{!c.ok && (
						<span
							className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
								c.level === "required"
									? "bg-lotus/15 text-lotus"
									: "bg-earth-300/30 text-earth-700"
							}`}
						>
							{c.level === "required" ? "Bắt buộc" : "Nên làm"}
						</span>
					)}
				</p>
				{!c.ok && c.fix && (
					<Link
						to="/admin"
						search={{ section: "content", collection: c.fix }}
						className="text-sm font-semibold text-rice-700 underline"
					>
						Sửa trong Nội dung →
					</Link>
				)}
				{!c.ok && c.id === "accounts" && (
					<Link
						to="/admin"
						search={{ section: "accounts" }}
						className="text-sm font-semibold text-rice-700 underline"
					>
						Mở Tài khoản →
					</Link>
				)}
			</div>
			<p className="mt-1 text-sm text-ink-soft">{c.detail}</p>
			{items.length > 0 && (
				<ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
					{items.slice(0, MAX_ITEMS).map((name, i) => (
						<li
							// biome-ignore lint/suspicious/noArrayIndexKey: names may repeat
							key={i}
							className="rounded-full bg-paper-2 px-2.5 py-1 text-ink-soft"
						>
							{name}
						</li>
					))}
					{items.length > MAX_ITEMS && (
						<li className="px-1 py-1 text-ink-soft">
							+{items.length - MAX_ITEMS} mục khác
						</li>
					)}
				</ul>
			)}
		</li>
	);
}
