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
	"contribute.title": { vi: "Đóng góp cho trang", en: "Contribute" },
	"contribute.lead": {
		vi: "Gửi ảnh, câu chuyện, thông tin cơ sở kinh doanh hay sự kiện của thôn. Ban biên tập sẽ xem trước khi đăng.",
		en: "Send photos, stories, business details or village events. Our editors review everything before it's published.",
	},
	"contribute.cta": { vi: "Gửi đóng góp", en: "Contribute" },
	"contribute.kind": { vi: "Bạn muốn gửi gì?", en: "What are you sending?" },
	"contribute.name": { vi: "Họ và tên", en: "Your name" },
	"contribute.contact": {
		vi: "Email hoặc số điện thoại",
		en: "Email or phone",
	},
	"contribute.contactHint": {
		vi: "Không công khai — chỉ để chúng tôi liên hệ khi cần.",
		en: "Never published — only so we can get back to you.",
	},
	"contribute.village": { vi: "Thôn / nơi ở", en: "Village / where you live" },
	"contribute.titleField": { vi: "Tiêu đề", en: "Title" },
	"contribute.message": { vi: "Nội dung", en: "Message" },
	"contribute.messageHint": {
		vi: "Kể câu chuyện, mô tả bức ảnh, hoặc ghi rõ thông tin cần sửa.",
		en: "Tell the story, describe the photo, or explain what needs fixing.",
	},
	"contribute.photos": { vi: "Ảnh (tối đa 3)", en: "Photos (up to 3)" },
	"contribute.photosHint": {
		vi: "Ảnh được tự động thu nhỏ trước khi gửi. JPG, PNG hoặc WebP.",
		en: "Photos are resized automatically before sending. JPG, PNG or WebP.",
	},
	"contribute.addPhotos": { vi: "Chọn ảnh", en: "Choose photos" },
	"contribute.remove": { vi: "Bỏ ảnh", en: "Remove photo" },
	"contribute.consent": {
		vi: "Tôi đồng ý cho trang đăng nội dung này kèm tên tôi, và tôi có quyền chia sẻ những bức ảnh này.",
		en: "I agree that this may be published with my name, and I have the right to share these photos.",
	},
	"contribute.optional": { vi: "không bắt buộc", en: "optional" },
	"contribute.submit": { vi: "Gửi", en: "Send" },
	"contribute.sending": { vi: "Đang gửi…", en: "Sending…" },
	"contribute.processing": { vi: "Đang xử lý ảnh…", en: "Processing photos…" },
	"contribute.thanks": { vi: "Cảm ơn bạn!", en: "Thank you!" },
	"contribute.thanksBody": {
		vi: "Đóng góp của bạn đã được gửi và đang chờ ban biên tập xem xét.",
		en: "Your contribution has been sent and is waiting for review.",
	},
	"contribute.another": { vi: "Gửi thêm", en: "Send another" },
	"contribute.err.notConfigured": {
		vi: "Chức năng gửi đóng góp chưa được kích hoạt. Vui lòng thử lại sau.",
		en: "Contributions aren't switched on yet. Please try again later.",
	},
	"contribute.err.invalid": {
		vi: "Vui lòng điền đủ các ô bắt buộc.",
		en: "Please fill in the required fields.",
	},
	"contribute.err.photoRequired": {
		vi: "Vui lòng chọn ít nhất một ảnh.",
		en: "Please add at least one photo.",
	},
	"contribute.err.tooMany": {
		vi: "Chỉ gửi tối đa 3 ảnh mỗi lần.",
		en: "Up to 3 photos per submission.",
	},
	"contribute.err.tooLarge": {
		vi: "Ảnh quá lớn, vui lòng chọn ảnh khác.",
		en: "A photo is too large — please pick another.",
	},
	"contribute.err.type": {
		vi: "Chỉ nhận ảnh JPG, PNG hoặc WebP.",
		en: "Only JPG, PNG or WebP photos.",
	},
	"contribute.err.uploads": {
		vi: "Tạm thời chưa nhận ảnh. Bạn vẫn có thể gửi nội dung không kèm ảnh.",
		en: "Photo uploads aren't available yet. You can still send text without photos.",
	},
	"contribute.err.rate": {
		vi: "Bạn đã gửi khá nhiều trong giờ qua. Vui lòng thử lại sau.",
		en: "You've sent quite a few in the last hour. Please try again later.",
	},
	"contribute.err.server": {
		vi: "Có lỗi xảy ra, vui lòng thử lại.",
		en: "Something went wrong — please try again.",
	},
	"contribute.err.photoRead": {
		vi: "Không đọc được ảnh này, vui lòng chọn ảnh khác.",
		en: "Couldn't read that photo — please choose another.",
	},
	"gallery.community": { vi: "Ảnh từ bà con", en: "Photos from the community" },
	"gallery.by": { vi: "Ảnh:", en: "Photo:" },
	"lightbox.label": { vi: "Xem ảnh", en: "Photo viewer" },
	"lightbox.close": { vi: "Đóng", en: "Close" },
	"lightbox.prev": { vi: "Ảnh trước", en: "Previous photo" },
	"lightbox.next": { vi: "Ảnh sau", en: "Next photo" },
	"lightbox.swipe": { vi: "Vuốt để xem ảnh khác", en: "Swipe for more photos" },
	"lightbox.open": { vi: "Phóng to ảnh", en: "View larger" },
	"nav.info": { vi: "Thông tin hữu ích", en: "Useful info" },
	"info.title": {
		vi: "Thời tiết & Thông tin hữu ích",
		en: "Weather & Useful Info",
	},
	"info.lead": {
		vi: "Thời tiết hôm nay, số điện thoại khẩn cấp và liên hệ các cơ quan trong xã.",
		en: "Today's weather, emergency numbers and contacts for local services.",
	},
	"info.weather": { vi: "Thời tiết Triệu Lộc", en: "Weather in Triệu Lộc" },
	"info.contacts": { vi: "Danh bạ", en: "Contacts" },
	"info.group.emergency": {
		vi: "Khẩn cấp (miễn phí, 24/7)",
		en: "Emergency (free, 24/7)",
	},
	"info.group.commune": { vi: "Cơ quan xã", en: "Commune services" },
	"info.group.schools": { vi: "Trường học", en: "Schools" },
	"info.group.heritage": { vi: "Di tích", en: "Heritage site" },
	"info.call": { vi: "Gọi", en: "Call" },
	"info.noPhone": {
		vi: "Số điện thoại đang cập nhật",
		en: "Phone number coming soon",
	},
	"info.sampleNote": {
		vi: "Một số liên hệ là thông tin mẫu — cần cập nhật số điện thoại thật.",
		en: "Some contacts are placeholders — real phone numbers to be added.",
	},
	"weather.today": { vi: "Hôm nay", en: "Today" },
	"weather.feelsLike": { vi: "Cảm giác", en: "Feels like" },
	"weather.humidity": { vi: "Độ ẩm", en: "Humidity" },
	"weather.wind": { vi: "Gió", en: "Wind" },
	"weather.sun": { vi: "Mặt trời", en: "Sunrise – set" },
	"weather.source": { vi: "Dữ liệu:", en: "Data:" },
	"weather.inTrieuLoc": { vi: "Triệu Lộc", en: "Triệu Lộc" },
	"weather.unavailable": {
		vi: "Tạm thời không lấy được dữ liệu thời tiết. Vui lòng thử lại sau.",
		en: "Weather data is temporarily unavailable. Please try again later.",
	},
	"nav.villages": { vi: "Thôn xóm", en: "Villages" },
	"villages.title": {
		vi: "Các thôn của Triệu Lộc",
		en: "The villages of Triệu Lộc",
	},
	"villages.lead": {
		vi: "17 thôn của xã Triệu Lộc mới, hình thành từ ba xã Đại Lộc, Triệu Lộc và Tiến Lộc (từ 1/7/2025).",
		en: "The 17 villages of the new Triệu Lộc commune, formed from Đại Lộc, Triệu Lộc and Tiến Lộc (since 1 July 2025).",
	},
	"villages.count": { vi: "thôn", en: "villages" },
	"villages.places": { vi: "Địa danh trong thôn", en: "Places in the village" },
	"villages.people": { vi: "Con người", en: "People" },
	"villages.events": { vi: "Sự kiện", en: "Events" },
	"villages.facts": { vi: "Điểm nổi bật", en: "Highlights" },
	"villages.empty": {
		vi: "Chưa có nội dung cho thôn này. Bạn là người thôn? Hãy gửi câu chuyện, ảnh hoặc thông tin.",
		en: "Nothing here yet. From this village? Send us stories, photos or information.",
	},
	"villages.share": {
		vi: "Bạn là người thôn này? Hãy gửi thêm câu chuyện, ảnh hoặc thông tin để bổ sung.",
		en: "From this village? Send more stories, photos or information to add here.",
	},
	"villages.sample": {
		vi: "Thông tin mẫu — cần cập nhật tên thôn",
		en: "Placeholder — village name to be added",
	},
	"villages.all": { vi: "Tất cả các thôn", en: "All villages" },
	"villages.byVillage": { vi: "Xem theo thôn", en: "Browse by village" },
	"pwa.install": { vi: "Cài ứng dụng lên máy", en: "Install the app" },
	"news.community": { vi: "Bà con kể", en: "Community story" },
	"news.by": { vi: "Người gửi:", en: "By" },
	"food.community": { vi: "Bà con giới thiệu", en: "Community listing" },
	"nav.guestbook": { vi: "Sổ lưu bút", en: "Guestbook" },
	"guestbook.title": { vi: "Sổ lưu bút quê hương", en: "Hometown guestbook" },
	"guestbook.lead": {
		vi: "Dù ở đâu, hãy để lại đôi lời gửi về Triệu Lộc — lời chào, nỗi nhớ, hay một kỷ niệm.",
		en: "Wherever you are, leave a few words for Triệu Lộc — a greeting, a memory, or how much you miss home.",
	},
	"guestbook.placeholder": {
		vi: "Con ở Sài Gòn đã 10 năm, Tết này nhất định về thăm đền Bà…",
		en: "I've lived abroad for ten years, but every spring I think of the festival…",
	},
	"guestbook.empty": {
		vi: "Chưa có lời nhắn nào. Hãy là người đầu tiên!",
		en: "No messages yet. Be the first!",
	},
	"guestbook.count": { vi: "lời nhắn", en: "messages" },
	"guestbook.cta": {
		vi: "Xa quê? Gửi một lời nhắn về Triệu Lộc trong sổ lưu bút.",
		en: "Far from home? Leave a message for Triệu Lộc in the guestbook.",
	},
	"guestbook.write": { vi: "Viết lời nhắn", en: "Write a message" },
	"message.place": { vi: "Bạn đang ở đâu?", en: "Where are you?" },
	"message.thanks": {
		vi: "Cảm ơn bạn đã gửi lời nhắn!",
		en: "Thanks for your message!",
	},
	"message.pending": {
		vi: "Lời nhắn sẽ hiện lên sau khi ban biên tập duyệt.",
		en: "It will appear once an editor has approved it.",
	},
	"message.another": { vi: "Viết thêm", en: "Write another" },
	"message.moderated": {
		vi: "Lời nhắn được duyệt trước khi hiển thị.",
		en: "Messages are reviewed before they appear.",
	},
	"message.err.invalid": {
		vi: "Vui lòng nhập tên và nội dung.",
		en: "Please add your name and a message.",
	},
	"message.err.links": {
		vi: "Lời nhắn có quá nhiều đường dẫn. Vui lòng bớt lại.",
		en: "Too many links in the message. Please remove some.",
	},
	"comments.title": { vi: "Bình luận", en: "Comments" },
	"comments.empty": { vi: "Chưa có bình luận nào.", en: "No comments yet." },
	"comments.placeholder": {
		vi: "Chia sẻ suy nghĩ hoặc kỷ niệm của bạn…",
		en: "Share your thoughts or a memory…",
	},
	"comments.like": { vi: "Thả tim", en: "Like" },
	"comments.unlike": { vi: "Bỏ tim", en: "Unlike" },
	"comments.likeLabel": { vi: "Yêu thích", en: "Like" },
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
