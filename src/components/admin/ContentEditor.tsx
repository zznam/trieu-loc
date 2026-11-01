import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
	COLLECTION_NAMES,
	type CollectionName,
	isSingleton,
	itemId,
	type JsonObject,
} from "#/lib/content-schemas";
import { forceNextSync } from "#/lib/content-sync";
import { villages } from "#/lib/villages";
import {
	type ContentAdminState,
	deleteContentItem,
	exportContent,
	importContent,
	saveContentItem,
} from "#/server/content";
import { FIELDS, type Field, itemTitle, newItem } from "./fields";

export const COLLECTION_LABELS: Record<CollectionName, string> = {
	places: "Địa danh",
	villages: "Thôn",
	events: "Sự kiện",
	people: "Con người",
	news: "Tin tức",
	specialties: "Đặc sản",
	businesses: "Cơ sở kinh doanh",
	gallery: "Thư viện ảnh",
	contacts: "Danh bạ",
	site: "Thông tin chung",
	history: "Lịch sử",
};

// ---------- path helpers ("date.day" → obj.date.day) ----------

type Obj = Record<string, unknown>;
const getPath = (o: Obj, path: string): unknown =>
	path.split(".").reduce<unknown>((v, k) => (v as Obj | undefined)?.[k], o);
function setPath(o: Obj, path: string, value: unknown): Obj {
	const [head, ...rest] = path.split(".");
	const copy = { ...o };
	if (rest.length === 0) {
		if (value === undefined) delete copy[head];
		else copy[head] = value;
	} else copy[head] = setPath((o[head] as Obj) ?? {}, rest.join("."), value);
	return copy;
}

const input =
	"w-full rounded-lg border border-earth-300 bg-paper px-3 py-2 text-sm outline-none focus:border-rice-500";
const lbl = "mb-1 block text-xs font-semibold text-ink-soft";

function FieldInput({
	field,
	item,
	onChange,
}: {
	field: Field;
	item: Obj;
	onChange: (next: Obj) => void;
}) {
	const set = (path: string, v: unknown) => onChange(setPath(item, path, v));

	switch (field.kind) {
		case "text": {
			const v = (getPath(item, field.path) as string | undefined) ?? "";
			return (
				<label className="block">
					<span className={lbl}>{field.label}</span>
					<input
						value={v}
						onChange={(e) =>
							set(
								field.path,
								field.optional && !e.target.value ? undefined : e.target.value,
							)
						}
						className={input}
					/>
					{field.hint && (
						<span className="mt-1 block text-xs text-ink-soft">
							{field.hint}
						</span>
					)}
				</label>
			);
		}
		case "bilingual": {
			const v =
				(getPath(item, field.path) as
					| { vi?: string; en?: string }
					| undefined) ?? {};
			// Optional bilingual fields disappear entirely when both languages are empty.
			const update = (l: "vi" | "en", value: string) => {
				const next = { vi: v.vi ?? "", en: v.en ?? "", [l]: value };
				set(
					field.path,
					field.optional && !next.vi.trim() && !next.en.trim()
						? undefined
						: next,
				);
			};
			return (
				<fieldset className="grid gap-2 sm:grid-cols-2">
					<legend className={lbl}>{field.label}</legend>
					{(["vi", "en"] as const).map((l) => (
						<div key={l}>
							{field.rows ? (
								<textarea
									rows={field.rows}
									aria-label={`${field.label} (${l})`}
									value={v[l] ?? ""}
									placeholder={l === "vi" ? "Tiếng Việt" : "English"}
									onChange={(e) => update(l, e.target.value)}
									className={input}
								/>
							) : (
								<input
									aria-label={`${field.label} (${l})`}
									value={v[l] ?? ""}
									placeholder={l === "vi" ? "Tiếng Việt" : "English"}
									onChange={(e) => update(l, e.target.value)}
									className={input}
								/>
							)}
						</div>
					))}
				</fieldset>
			);
		}
		case "list": {
			const list = (getPath(item, field.path) as Obj[] | undefined) ?? [];
			const write = (next: Obj[]) => set(field.path, next);
			const move = (i: number, d: -1 | 1) => {
				const next = [...list];
				[next[i], next[i + d]] = [next[i + d], next[i]];
				write(next);
			};
			const small =
				"rounded-full border border-earth-300 px-2 py-0.5 text-xs font-semibold disabled:opacity-40";
			return (
				<fieldset className="space-y-3">
					<legend className={lbl}>
						{field.label} ({list.length})
					</legend>
					{list.map((entry, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: entries have no id; position is the identity
							key={i}
							className="space-y-2 rounded-xl border border-earth-300/60 bg-paper p-3"
						>
							<div className="flex items-center gap-2">
								<span className="text-sm font-semibold text-rice-900">
									{field.itemLabel} {i + 1}
								</span>
								<button
									type="button"
									disabled={i === 0}
									onClick={() => move(i, -1)}
									className={small}
									aria-label="Lên"
								>
									↑
								</button>
								<button
									type="button"
									disabled={i === list.length - 1}
									onClick={() => move(i, 1)}
									className={small}
									aria-label="Xuống"
								>
									↓
								</button>
								<button
									type="button"
									onClick={() => write(list.filter((_, j) => j !== i))}
									className="ml-auto text-xs font-semibold text-lotus"
								>
									Xoá mục này
								</button>
							</div>
							{field.fields.map((sub) => (
								<FieldInput
									key={sub.kind === "lang" ? sub.lang : sub.path}
									field={sub}
									item={entry}
									onChange={(nextEntry) =>
										write(list.map((e, j) => (j === i ? nextEntry : e)))
									}
								/>
							))}
						</div>
					))}
					<button
						type="button"
						onClick={() => write([...list, structuredClone(field.empty)])}
						className="rounded-full border border-dashed border-earth-500 px-4 py-1.5 text-sm font-semibold text-earth-700"
					>
						＋ Thêm {field.itemLabel.toLowerCase()}
					</button>
				</fieldset>
			);
		}
		case "select":
			return (
				<label className="block">
					<span className={lbl}>{field.label}</span>
					<select
						value={(getPath(item, field.path) as string) ?? ""}
						onChange={(e) => set(field.path, e.target.value || undefined)}
						className={input}
					>
						{field.options.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</label>
			);
		case "villageSelect":
			return (
				<label className="block">
					<span className={lbl}>{field.label}</span>
					<select
						value={(getPath(item, field.path) as string) ?? ""}
						onChange={(e) => set(field.path, e.target.value || undefined)}
						className={input}
					>
						<option value="">— Không gắn thôn —</option>
						{villages.map((v) => (
							<option key={v.id} value={v.id}>
								{v.name.vi}
							</option>
						))}
					</select>
				</label>
			);
		case "number": {
			const v = getPath(item, field.path) as number | undefined;
			return (
				<label className="block">
					<span className={lbl}>{field.label}</span>
					<input
						type="number"
						min={field.min}
						max={field.max}
						value={v ?? ""}
						onChange={(e) =>
							set(
								field.path,
								e.target.value === ""
									? field.optional
										? undefined
										: 0
									: Number(e.target.value),
							)
						}
						className={input}
					/>
				</label>
			);
		}
		case "checkbox":
			return (
				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={Boolean(getPath(item, field.path))}
						onChange={(e) => set(field.path, e.target.checked)}
						className="h-4 w-4 accent-rice-700"
					/>
					{field.label}
				</label>
			);
		case "coords": {
			const v = getPath(item, field.path) as [number, number] | undefined;
			const update = (i: 0 | 1, raw: string) => {
				if (raw === "" && field.optional) return set(field.path, undefined);
				const next: [number, number] = v ? [...v] : [19.9421, 105.8195];
				next[i] = Number(raw);
				set(field.path, next);
			};
			return (
				<fieldset className="grid grid-cols-2 gap-2">
					<legend className={lbl}>{field.label}</legend>
					<input
						type="number"
						step="0.0001"
						aria-label="Vĩ độ"
						value={v?.[0] ?? ""}
						onChange={(e) => update(0, e.target.value)}
						className={input}
					/>
					<input
						type="number"
						step="0.0001"
						aria-label="Kinh độ"
						value={v?.[1] ?? ""}
						onChange={(e) => update(1, e.target.value)}
						className={input}
					/>
				</fieldset>
			);
		}
		case "lines": {
			const list =
				(getPath(item, field.path) as
					| { vi: string; en: string }[]
					| undefined) ?? [];
			const write = (l: "vi" | "en", text: string) => {
				const lines = text.split("\n");
				const other = l === "vi" ? "en" : "vi";
				const n = Math.max(lines.length, list.length);
				const next = Array.from({ length: n }, (_, i) => ({
					[l]: lines[i] ?? "",
					[other]: list[i]?.[other] ?? "",
				})) as { vi: string; en: string }[];
				set(
					field.path,
					next.filter((x) => x.vi.trim() || x.en.trim()),
				);
			};
			return (
				<fieldset className="grid gap-2 sm:grid-cols-2">
					<legend className={lbl}>
						{field.label} <span className="font-normal">— {field.hint}</span>
					</legend>
					{(["vi", "en"] as const).map((l) => (
						<textarea
							key={l}
							rows={4}
							aria-label={`${field.label} (${l})`}
							defaultValue={list.map((x) => x[l]).join("\n")}
							onBlur={(e) => write(l, e.target.value)}
							className={input}
						/>
					))}
				</fieldset>
			);
		}
		case "lang": {
			const block = getPath(item, field.lang) as Obj | undefined;
			if (!block) {
				return (
					<button
						type="button"
						onClick={() =>
							set(
								field.lang,
								Object.fromEntries(field.fields.map((f) => [f.key, ""])),
							)
						}
						className="rounded-full border border-dashed border-earth-500 px-4 py-2 text-sm font-semibold text-earth-700"
					>
						＋ Thêm bản {field.lang === "en" ? "tiếng Anh" : "tiếng Việt"}
					</button>
				);
			}
			return (
				<fieldset className="space-y-2 rounded-xl border border-earth-300/60 p-3">
					<legend className="px-1 text-sm font-semibold text-rice-900">
						{field.lang === "vi" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}
						{field.optional && (
							<button
								type="button"
								onClick={() => set(field.lang, undefined)}
								className="ml-3 text-xs font-normal text-lotus underline"
							>
								bỏ bản này
							</button>
						)}
					</legend>
					{field.fields.map((f) => (
						<div key={f.key}>
							<span className={lbl} aria-hidden="true">
								{f.label}
							</span>
							{f.rows ? (
								<textarea
									rows={f.rows}
									aria-label={f.label}
									value={String(block[f.key] ?? "")}
									onChange={(e) =>
										set(`${field.lang}.${f.key}`, e.target.value)
									}
									className={`${input} ${f.rows > 4 ? "font-mono" : ""}`}
								/>
							) : (
								<input
									aria-label={f.label}
									value={String(block[f.key] ?? "")}
									onChange={(e) =>
										set(`${field.lang}.${f.key}`, e.target.value)
									}
									className={input}
								/>
							)}
						</div>
					))}
				</fieldset>
			);
		}
	}
}

const SAVE_ERRORS: Record<string, string> = {
	not_imported: "Cần nhập nội dung từ file trước khi sửa.",
	duplicate: "Đã có mục khác dùng mã / đường dẫn này.",
	invalid: "Thông tin chưa hợp lệ:",
};

export function ContentEditor({
	collection,
	state,
}: {
	collection: CollectionName;
	state: ContentAdminState;
}) {
	const router = useRouter();
	const [editing, setEditing] = useState<{
		item: Obj;
		previousId?: string;
	} | null>(null);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<{
		tone: "ok" | "error";
		text: string;
		issues?: string[];
	} | null>(null);
	const fields = FIELDS[collection];
	const singleton = isSingleton(collection);
	const items = [...state.items].sort((a, b) =>
		collection === "news"
			? String(b.date).localeCompare(String(a.date))
			: itemTitle(collection, a).localeCompare(itemTitle(collection, b), "vi"),
	);

	async function refresh(text: string) {
		forceNextSync();
		setMessage({ tone: "ok", text });
		await router.invalidate();
	}

	async function save() {
		if (!editing) return;
		setBusy(true);
		setMessage(null);
		try {
			const res = await saveContentItem({
				data: {
					collection,
					previousId: editing.previousId,
					data: editing.item as JsonObject,
				},
			});
			if (res.ok) {
				setEditing(null);
				await refresh(
					"Đã lưu. Thay đổi hiển thị trên trang trong vòng 30 giây.",
				);
			} else
				setMessage({
					tone: "error",
					text: SAVE_ERRORS[res.error],
					issues: res.issues,
				});
		} catch {
			setMessage({ tone: "error", text: "Có lỗi xảy ra." });
		} finally {
			setBusy(false);
		}
	}

	async function download() {
		const data = await exportContent();
		const url = URL.createObjectURL(
			new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
		);
		const a = Object.assign(document.createElement("a"), {
			href: url,
			download: `trieu-loc-noi-dung-${new Date().toISOString().slice(0, 10)}.json`,
		});
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div className="space-y-5">
			<nav className="flex flex-wrap gap-2" aria-label="Loại nội dung">
				{COLLECTION_NAMES.map((c) => (
					<a
						key={c}
						href={`/admin?section=content&collection=${c}`}
						className={`rounded-full px-4 py-2 text-sm font-medium ${c === collection ? "bg-rice-700 text-paper" : "border border-earth-300 text-ink-soft hover:bg-rice-100"}`}
					>
						{COLLECTION_LABELS[c]}
					</a>
				))}
				<button
					type="button"
					onClick={() => void download()}
					className="ml-auto rounded-full border border-earth-300 px-4 py-2 text-sm font-semibold"
				>
					⤓ Tải bản sao lưu (JSON)
				</button>
			</nav>

			{state.missing.length > 0 && (
				<div className="rounded-2xl border border-earth-500/50 bg-earth-300/20 p-5">
					<p className="font-semibold text-rice-900">
						{state.missing.length === COLLECTION_NAMES.length
							? "Nội dung vẫn đang lấy từ các file trong mã nguồn."
							: "Một số loại nội dung vẫn đang lấy từ file."}
					</p>
					<p className="mt-1 text-sm text-ink-soft">
						Chưa nhập:{" "}
						{state.missing.map((c) => COLLECTION_LABELS[c]).join(", ")}. Bấm nút
						dưới để sao chép một lần các mục này vào cơ sở dữ liệu (nội dung đã
						nhập và đã sửa trước đó không bị thay đổi). Từ đó trở đi bạn sửa
						chúng ngay tại đây.
					</p>
					<button
						type="button"
						disabled={busy}
						onClick={async () => {
							if (
								!confirm(
									"Nhập các loại nội dung còn thiếu từ file vào cơ sở dữ liệu?",
								)
							)
								return;
							setBusy(true);
							try {
								const r = await importContent();
								if (r.ok) await refresh(`Đã nhập ${r.count} mục.`);
								else
									setMessage({
										tone: "error",
										text: "Nội dung đã được nhập trước đó.",
									});
							} finally {
								setBusy(false);
							}
						}}
						className="mt-3 rounded-full bg-rice-700 px-5 py-2 text-sm font-semibold text-paper disabled:opacity-60"
					>
						{state.missing.length === COLLECTION_NAMES.length
							? "Nhập nội dung từ file"
							: "Nhập phần còn thiếu từ file"}
					</button>
				</div>
			)}

			{message && (
				<div
					role={message.tone === "error" ? "alert" : "status"}
					className={`rounded-xl px-4 py-3 text-sm ${message.tone === "error" ? "bg-lotus/15 text-lotus" : "bg-rice-100 text-rice-900"}`}
				>
					<p className="font-medium">{message.text}</p>
					{message.issues && (
						<ul className="mt-1 list-disc pl-5">
							{message.issues.map((i) => (
								<li key={i}>{i}</li>
							))}
						</ul>
					)}
				</div>
			)}

			{editing ? (
				<div className="space-y-4 rounded-2xl bg-card p-5 ring-1 ring-earth-300/50">
					<h2 className="text-lg font-semibold text-rice-900">
						{editing.previousId
							? `Sửa: ${itemTitle(collection, editing.item)}`
							: `Thêm ${COLLECTION_LABELS[collection].toLowerCase()}`}
					</h2>
					{fields.map((f) => (
						<FieldInput
							key={f.kind === "lang" ? f.lang : f.path}
							field={f}
							item={editing.item}
							onChange={(item) => setEditing({ ...editing, item })}
						/>
					))}
					<div className="flex gap-2">
						<button
							type="button"
							disabled={busy}
							onClick={() => void save()}
							className="rounded-full bg-rice-700 px-5 py-2 text-sm font-semibold text-paper disabled:opacity-60"
						>
							Lưu
						</button>
						<button
							type="button"
							onClick={() => setEditing(null)}
							className="rounded-full border border-earth-300 px-5 py-2 text-sm font-semibold"
						>
							Huỷ
						</button>
					</div>
				</div>
			) : (
				<>
					<div className="flex items-center justify-between">
						<p className="text-sm text-ink-soft">{items.length} mục</p>
						<button
							type="button"
							hidden={singleton}
							disabled={!state.imported}
							onClick={() => setEditing({ item: newItem(collection) })}
							className="rounded-full bg-rice-700 px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
						>
							＋ Thêm mới
						</button>
					</div>
					<ul className="divide-y divide-earth-300/40 rounded-2xl bg-card ring-1 ring-earth-300/50">
						{items.map((it) => {
							const id = itemId(collection, it);
							return (
								<li
									key={id}
									className="flex flex-wrap items-center gap-3 px-4 py-3"
								>
									<div className="min-w-0 flex-1">
										<p className="font-medium text-ink">
											{itemTitle(collection, it)}
										</p>
										<p className="text-xs text-ink-soft">
											{id}
											{collection === "news" && ` · ${String(it.date)}`}
											{collection === "villages" && it.sample ? " · mẫu" : ""}
										</p>
									</div>
									<button
										type="button"
										disabled={!state.imported}
										onClick={() =>
											setEditing({
												item: structuredClone(it) as Obj,
												previousId: id,
											})
										}
										className="rounded-full border border-earth-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
									>
										✎ Sửa
									</button>
									<button
										type="button"
										hidden={singleton}
										disabled={!state.imported || busy}
										onClick={async () => {
											if (!confirm(`Xoá "${itemTitle(collection, it)}"?`))
												return;
											setBusy(true);
											try {
												await deleteContentItem({ data: { collection, id } });
												await refresh("Đã xoá.");
											} finally {
												setBusy(false);
											}
										}}
										className="rounded-full px-3 py-1.5 text-sm font-semibold text-lotus hover:bg-lotus/10 disabled:opacity-50"
									>
										Xoá
									</button>
								</li>
							);
						})}
					</ul>
				</>
			)}
		</div>
	);
}
