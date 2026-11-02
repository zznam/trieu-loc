// Scheduled publishing helpers. Editors enter times in Vietnam time (UTC+7, no DST).

/** "2026-12-01T08:30" (Vietnam time, from <input type="datetime-local">) → Date. Null if invalid. */
export function vnLocalToDate(local: string): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
	const d = new Date(`${local}:00+07:00`);
	return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → "2026-12-01T08:30" in Vietnam time (for datetime-local inputs). */
export function dateToVnLocal(d: Date): string {
	return new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 16);
}

/** "8:30, 1/12/2026" — a scheduled time shown in Vietnamese, in Vietnam time. */
export function formatVnDateTime(d: Date): string {
	return d.toLocaleString("vi-VN", {
		timeZone: "Asia/Ho_Chi_Minh",
		hour: "2-digit",
		minute: "2-digit",
		day: "numeric",
		month: "numeric",
		year: "numeric",
	});
}

/** An item is live once its publish time (if any) has passed. */
export function isLive(
	publishAt: number | null | undefined,
	now = Date.now(),
): boolean {
	return publishAt == null || publishAt <= now;
}
