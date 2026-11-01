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
