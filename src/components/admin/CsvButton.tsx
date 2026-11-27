import { useState } from "react";
import { downloadText } from "#/lib/csv";

/** Button that fetches a CSV from a server function and downloads it. */
export function CsvButton({
	label,
	load,
	disabled,
}: {
	label: string;
	load: () => Promise<{ filename: string; csv: string }>;
	disabled?: boolean;
}) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState(false);
	return (
		<span className="inline-flex items-center gap-2">
			<button
				type="button"
				disabled={busy || disabled}
				onClick={async () => {
					setBusy(true);
					setError(false);
					try {
						const { filename, csv } = await load();
						downloadText(filename, csv);
					} catch {
						setError(true);
					} finally {
						setBusy(false);
					}
				}}
				className="rounded-full border border-earth-300 px-3 py-1.5 text-sm font-semibold text-ink disabled:opacity-50"
			>
				⤓ {busy ? "Đang tạo…" : label}
			</button>
			{error && (
				<span role="alert" className="text-xs text-lotus">
					Không tải được, thử lại.
				</span>
			)}
		</span>
	);
}
