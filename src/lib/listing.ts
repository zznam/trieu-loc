import { fold } from "./text";

/** Groups items (already sorted newest first) by the year of their ISO date. */
export function groupByYear<T extends { date: string }>(
	items: T[],
): { year: string; items: T[] }[] {
	const out: { year: string; items: T[] }[] = [];
	for (const item of items) {
		const year = item.date.slice(0, 4);
		const last = out.at(-1);
		if (last?.year === year) last.items.push(item);
		else out.push({ year, items: [item] });
	}
	return out;
}

/** Accent-insensitive "every word appears somewhere in these fields" filter. */
export function matchesQuery(query: string, ...fields: string[]): boolean {
	const terms = fold(query).split(/\s+/).filter(Boolean);
	if (terms.length === 0) return true;
	const hay = fold(fields.join(" "));
	return terms.every((t) => hay.includes(t));
}
