// Renders the app icons in public/icons from an inline SVG. Run with `node scripts/icons.mjs`.
import { chromium } from "playwright";

const art = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#3f5f23"/>
  <g transform="translate(${pad} ${pad}) scale(${(512 - 2 * pad) / 512})">
    <circle cx="372" cy="150" r="54" fill="#f0b45b"/>
    <path d="M40 360 Q150 150 250 250 Q340 120 472 360Z" fill="#a9c77a"/>
    <path d="M40 360 Q256 330 472 360 V400 H40Z" fill="#e2c46e"/>
    <path d="M40 396 Q256 370 472 396 V436 H40Z" fill="#c9a94f"/>
    <text x="256" y="300" font-family="Georgia, serif" font-size="170" font-weight="700" fill="#faf6ec" text-anchor="middle">T</text>
  </g>
</svg>`;

const browser = await chromium.launch();
const page = await browser.newPage();
const jobs = [
	["icon-192.png", 192, 0],
	["icon-512.png", 512, 0],
	// Maskable icons need the important content inside the central 80% safe zone.
	["icon-maskable-512.png", 512, 56],
	["apple-touch-icon.png", 180, 24],
];
for (const [name, size, pad] of jobs) {
	await page.setViewportSize({ width: size, height: size });
	await page.setContent(
		`<html><body style="margin:0">${art(pad).replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`,
	);
	await page.screenshot({ path: `public/icons/${name}`, omitBackground: false });
	console.log(`public/icons/${name}`);
}
await browser.close();
