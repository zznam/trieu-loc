export const LANGS = ["vi", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "vi";

/** A bilingual string as stored in content files. */
export type L = { vi: string; en: string };

export function isLang(value: string): value is Lang {
	return (LANGS as readonly string[]).includes(value);
}

export function pick(lang: Lang, value: L): string {
	return value[lang] || value.vi;
}

const dict = {
	"nav.home": { vi: "Trang chủ", en: "Home" },
	"nav.history": { vi: "Lịch sử & Văn hoá", en: "History & Culture" },
	"nav.places": { vi: "Địa danh", en: "Places" },
	"nav.food": { vi: "Đặc sản & Cơ sở", en: "Food & Local Business" },
	"nav.people": { vi: "Con người", en: "People" },
	"nav.events": { vi: "Sự kiện", en: "Events" },
	"nav.news": { vi: "Tin tức", en: "News" },
	"nav.gallery": { vi: "Thư viện ảnh", en: "Gallery" },
	"nav.menu": { vi: "Menu", en: "Menu" },
	"theme.toDark": {
		vi: "Chuyển sang giao diện tối",
		en: "Switch to dark mode",
	},
	"theme.toLight": {
		vi: "Chuyển sang giao diện sáng",
		en: "Switch to light mode",
	},
	"lang.switch": { vi: "English", en: "Tiếng Việt" },
	"home.kicker": {
		vi: "Xã Triệu Lộc · Tỉnh Thanh Hoá",
		en: "Triệu Lộc Commune · Thanh Hóa Province",
	},
	"home.title": {
		vi: "Quê hương Bà Triệu, bên dòng sông Lèn",
		en: "Homeland of Lady Triệu, on the banks of the Lèn River",
	},
	"home.lead": {
		vi: "Nơi những cánh đồng lúa trải dài dưới chân núi Tùng, nơi khí phách người con gái đất Thanh còn vang vọng qua gần hai nghìn năm.",
		en: "Where rice fields stretch beneath Mount Tùng, and the spirit of Thanh Hóa's most famous daughter still echoes after nearly two thousand years.",
	},
	"home.cta.places": { vi: "Khám phá địa danh", en: "Explore places" },
	"home.cta.history": { vi: "Tìm hiểu lịch sử", en: "Read the history" },
	"home.stats.area": { vi: "Diện tích", en: "Area" },
	"home.stats.pop": { vi: "Dân số (2024)", en: "Population (2024)" },
	"home.stats.villages": { vi: "Thôn", en: "Villages" },
	"home.stats.distance": { vi: "Cách TP Thanh Hoá", en: "From Thanh Hóa city" },
	"home.highlights": { vi: "Điểm nhấn", en: "Highlights" },
	"home.latest": { vi: "Tin mới", en: "Latest news" },
	"home.allNews": { vi: "Xem tất cả tin", en: "All news" },
	"home.festival.title": {
		vi: "Lễ hội đền Bà Triệu",
		en: "Bà Triệu Temple Festival",
	},
	"home.festival.when": {
		vi: "21 – 24 tháng 2 âm lịch hằng năm",
		en: "21st – 24th of the 2nd lunar month, every year",
	},
	"home.festival.body": {
		vi: "Di sản văn hoá phi vật thể quốc gia với nghi thức rước kiệu, tế lễ và tái hiện cuộc khởi nghĩa năm 248.",
		en: "A national intangible cultural heritage, with palanquin processions, rites and a re-enactment of the uprising of 248 AD.",
	},
	"countdown.days": { vi: "Ngày", en: "Days" },
	"countdown.hours": { vi: "Giờ", en: "Hours" },
	"countdown.minutes": { vi: "Phút", en: "Min" },
	"countdown.year": { vi: "Năm", en: "Year of" },
	"countdown.ongoing": {
		vi: "Lễ hội đang diễn ra",
		en: "The festival is on now",
	},
	"countdown.addToCalendar": { vi: "Thêm vào lịch", en: "Add to calendar" },
	"common.readMore": { vi: "Đọc tiếp", en: "Read more" },
	"common.back": { vi: "Quay lại", en: "Back" },
	"common.sample": {
		vi: "Nội dung mẫu — cần được bổ sung và kiểm chứng.",
		en: "Sample content — to be completed and verified.",
	},
	"common.photoSoon": { vi: "Ảnh sẽ được cập nhật", en: "Photo coming soon" },
	"common.approxLocation": {
		vi: "Vị trí gần đúng",
		en: "Approximate location",
	},
	"places.title": { vi: "Địa danh & Bản đồ", en: "Places & Map" },
	"places.lead": {
		vi: "Di tích, đình đền và cảnh sắc trên địa bàn xã Triệu Lộc.",
		en: "Relics, temples and landscapes across Triệu Lộc commune.",
	},
	"places.filter.all": { vi: "Tất cả", en: "All" },
	"places.howToGet": { vi: "Đường đến Triệu Lộc", en: "Getting here" },
	"places.showOnMap": { vi: "Xem trên bản đồ", en: "Show on map" },
	"places.openMap": { vi: "Mở trên Google Maps", en: "Open in Google Maps" },
	"history.title": { vi: "Lịch sử & Văn hoá", en: "History & Culture" },
	"history.timeline": { vi: "Dòng thời gian", en: "Timeline" },
	"history.figure": {
		vi: "Bà Triệu — Triệu Thị Trinh",
		en: "Lady Triệu — Triệu Thị Trinh",
	},
	"history.traditions": {
		vi: "Lễ hội & phong tục",
		en: "Festivals & traditions",
	},
	"food.title": {
		vi: "Đặc sản & Cơ sở địa phương",
		en: "Food & Local Business",
	},
	"food.lead": {
		vi: "Hương vị xứ Thanh và những cơ sở sản xuất, kinh doanh của người Triệu Lộc.",
		en: "Flavours of Thanh Hóa and the people making and selling them in Triệu Lộc.",
	},
	"food.specialties": { vi: "Đặc sản", en: "Specialties" },
	"food.directory": { vi: "Danh bạ cơ sở", en: "Business directory" },
	"food.addBusiness": {
		vi: "Bạn có cơ sở kinh doanh tại Triệu Lộc? Liên hệ để được giới thiệu miễn phí.",
		en: "Run a business in Triệu Lộc? Get in touch to be listed for free.",
	},
	"food.search": { vi: "Tìm cơ sở…", en: "Search businesses…" },
	"food.noResults": {
		vi: "Không tìm thấy cơ sở phù hợp.",
		en: "No matching businesses.",
	},
	"news.title": { vi: "Tin tức & Thông báo", en: "News & Announcements" },
	"news.lead": {
		vi: "Tin hoạt động, sự kiện và thông báo của xã.",
		en: "Commune activities, events and notices.",
	},
	"gallery.title": { vi: "Thư viện ảnh", en: "Gallery" },
	"gallery.lead": {
		vi: "Hình ảnh quê hương qua bốn mùa. Gửi ảnh của bạn để cùng lưu giữ ký ức.",
		en: "Our homeland through the seasons. Send in your photos to help keep the memories.",
	},
	"footer.about": {
		vi: "Trang thông tin cộng đồng về xã Triệu Lộc, tỉnh Thanh Hoá — dành cho người dân quê nhà, người con xa quê và du khách.",
		en: "A community site about Triệu Lộc commune, Thanh Hóa — for locals, those living far from home, and visitors.",
	},
	"footer.contact": { vi: "Liên hệ", en: "Contact" },
	"footer.note": {
		vi: "Trang cộng đồng, không phải cổng thông tin chính thức của UBND xã.",
		en: "Community site — not the official portal of the commune People's Committee.",
	},
	"people.title": { vi: "Người Triệu Lộc", en: "People of Triệu Lộc" },
	"people.lead": {
		vi: "Những nhân vật lịch sử, người con quê hương và những người con xa quê — mỗi người một câu chuyện.",
		en: "Historical figures, notable locals and those living far from home — each with a story.",
	},
	"people.share": {
		vi: "Bạn là người con Triệu Lộc? Hãy chia sẻ câu chuyện của bạn hoặc giới thiệu một người đáng nhớ.",
		en: "From Triệu Lộc? Share your story, or tell us about someone worth remembering.",
	},
	"events.title": { vi: "Lịch sự kiện", en: "Events calendar" },
	"events.lead": {
		vi: "Lễ hội, ngày lễ Tết và hoạt động cộng đồng trong 12 tháng tới — theo cả dương lịch và âm lịch.",
		en: "Festivals, holidays and community events for the next 12 months — in both solar and lunar dates.",
	},
	"events.today": { vi: "Hôm nay", en: "Today" },
	"events.lunarDate": { vi: "âm lịch", en: "lunar" },
	"events.leap": { vi: "nhuận", en: "leap" },
	"events.month": { vi: "tháng", en: "month" },
	"events.year": { vi: "năm", en: "year of" },
	"events.ongoing": { vi: "Đang diễn ra", en: "Happening now" },
	"events.repeatsLunar": {
		vi: "Hằng năm theo âm lịch",
		en: "Yearly, lunar calendar",
	},
	"events.repeatsSolar": { vi: "Hằng năm", en: "Yearly" },
	"events.add": { vi: "Thêm vào lịch", en: "Add to calendar" },
	"events.suggest": {
		vi: "Thôn bạn có sự kiện sắp tới? Gửi cho chúng tôi để đưa lên lịch.",
		en: "Got an upcoming village event? Send it to us to be listed.",
	},
	"search.title": { vi: "Tìm kiếm", en: "Search" },
	"search.placeholder": {
		vi: "Tìm địa danh, tin tức, con người, đặc sản… (gõ không dấu cũng được)",
		en: "Search places, news, people, food…",
	},
	"search.results": { vi: "kết quả", en: "results" },
	"search.empty": {
		vi: "Không tìm thấy kết quả phù hợp. Thử từ khoá khác?",
		en: "No results. Try another word?",
	},
	"search.try": { vi: "Thử tìm:", en: "Try:" },
	"search.open": { vi: "Tìm kiếm (Ctrl K)", en: "Search (Ctrl K)" },
	"notFound.title": { vi: "Không tìm thấy trang", en: "Page not found" },
	"notFound.body": {
		vi: "Trang bạn tìm không tồn tại hoặc đã được di chuyển.",
		en: "The page you're looking for doesn't exist or has moved.",
	},
} satisfies Record<string, L>;

export type DictKey = keyof typeof dict;

export function t(lang: Lang, key: DictKey): string {
	return dict[key][lang];
}

export function formatDate(lang: Lang, iso: string): string {
	return new Date(`${iso}T00:00:00`).toLocaleDateString(
		lang === "vi" ? "vi-VN" : "en-GB",
		{
			day: "numeric",
			month: "long",
			year: "numeric",
		},
	);
}
