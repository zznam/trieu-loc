// New-submission emails via Resend (https://resend.com). Off until RESEND_API_KEY and
// NOTIFY_EMAIL are set. Failures are logged and never affect the visitor's submission.

export function isNotifyConfigured() {
	return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL);
}

const KIND_VI: Record<string, string> = {
	story: "Câu chuyện, ký ức",
	photo: "Ảnh quê hương",
	business: "Giới thiệu cơ sở kinh doanh",
	event: "Sự kiện sắp tới",
	correction: "Góp ý, sửa thông tin",
	other: "Khác",
	guestbook: "Sổ lưu bút",
	comment: "Bình luận",
};

const escapeHtml = (s: string) =>
	s.replace(
		/[&<>"']/g,
		(c) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				c
			] ?? c,
	);

export type NewSubmission = {
	kind: string;
	title: string;
	message: string;
	name: string;
	village: string;
	contact: string;
	lang: string;
	consent: boolean;
	photoCount: number;
};

export async function notifyNewSubmission(s: NewSubmission): Promise<boolean> {
	if (!isNotifyConfigured()) return false;
	const adminUrl = `${__SITE_URL__}/admin`;
	const kind = KIND_VI[s.kind] ?? s.kind;
	const rows: [string, string][] = [
		["Loại", kind],
		["Người gửi", s.name],
		["Thôn / nơi ở", s.village || "—"],
		["Liên hệ", s.contact || "—"],
		["Ngôn ngữ", s.lang.toUpperCase()],
		["Đồng ý đăng", s.consent ? "Có" : "Không"],
		["Ảnh kèm theo", String(s.photoCount)],
	];
	const text = [
		`Có đóng góp mới trên trang Triệu Lộc: "${s.title}"`,
		"",
		...rows.map(([k, v]) => `${k}: ${v}`),
		"",
		s.message,
		"",
		`Xem và duyệt: ${adminUrl}`,
	].join("\n");
	const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#23361a">
<p style="font-size:13px;color:#7a4f22;text-transform:uppercase;letter-spacing:.08em;margin:0">Đóng góp mới · ${escapeHtml(kind)}</p>
<h2 style="font-family:Georgia,serif;margin:6px 0 16px">${escapeHtml(s.title)}</h2>
<table style="font-size:14px;border-collapse:collapse">${rows
		.map(
			([k, v]) =>
				`<tr><td style="padding:2px 12px 2px 0;color:#5b5747">${escapeHtml(k)}</td><td style="padding:2px 0"><strong>${escapeHtml(v)}</strong></td></tr>`,
		)
		.join("")}</table>
<p style="white-space:pre-wrap;background:#faf6ec;border-radius:12px;padding:12px 14px;margin:16px 0">${escapeHtml(s.message)}</p>
<p><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#3f5f23;color:#faf6ec;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">Mở trang quản trị</a></p>
</div>`;

	try {
		const res = await fetch(
			process.env.RESEND_API_URL ?? "https://api.resend.com/emails",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					// onboarding@resend.dev works without a verified domain (delivers to your own Resend account email).
					from: process.env.NOTIFY_FROM || "Triệu Lộc <onboarding@resend.dev>",
					to: process.env.NOTIFY_EMAIL?.split(",").map((e) => e.trim()),
					// Replying goes straight to the sender when they left an email address.
					...(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.contact)
						? { reply_to: s.contact }
						: {}),
					subject: `[Triệu Lộc] Đóng góp mới: ${s.title}`.slice(0, 200),
					text,
					html,
				}),
				signal: AbortSignal.timeout(5000),
			},
		);
		if (!res.ok) {
			console.error(
				"Resend error",
				res.status,
				await res.text().catch(() => ""),
			);
			return false;
		}
		return true;
	} catch (err) {
		console.error("notifyNewSubmission failed", err);
		return false;
	}
}
