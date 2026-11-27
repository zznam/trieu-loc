import {
	allNews,
	allPeople,
	businesses,
	contacts,
	gallery,
	history,
	places,
	site,
	specialties,
} from "./content";
import type { CollectionName } from "./content-schemas";
import { events } from "./events";
import type { L } from "./i18n";
import { villages } from "./villages";

/**
 * The "Ra mắt" (launch) checklist in /admin: what still stands between the starter site
 * and a public launch. Content checks run on the live content (files or database);
 * setup checks come from the server (environment variables, accounts).
 */

export type CheckLevel = "required" | "recommended";

export type LaunchCheck = {
	id: string;
	group: "setup" | "content";
	level: CheckLevel;
	ok: boolean;
	title: string;
	/** What is wrong, or what is in place. */
	detail: string;
	/** Items that still need attention (names), capped by the UI. */
	items?: string[];
	/** Where to fix it in /admin → Nội dung. */
	fix?: CollectionName;
};

export type SetupState = {
	db: boolean;
	/** At least one personal account exists (the shared ADMIN_PASSWORD no longer works). */
	accounts: boolean;
	/** Collections not imported into the database yet (still read from files). */
	missingCollections: CollectionName[];
	blob: boolean;
	notify: boolean;
	verifiedSender: boolean;
	siteUrl: string;
};

export type SampleSummary = {
	collection: CollectionName;
	label: string;
	names: string[];
};

/** Everything still flagged `sample: true`, per collection. */
export function sampleSummary(): SampleSummary[] {
	const people = new Map<string, string>();
	for (const p of allPeople)
		if (p.sample && (p.lang === "vi" || !people.has(p.slug)))
			people.set(p.slug, p.name);
	const list: SampleSummary[] = [
		{
			collection: "businesses",
			label: "Cơ sở kinh doanh",
			names: businesses.filter((b) => b.sample).map((b) => b.name),
		},
		{ collection: "people", label: "Con người", names: [...people.values()] },
		{
			collection: "events",
			label: "Sự kiện",
			names: events.filter((e) => e.sample).map((e) => e.title.vi),
		},
		{
			collection: "contacts",
			label: "Danh bạ",
			names: contacts.filter((c) => c.sample).map((c) => c.name.vi),
		},
		{
			collection: "villages",
			label: "Thôn",
			names: villages.filter((v) => v.sample).map((v) => v.name.vi),
		},
	];
	return list.filter((s) => s.names.length > 0);
}

/** Phrases the starter content uses for placeholder text inside otherwise real items. */
const PLACEHOLDER_TEXT =
	/nội dung mẫu|thông tin mẫu|\(mẫu\)|\(sample\)|sample (content|listing|text)/i;

const hasPlaceholder = (...texts: (string | L | undefined)[]) =>
	texts.some((t) =>
		typeof t === "string"
			? PLACEHOLDER_TEXT.test(t)
			: t
				? PLACEHOLDER_TEXT.test(t.vi) || PLACEHOLDER_TEXT.test(t.en)
				: false,
	);

/** Items that aren't flagged as samples but still contain "(Nội dung mẫu…)" style text. */
export function placeholderTexts(): {
	collection: CollectionName;
	name: string;
}[] {
	const out: { collection: CollectionName; name: string }[] = [];
	for (const p of places)
		if (hasPlaceholder(p.name, p.body))
			out.push({ collection: "places", name: p.name.vi });
	for (const s of specialties)
		if (hasPlaceholder(s.name, s.tag, s.body))
			out.push({ collection: "specialties", name: s.name.vi });
	for (const g of gallery)
		if (hasPlaceholder(g.caption))
			out.push({ collection: "gallery", name: g.caption.vi });
	for (const n of allNews)
		if (n.lang === "vi" && hasPlaceholder(n.title, n.summary, n.markdown))
			out.push({ collection: "news", name: n.title });
	for (const t of history.timeline)
		if (hasPlaceholder(t.title, t.body))
			out.push({ collection: "history", name: t.title.vi });
	for (const t of history.traditions)
		if (hasPlaceholder(t.title, t.body))
			out.push({ collection: "history", name: t.title.vi });
	if (hasPlaceholder(history.intro, history.figure.body))
		out.push({ collection: "history", name: "Giới thiệu" });
	return out;
}

const isPlaceholderEmail = (email: string) =>
	/(^|[@.])example\.(com|org|net)$|\.example$|@example$/i.test(email.trim());

const isBareFacebook = (url: string) =>
	/^https?:\/\/(www\.)?facebook\.com\/?$/i.test(url.trim());

const isDefaultSiteUrl = (url: string) =>
	/localhost|127\.0\.0\.1|\.vercel\.app$/i.test(url.replace(/\/$/, ""));

export function launchChecklist(setup: SetupState): LaunchCheck[] {
	const samples = sampleSummary();
	const sampleCount = samples.reduce((n, s) => n + s.names.length, 0);
	const placeholders = placeholderTexts();
	const approx = places.filter((p) => p.approx);
	const noPhone = contacts.filter(
		(c) => c.group !== "emergency" && !c.phone.trim(),
	);
	const noPhoto = gallery.filter((g) => !g.src.trim());

	return [
		// ---------- Setup ----------
		{
			id: "db",
			group: "setup",
			level: "required",
			ok: setup.db,
			title: "Cơ sở dữ liệu",
			detail: setup.db
				? "DATABASE_URL đã được cấu hình."
				: "Chưa có DATABASE_URL: không nhận được đóng góp, bình luận, bản tin và không sửa được nội dung trên web. Vercel → Storage → Neon.",
		},
		{
			id: "accounts",
			group: "setup",
			level: "required",
			ok: setup.accounts,
			title: "Tài khoản chủ sở hữu",
			detail: setup.accounts
				? "Đã có tài khoản riêng; mật khẩu chung không còn dùng được."
				: "Vẫn đăng nhập bằng mật khẩu chung ADMIN_PASSWORD. Vào Tài khoản → tạo tài khoản chủ sở hữu.",
		},
		{
			id: "imported",
			group: "setup",
			level: "recommended",
			ok: setup.db && setup.missingCollections.length === 0,
			title: "Nội dung đã nhập vào cơ sở dữ liệu",
			detail: !setup.db
				? "Cần cơ sở dữ liệu trước."
				: setup.missingCollections.length === 0
					? "Mọi mục nội dung đều sửa được trong Nội dung."
					: `${setup.missingCollections.length} mục vẫn đọc từ file (chỉ xem): bấm “Nhập phần còn thiếu từ file” trong Nội dung.`,
			items: setup.missingCollections,
			fix: setup.missingCollections[0],
		},
		{
			id: "blob",
			group: "setup",
			level: "recommended",
			ok: setup.blob,
			title: "Lưu ảnh (Vercel Blob)",
			detail: setup.blob
				? "Bà con gửi được ảnh; biên tập viên tải được ảnh lên."
				: "Chưa có BLOB_READ_WRITE_TOKEN: không nhận ảnh đóng góp và không tải ảnh lên được. Vercel → Storage → Blob.",
		},
		{
			id: "notify",
			group: "setup",
			level: "recommended",
			ok: setup.notify,
			title: "Email báo đóng góp mới",
			detail: setup.notify
				? "Biên tập viên nhận email khi có đóng góp, lời nhắn, bình luận mới."
				: "Chưa có RESEND_API_KEY + NOTIFY_EMAIL: phải tự vào trang quản trị để xem có gì mới.",
		},
		{
			id: "sender",
			group: "setup",
			level: "recommended",
			ok: setup.verifiedSender,
			title: "Tên miền gửi bản tin",
			detail: setup.verifiedSender
				? "NOTIFY_FROM đã đặt: bản tin gửi được tới người đăng ký."
				: "Chưa có NOTIFY_FROM với tên miền đã xác minh trong Resend: bản tin chỉ gửi được tới email của chính tài khoản Resend.",
		},
		{
			id: "siteUrl",
			group: "setup",
			level: "recommended",
			ok: !isDefaultSiteUrl(setup.siteUrl),
			title: "Tên miền riêng (SITE_URL)",
			detail: isDefaultSiteUrl(setup.siteUrl)
				? `Đường dẫn chia sẻ, sitemap và thẻ SEO đang dùng ${setup.siteUrl}. Gắn tên miền riêng rồi đặt SITE_URL và triển khai lại.`
				: `Đường dẫn chia sẻ và sitemap dùng ${setup.siteUrl}.`,
		},
		// ---------- Content ----------
		{
			id: "hideSamples",
			group: "content",
			level: "required",
			ok: sampleCount === 0 || Boolean(site.hideSamples),
			title: "Ẩn nội dung mẫu",
			detail:
				sampleCount === 0
					? "Không còn mục nào đánh dấu là mẫu."
					: site.hideSamples
						? `Đang bật: ${sampleCount} mục mẫu đã bị ẩn khỏi trang công khai, tìm kiếm và sitemap.`
						: `${sampleCount} mục mẫu đang hiện trên trang (kèm ghi chú “mẫu”). Thay bằng thông tin thật, xoá đi, hoặc bật “Ẩn mọi nội dung mẫu” trong Thông tin chung.`,
			fix: "site",
		},
		...samples.map(
			(s): LaunchCheck => ({
				id: `samples-${s.collection}`,
				group: "content",
				level: "recommended",
				ok: false,
				title: `${s.label}: ${s.names.length} mục mẫu`,
				detail:
					s.collection === "villages"
						? "Đặt tên thật, viết giới thiệu rồi bỏ đánh dấu “Thông tin mẫu”."
						: "Thay bằng thông tin thật rồi bỏ đánh dấu “Thông tin mẫu”, hoặc xoá đi.",
				items: s.names,
				fix: s.collection,
			}),
		),
		{
			id: "email",
			group: "content",
			level: "required",
			ok: !isPlaceholderEmail(site.contact.email),
			title: "Email liên hệ",
			detail: isPlaceholderEmail(site.contact.email)
				? `Chân trang đang ghi ${site.contact.email} (địa chỉ mẫu). Sửa trong Thông tin chung.`
				: `Chân trang ghi ${site.contact.email}.`,
			fix: "site",
		},
		{
			id: "facebook",
			group: "content",
			level: "recommended",
			ok: !isBareFacebook(site.contact.facebook),
			title: "Trang Facebook",
			detail: isBareFacebook(site.contact.facebook)
				? "Liên kết Facebook chỉ trỏ tới facebook.com. Điền trang của xã / nhóm đồng hương."
				: "Đã có liên kết Facebook riêng.",
			fix: "site",
		},
		{
			id: "placeholderText",
			group: "content",
			level: "recommended",
			ok: placeholders.length === 0,
			title: "Đoạn văn còn ghi “nội dung mẫu”",
			detail:
				placeholders.length === 0
					? "Không còn đoạn văn nào ghi là mẫu."
					: "Những mục này có thật nhưng còn câu “(Nội dung mẫu…)” cần viết lại.",
			items: placeholders.map((p) => p.name),
			fix: placeholders[0]?.collection,
		},
		{
			id: "coords",
			group: "content",
			level: "recommended",
			ok: approx.length === 0,
			title: "Toạ độ địa danh",
			detail:
				approx.length === 0
					? "Mọi địa danh đã có toạ độ chính xác."
					: `${approx.length} địa danh còn vị trí gần đúng trên bản đồ. Kiểm tra rồi bỏ đánh dấu “Vị trí gần đúng”.`,
			items: approx.map((p) => p.name.vi),
			fix: "places",
		},
		{
			id: "phones",
			group: "content",
			level: "recommended",
			ok: noPhone.length === 0,
			title: "Số điện thoại trong danh bạ",
			detail:
				noPhone.length === 0
					? "Mọi cơ quan trong danh bạ đều có số điện thoại."
					: `${noPhone.length} mục danh bạ hiện “đang cập nhật”.`,
			items: noPhone.map((c) => c.name.vi),
			fix: "contacts",
		},
		{
			id: "gallery",
			group: "content",
			level: "recommended",
			ok: noPhoto.length === 0,
			title: "Ảnh thư viện",
			detail:
				noPhoto.length === 0
					? "Mọi ô trong thư viện ảnh đều có ảnh thật."
					: `${noPhoto.length} ô trong thư viện ảnh còn dùng hình minh hoạ.`,
			items: noPhoto.map((g) => g.caption.vi),
			fix: "gallery",
		},
	];
}

/** Ready when every required check passes. */
export const isLaunchReady = (checks: LaunchCheck[]) =>
	checks.every((c) => c.ok || c.level !== "required");
