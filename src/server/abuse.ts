import { createHash } from "node:crypto";
import { getRequestIP } from "@tanstack/react-start/server";

/** Salted hash of the visitor's IP — enough for rate limiting, never the raw address. */
export function requestIpHash() {
	const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
	return createHash("sha256")
		.update(`${process.env.ADMIN_PASSWORD ?? "trieu-loc"}:${ip}`)
		.digest("hex");
}

/** True for obvious bots: the hidden honeypot field was filled, or the form was sent inhumanly fast. */
export function looksLikeBot(
	honeypot: string | undefined,
	startedAt: number | undefined,
	minMs = 3000,
) {
	return (
		Boolean(honeypot) ||
		(startedAt !== undefined && startedAt > 0 && Date.now() - startedAt < minMs)
	);
}

/** Crude link-spam filter: more than two URLs in a short public message. */
export function tooManyLinks(text: string, max = 2) {
	return (text.match(/https?:\/\/|www\./gi) ?? []).length > max;
}
