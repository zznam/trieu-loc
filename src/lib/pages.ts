import type { L } from "./i18n";

/**
 * Text for the static pages (visitor guide, privacy & rules). Kept in code rather than the
 * content editor because it changes rarely and links to other pages.
 */

export type GuideSection = {
	id: string;
	icon: string;
	title: L;
	items: L[];
	/** Optional link to another page of the site ("/$lang/food"). */
	link?: { to: string; label: L };
};

export const GETTING_HERE: L[] = [
	{
		vi: "Từ TP Thanh Hoá: đi theo Quốc lộ 1 về phía bắc khoảng 18 km, Quốc lộ 1 chạy qua địa bàn xã.",
		en: "From Thanh Hóa city: head north on National Highway 1 for about 18 km — the highway runs through the commune.",
	},
	{
		vi: "Từ Hà Nội: khoảng 137 km theo cao tốc Bắc – Nam hoặc Quốc lộ 1, khoảng 2,5 – 3 giờ đi xe.",
		en: "From Hanoi: about 137 km via the North–South expressway or Highway 1, roughly 2.5–3 hours by car.",
	},
	{
		vi: "Gần nhất có ga Thanh Hoá và sân bay Thọ Xuân; từ đó đi taxi hoặc xe khách về Triệu Lộc.",
		en: "The nearest rail station is Thanh Hóa, and the nearest airport is Thọ Xuân; take a taxi or bus from there.",
	},
];

export const VISITOR_GUIDE: GuideSection[] = [
	{
		id: "getting-here",
		icon: "🚌",
		title: { vi: "Đường đến Triệu Lộc", en: "Getting here" },
		items: GETTING_HERE,
		link: {
			to: "/$lang/places",
			label: { vi: "Bản đồ địa danh", en: "Map of places" },
		},
	},
	{
		id: "when",
		icon: "🗓️",
		title: { vi: "Nên đến khi nào", en: "When to come" },
		items: [
			{
				vi: "Lễ hội đền Bà Triệu (21 – 24 tháng 2 âm lịch, thường rơi vào tháng 3 – 4 dương lịch) là dịp đông vui nhất trong năm.",
				en: "The Bà Triệu temple festival (days 21–24 of the 2nd lunar month, usually March–April) is the liveliest time of the year.",
			},
			{
				vi: "Mùa lúa chín (tháng 5 – 6 và tháng 9 – 10) đồng quê vàng rực, đẹp cho ảnh.",
				en: "Rice harvests (May–June and September–October) turn the fields gold — beautiful for photos.",
			},
			{
				vi: "Mùa hè nắng nóng, có thể có bão vào tháng 8 – 10; xem dự báo thời tiết trước khi đi.",
				en: "Summers are hot and storms are possible in August–October; check the forecast before you travel.",
			},
		],
		link: {
			to: "/$lang/events",
			label: { vi: "Lịch sự kiện", en: "Events calendar" },
		},
	},
	{
		id: "temple",
		icon: "🏯",
		title: { vi: "Khi vào đền", en: "Visiting the temple" },
		items: [
			{
				vi: "Ăn mặc kín đáo, lịch sự; bỏ mũ khi vào trong điện thờ.",
				en: "Dress modestly and take off hats inside the shrine.",
			},
			{
				vi: "Giữ yên lặng, không chạm vào đồ thờ; hỏi ban quản lý trước khi chụp ảnh bên trong.",
				en: "Keep your voice down and don't touch the altar objects; ask the site staff before taking photos inside.",
			},
			{
				vi: "Lăng Bà Triệu nằm trên núi Tùng: mang giày đi bộ và nước uống, nhất là mùa hè.",
				en: "Lady Triệu's tomb is up on Mount Tùng: wear walking shoes and bring water, especially in summer.",
			},
			{
				vi: "Dịp lễ hội rất đông: giữ gìn tư trang, đi sớm để có chỗ gửi xe.",
				en: "Festival days are crowded: keep an eye on your belongings and arrive early for parking.",
			},
		],
		link: {
			to: "/$lang/history",
			label: { vi: "Lịch sử & Văn hoá", en: "History & Culture" },
		},
	},
	{
		id: "food",
		icon: "🍲",
		title: { vi: "Ăn gì, mua gì", en: "Food and gifts" },
		items: [
			{
				vi: "Nem chua, bánh gai, mắm tép là quà quê xứ Thanh dễ mang đi xa.",
				en: "Nem chua, bánh gai and shrimp paste are Thanh Hóa specialties that travel well.",
			},
			{
				vi: "Quán ăn và cơ sở địa phương có trong danh bạ — gọi trước vào ngày lễ.",
				en: "Local eateries and shops are in the directory — call ahead on festival days.",
			},
		],
		link: {
			to: "/$lang/food",
			label: { vi: "Đặc sản & cơ sở", en: "Food & local business" },
		},
	},
	{
		id: "help",
		icon: "☎️",
		title: { vi: "Khi cần giúp đỡ", en: "If you need help" },
		items: [
			{
				vi: "Khẩn cấp: Công an 113 · Cứu hoả 114 · Cấp cứu 115.",
				en: "Emergencies: police 113 · fire 114 · ambulance 115.",
			},
			{
				vi: "Số của UBND xã, trạm y tế và ban quản lý di tích có ở trang Thông tin hữu ích.",
				en: "Numbers for the commune office, health station and relic-site board are on the Useful info page.",
			},
		],
		link: {
			to: "/$lang/info",
			label: { vi: "Thông tin hữu ích", en: "Useful info" },
		},
	},
];

export const PRIVACY_UPDATED = "2026-11-27";

export const PRIVACY: { id: string; title: L; items: L[] }[] = [
	{
		id: "collect",
		title: { vi: "Chúng tôi thu thập gì", en: "What we collect" },
		items: [
			{
				vi: "Khi bạn gửi đóng góp, lời nhắn hay bình luận: những gì bạn điền (tên, nơi ở, nội dung, ảnh, cách liên lạc nếu có).",
				en: "When you send a contribution, guestbook message or comment: what you type in (name, where you live, text, photos, contact details if given).",
			},
			{
				vi: "Khi đăng ký bản tin: email và ngôn ngữ bạn chọn.",
				en: "When you subscribe to the newsletter: your email and chosen language.",
			},
			{
				vi: "Để chống spam: một mã băm (không thể đảo ngược) của địa chỉ IP, không lưu địa chỉ IP thật.",
				en: "To stop spam: a one-way hash of your IP address — never the address itself.",
			},
			{
				vi: "Thống kê lượt xem của Vercel Analytics không dùng cookie và không nhận diện cá nhân.",
				en: "Vercel Analytics visit counts use no cookies and don't identify you.",
			},
		],
	},
	{
		id: "use",
		title: { vi: "Dùng vào việc gì", en: "How it is used" },
		items: [
			{
				vi: "Đóng góp chỉ được đăng khi bạn đồng ý và sau khi ban biên tập duyệt; cách liên lạc của bạn không bao giờ hiện trên trang.",
				en: "Contributions are published only with your consent and after review; your contact details are never shown on the site.",
			},
			{
				vi: "Email bản tin chỉ dùng để gửi bản tin hằng tháng; mỗi thư đều có liên kết huỷ đăng ký.",
				en: "Newsletter emails are used only for the monthly newsletter; every issue has an unsubscribe link.",
			},
			{
				vi: "Không bán, không chia sẻ dữ liệu cho bên thứ ba ngoài các dịch vụ vận hành trang (Vercel, Neon, Resend).",
				en: "Nothing is sold or shared beyond the services that run the site (Vercel, Neon, Resend).",
			},
		],
	},
	{
		id: "rights",
		title: { vi: "Quyền của bạn", en: "Your choices" },
		items: [
			{
				vi: "Muốn sửa hoặc gỡ nội dung bạn đã gửi, hãy dùng mục Góp ý sửa thông tin hoặc gửi email cho ban biên tập.",
				en: "To correct or remove something you sent, use “Suggest an edit” or email the editors.",
			},
			{
				vi: "Huỷ đăng ký bản tin bất cứ lúc nào bằng liên kết cuối mỗi thư.",
				en: "Unsubscribe from the newsletter any time with the link at the bottom of each email.",
			},
		],
	},
	{
		id: "guidelines",
		title: { vi: "Nội quy khi viết lên trang", en: "Community rules" },
		items: [
			{
				vi: "Tôn trọng người khác; không xúc phạm, kỳ thị hay công kích cá nhân.",
				en: "Be respectful; no insults, discrimination or personal attacks.",
			},
			{
				vi: "Không quảng cáo, không đăng nhiều đường link.",
				en: "No advertising or lists of links.",
			},
			{
				vi: "Không đăng số điện thoại, địa chỉ hay ảnh của người khác khi chưa được đồng ý.",
				en: "Don't post other people's phone numbers, addresses or photos without their permission.",
			},
			{
				vi: "Chỉ gửi ảnh do bạn chụp hoặc được phép dùng.",
				en: "Only send photos you took or are allowed to share.",
			},
			{
				vi: "Ban biên tập có thể không duyệt hoặc gỡ nội dung vi phạm.",
				en: "Editors may decline or remove posts that break these rules.",
			},
		],
	},
];
