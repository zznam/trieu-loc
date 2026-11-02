import { useState } from "react";
import type { CollectionName } from "#/lib/content-schemas";
import { resizeImage } from "#/lib/contribute";
import { uploadContentImage } from "#/server/content";

const ERRORS: Record<string, string> = {
	unavailable:
		"Chưa cấu hình lưu ảnh (Vercel Blob). Bạn vẫn có thể dán đường dẫn ảnh.",
	invalid: "Chỉ nhận ảnh JPG, PNG hoặc WebP.",
	too_large: "Ảnh quá lớn.",
};

/** Upload (resized in the browser to ≤2000px JPEG), preview, replace or remove a photo. */
export function ImageField({
	label,
	value,
	onChange,
	collection,
	uploads,
}: {
	label: string;
	value: string | undefined;
	onChange: (url: string | undefined) => void;
	collection: CollectionName;
	uploads: boolean;
}) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function upload(file: File) {
		setBusy(true);
		setError(null);
		try {
			const resized = await resizeImage(file);
			const fd = new FormData();
			fd.set("file", resized.file);
			fd.set("collection", collection);
			const res = await uploadContentImage({ data: fd });
			if (res.ok) onChange(res.url);
			else setError(ERRORS[res.error]);
		} catch {
			setError("Không tải được ảnh lên, vui lòng thử lại.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<fieldset>
			<legend className="mb-1 block text-xs font-semibold text-ink-soft">
				{label}
			</legend>
			<div className="flex flex-wrap items-start gap-3">
				{value ? (
					<img
						src={value}
						alt=""
						className="h-28 w-40 rounded-lg object-cover ring-1 ring-earth-300"
					/>
				) : (
					<div className="grid h-28 w-40 place-items-center rounded-lg border-2 border-dashed border-earth-300 text-xs text-ink-soft">
						Chưa có ảnh
					</div>
				)}
				<div className="flex flex-col gap-2">
					{uploads && (
						<label className="cursor-pointer rounded-full bg-rice-700 px-4 py-1.5 text-center text-sm font-semibold text-paper has-[:disabled]:opacity-60">
							{busy ? "Đang tải lên…" : value ? "Đổi ảnh" : "Tải ảnh lên"}
							<input
								type="file"
								accept="image/jpeg,image/png,image/webp"
								className="sr-only"
								disabled={busy}
								aria-label={`${label}: tải ảnh lên`}
								onChange={(e) => {
									const f = e.target.files?.[0];
									e.target.value = "";
									if (f) void upload(f);
								}}
							/>
						</label>
					)}
					{value && (
						<button
							type="button"
							onClick={() => onChange(undefined)}
							className="rounded-full border border-earth-300 px-4 py-1.5 text-sm font-semibold"
						>
							Bỏ ảnh
						</button>
					)}
				</div>
			</div>
			<input
				aria-label={`${label}: đường dẫn ảnh`}
				placeholder="…hoặc dán đường dẫn ảnh (https://…)"
				value={value ?? ""}
				onChange={(e) => onChange(e.target.value || undefined)}
				className="mt-2 w-full rounded-lg border border-earth-300 bg-paper px-3 py-1.5 text-xs outline-none focus:border-rice-500"
			/>
			{error && (
				<p role="alert" className="mt-1 text-xs font-medium text-lotus">
					{error}
				</p>
			)}
		</fieldset>
	);
}
