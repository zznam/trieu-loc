// Thin wrapper around Resend's REST API (https://resend.com/docs/api-reference).

export function isEmailConfigured() {
	return Boolean(process.env.RESEND_API_KEY);
}

/** A verified sender domain is needed to email anyone other than the Resend account owner. */
export function hasVerifiedSender() {
	return Boolean(process.env.NOTIFY_FROM);
}

export const fromAddress = () =>
	process.env.NOTIFY_FROM || "Triệu Lộc <onboarding@resend.dev>";

export type Email = {
	to: string[];
	subject: string;
	html: string;
	text: string;
	replyTo?: string;
	headers?: Record<string, string>;
};

const base = () =>
	process.env.RESEND_API_URL?.replace(/\/emails$/, "") ??
	"https://api.resend.com";

function payload(e: Email) {
	return {
		from: fromAddress(),
		to: e.to,
		subject: e.subject.slice(0, 200),
		html: e.html,
		text: e.text,
		...(e.replyTo ? { reply_to: e.replyTo } : {}),
		...(e.headers ? { headers: e.headers } : {}),
	};
}

async function post(path: string, body: unknown, timeoutMs: number) {
	const res = await fetch(`${base()}${path}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(timeoutMs),
	});
	if (!res.ok)
		throw new Error(
			`Resend ${res.status}: ${await res.text().catch(() => "")}`,
		);
	return res;
}

/** Sends one email. Returns false (and logs) on failure instead of throwing. */
export async function sendEmail(e: Email, timeoutMs = 5000): Promise<boolean> {
	if (!isEmailConfigured()) return false;
	try {
		await post("/emails", payload(e), timeoutMs);
		return true;
	} catch (err) {
		console.error("sendEmail failed", err);
		return false;
	}
}

/** Sends many personalised emails, 100 per request (Resend's batch limit). Returns how many failed. */
export async function sendBatch(
	emails: Email[],
): Promise<{ sent: number; failed: number }> {
	let sent = 0;
	let failed = 0;
	for (let i = 0; i < emails.length; i += 100) {
		const chunk = emails.slice(i, i + 100);
		try {
			await post("/emails/batch", chunk.map(payload), 20000);
			sent += chunk.length;
		} catch (err) {
			console.error("sendBatch chunk failed", err);
			failed += chunk.length;
		}
	}
	return { sent, failed };
}

export const escapeHtml = (s: string) =>
	s.replace(
		/[&<>"']/g,
		(c) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				c
			] ?? c,
	);
