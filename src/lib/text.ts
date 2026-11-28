/**
 * Accent-insensitive folding that keeps string length: every character maps to exactly
 * one character, so match positions in the folded text are valid in the original.
 * "Đền Bà Triệu" → "den ba trieu".
 */
export function fold(s: string): string {
	let out = "";
	// Iterate UTF-16 units (not code points) so the output length always equals the input length.
	for (let i = 0; i < s.length; i++) {
		const ch = s[i];
		const base = ch.normalize("NFD")[0] ?? ch;
		out += base === "đ" || base === "Đ" ? "d" : base.toLowerCase();
	}
	return out;
}

/** Average adult reading speed used for the "min read" label, in words per minute. */
export const WORDS_PER_MINUTE = 200;

/**
 * Estimated reading time in whole minutes (at least 1) for Markdown or plain text.
 * Code, images, link targets, HTML tags and Markdown punctuation are not counted as words.
 */
export function readingMinutes(text: string): number {
	const words = text
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/<[^>]+>/g, " ")
		.replace(/[#>*_`~|-]+/g, " ")
		.split(/\s+/)
		.filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
	return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
