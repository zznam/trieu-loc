/**
 * CSV for spreadsheets (Excel, Google Sheets). Starts with a UTF-8 BOM so Excel shows
 * Vietnamese correctly, quotes every field, and neutralises formula injection
 * (cells starting with = + - @ are prefixed with a quote).
 */
export function toCsv(
	header: string[],
	rows: (string | number | boolean | null | undefined)[][],
): string {
	const cell = (v: string | number | boolean | null | undefined) => {
		let s = v == null ? "" : String(v);
		if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
		return `"${s.replace(/"/g, '""')}"`;
	};
	return `﻿${[header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n")}\r\n`;
}

/** Triggers a browser download of `text` as a file. */
export function downloadText(
	filename: string,
	text: string,
	type = "text/csv",
) {
	const url = URL.createObjectURL(
		new Blob([text], { type: `${type};charset=utf-8` }),
	);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.append(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
