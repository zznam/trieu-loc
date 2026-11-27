/** Social share targets offered next to articles, profiles and village pages. */
export type ShareTarget = "facebook" | "zalo" | "x" | "email";

export type ShareLink = { target: ShareTarget; label: string; href: string };

/**
 * Builds share URLs for a page. Pure so it can be unit-tested and rendered on the server;
 * the native share sheet and copy-to-clipboard are handled in the component.
 */
export function buildShareLinks(url: string, title: string): ShareLink[] {
	const u = encodeURIComponent(url);
	const text = encodeURIComponent(title);
	return [
		{
			target: "facebook",
			label: "Facebook",
			href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
		},
		{
			target: "zalo",
			label: "Zalo",
			href: `https://sp.zalo.me/share_to_zalo?url=${u}`,
		},
		{
			target: "x",
			label: "X",
			href: `https://twitter.com/intent/tweet?url=${u}&text=${text}`,
		},
		{
			target: "email",
			label: "Email",
			href: `mailto:?subject=${text}&body=${encodeURIComponent(`${title}\n\n${url}`)}`,
		},
	];
}
