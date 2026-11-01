/* Triệu Lộc service worker — offline support for pages people have already visited. */
const VERSION = "v1";
const PAGES = `tl-pages-${VERSION}`;
const ASSETS = `tl-assets-${VERSION}`;
const IMAGES = `tl-images-${VERSION}`;
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/manifest.webmanifest"];
const MAX_PAGES = 60;
const MAX_IMAGES = 150;

self.addEventListener("install", (event) => {
	event.waitUntil(caches.open(PAGES).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))))
			.then(() => self.clients.claim()),
	);
});

async function trim(cacheName, max) {
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();
	for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}

self.addEventListener("fetch", (event) => {
	const req = event.request;
	if (req.method !== "GET") return;
	const url = new URL(req.url);

	// Never cache admin, server functions, analytics or the live weather API.
	if (
		url.pathname.startsWith("/admin") ||
		url.pathname.startsWith("/_serverFn") ||
		url.pathname.startsWith("/_vercel") ||
		url.hostname === "api.open-meteo.com"
	) {
		return;
	}

	// Pages: network first (fresh content), fall back to the cached copy, then the offline page.
	if (req.mode === "navigate") {
		event.respondWith(
			fetch(req)
				.then((res) => {
					if (res.ok && url.origin === self.location.origin) {
						const copy = res.clone();
						caches
							.open(PAGES)
							.then((c) => c.put(req, copy))
							.then(() => trim(PAGES, MAX_PAGES));
					}
					return res;
				})
				.catch(async () => (await caches.match(req)) || (await caches.match("/offline.html"))),
		);
		return;
	}

	// Hashed build assets and fonts never change: cache first.
	const immutable =
		(url.origin === self.location.origin && url.pathname.startsWith("/assets/")) ||
		url.hostname === "fonts.gstatic.com" ||
		url.hostname === "fonts.googleapis.com";
	if (immutable) {
		event.respondWith(
			caches.match(req).then(
				(hit) =>
					hit ||
					fetch(req).then((res) => {
						if (res.ok || res.type === "opaque") {
							const copy = res.clone();
							caches.open(ASSETS).then((c) => c.put(req, copy));
						}
						return res;
					}),
			),
		);
		return;
	}

	// Images (own, community photos, map tiles): serve cached, refresh in the background.
	if (req.destination === "image") {
		event.respondWith(
			caches.open(IMAGES).then(async (cache) => {
				const hit = await cache.match(req);
				const network = fetch(req)
					.then((res) => {
						if (res.ok || res.type === "opaque") {
							cache.put(req, res.clone()).then(() => trim(IMAGES, MAX_IMAGES));
						}
						return res;
					})
					.catch(() => hit);
				return hit || network;
			}),
		);
	}
});
