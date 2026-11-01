// Generates social share images (1200×630) into public/og/<page>-<lang>.jpg.
// Run with `pnpm og` after changing titles. Needs Chromium once:
//   npx playwright install chromium
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const PAGES = {
	home: {
		vi: "Quê hương Bà Triệu, bên dòng sông Lèn",
		en: "Homeland of Lady Triệu, on the Lèn River",
	},
	history: { vi: "Lịch sử & Văn hoá", en: "History & Culture" },
	places: { vi: "Địa danh & Bản đồ", en: "Places & Map" },
	food: { vi: "Đặc sản & Cơ sở địa phương", en: "Food & Local Business" },
	news: { vi: "Tin tức & Thông báo", en: "News & Announcements" },
	gallery: { vi: "Thư viện ảnh", en: "Gallery" },
	people: { vi: "Người Triệu Lộc", en: "People of Triệu Lộc" },
	events: { vi: "Lịch sự kiện", en: "Events calendar" },
};
const KICKER = {
	vi: "Xã Triệu Lộc · Tỉnh Thanh Hoá",
	en: "Triệu Lộc Commune · Thanh Hóa, Vietnam",
};

const landscape = `
<svg viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e3b5"/><stop offset="1" stop-color="#faf6ec"/></linearGradient></defs>
<rect width="800" height="420" fill="url(#s)"/><circle cx="640" cy="100" r="50" fill="#f0b45b" opacity=".85"/>
<path d="M0 230 Q120 170 230 210 T470 200 T800 190 V420 H0Z" fill="#c8d6a6"/>
<path d="M300 250 Q420 110 490 150 Q550 120 630 240 Z" fill="#7d9b4f"/>
<path d="M360 245 Q430 150 490 175 Q530 160 590 245 Z" fill="#6d9440"/>
<path d="M0 270 Q200 250 400 268 T800 260 V420 H0Z" fill="#a9c77a"/>
<path d="M0 300 Q220 282 420 300 T800 292 V420 H0Z" fill="#e2c46e"/>
<path d="M0 335 Q240 318 440 334 T800 328 V420 H0Z" fill="#c9a94f"/>
<path d="M0 372 Q200 356 420 372 T800 362 V420 H0Z" fill="#c4dbd5"/></svg>`;

const html = (
	title,
	kicker,
) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@600&family=Lora:wght@600&display=block" rel="stylesheet">
<style>body{margin:0;width:1200px;height:630px;position:relative;overflow:hidden;font-family:'Be Vietnam Pro'}
.fade{position:absolute;inset:0;background:linear-gradient(90deg,#faf6ec 0%,rgba(250,246,236,.85) 50%,rgba(250,246,236,0) 85%)}
.c{position:absolute;left:80px;top:0;bottom:0;width:720px;display:flex;flex-direction:column;justify-content:center}
.k{color:#7a4f22;font-size:26px;letter-spacing:.12em;text-transform:uppercase}
h1{font-family:Lora;color:#23361a;font-size:76px;line-height:1.1;margin:20px 0 0}
.b{position:absolute;left:80px;bottom:56px;display:flex;align-items:center;gap:16px;color:#3f5f23;font-size:28px}
.d{width:52px;height:52px;border-radius:50%;background:#3f5f23;color:#faf6ec;display:grid;place-items:center;font-family:Lora;font-size:28px}
</style></head><body>${landscape}<div class="fade"></div>
<div class="c"><div class="k">${kicker}</div><h1>${title}</h1></div>
<div class="b"><div class="d">T</div>Triệu Lộc</div></body></html>`;

await mkdir("public/og", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [name, titles] of Object.entries(PAGES)) {
	for (const lang of ["vi", "en"]) {
		await page.setContent(html(titles[lang], KICKER[lang]), {
			waitUntil: "networkidle",
		});
		await page.evaluate(() => document.fonts.ready);
		await page.screenshot({
			path: `public/og/${name}-${lang}.jpg`,
			type: "jpeg",
			quality: 82,
		});
		console.log(`public/og/${name}-${lang}.jpg`);
	}
}
await browser.close();
