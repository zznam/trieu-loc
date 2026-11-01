# Triệu Lộc — Quê hương Bà Triệu

A bilingual (Vietnamese / English) community website for **Xã Triệu Lộc, tỉnh Thanh Hoá**, built with [TanStack Start](https://tanstack.com/start) + Tailwind CSS v4, ready to deploy on Vercel.

## Pages

| Route | Content |
| --- | --- |
| `/vi`, `/en` | Home: hero, key stats, highlights, festival, latest news |
| `/:lang/history` | History, Lady Triệu, timeline, festivals & traditions |
| `/:lang/places` | Interactive map (Leaflet + OpenStreetMap, commune boundary) and place list |
| `/:lang/food` | Specialties and a searchable local business directory |
| `/:lang/people` | Historical figures, notable locals and diaspora stories (Markdown) |
| `/:lang/events` | Upcoming festivals, holidays and community events (lunar + solar dates) |
| `/:lang/news` | News & announcements (Markdown) |
| `/:lang/villages` | The 17 villages; each page gathers its places, people and events with a map |
| `/:lang/info` | Live weather (Open-Meteo) and a phone directory |
| `/:lang/contribute` | Form for photos, stories, businesses, events and corrections |
| `/admin` | Password-protected review of contributions (Vietnamese) |
| `/:lang/gallery` | Photo gallery by season |

`/` redirects to `/vi`. The language toggle keeps you on the same page.

## Editing content (no code needed)

All content lives in `src/content/`:

- `site.json` — commune name, stats, contact info, home-page highlights
- `history.json` — intro, timeline, Lady Triệu, traditions
- `places.json` — places on the map (`coords: [lat, lng]`, set `approx: false` once verified)
- `food.json` — specialties
- `villages.json` — the 17 thôn (grouped by former commune: `dai-loc`, `trieu-loc`, `tien-loc`). Phú Điền is filled in; the other 16 are placeholders (`"sample": true`) — rename them, write an `intro`, add `facts`, optional `coords: [lat, lng]`, then set `"sample": false` so they appear in search and the sitemap. Link content to a village by adding `"villageId": "<id>"` to a place or event, or `villageId: <id>` to a person's frontmatter
- `contacts.json` — phone directory on the Useful info page (emergency numbers, commune services, schools). Entries marked `"sample": true` still need real numbers
- `events.json` — events calendar. `date.calendar` is `lunar` or `solar`; omit `date.year` for an event that repeats every year, set `date.days` for multi-day events
- `businesses.json` — business directory (**currently sample entries — replace them**)
- `gallery.json` — photos: put image files in `public/images/` and set `"src": "/images/your-photo.jpg"`
- `news/<slug>.vi.md` and `news/<slug>.en.md` — one Markdown file per language with frontmatter:

  ```md
  ---
  title: Tiêu đề bài viết
  date: 2026-11-01
  summary: Một câu tóm tắt.
  ---
  Nội dung bài viết…
  ```

  If the `.en.md` version is missing, the Vietnamese one is shown.
- `people/<slug>.vi.md` / `.en.md` — profiles on the People page. Frontmatter: `name`, `category` (`history` | `notable` | `diaspora`), `years`, `role`, `village`, `summary`, `photo` (optional, e.g. `/images/people/ten.jpg`), `order` (lower shows first).

Bilingual fields use `{ "vi": "...", "en": "..." }`. UI labels live in `src/lib/i18n.ts`.

> ⚠️ Starter content was compiled from public sources (Wikipedia, Vietnamese press) and includes sample text marked "mẫu / sample". Please verify facts and map coordinates, and replace the sample businesses and contact email before launch.

## Development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
pnpm check      # Biome lint + format
```

## SEO & sharing

- `/sitemap.xml` and `/robots.txt` are generated from the content files.
- Every page has a canonical URL, `hreflang` alternates (vi/en) and Open Graph / Twitter tags.
- Absolute URLs use the `SITE_URL` env var (e.g. `https://trieuloc.vn`). If it's unset on Vercel, the production `*.vercel.app` URL is used.
- Share images live in `public/og/`. After changing page titles, regenerate them with `pnpm og` (first time: `npx playwright install chromium`).

## Contributions (Neon Postgres + Vercel Blob)

Visitors can send stories, photos, business listings, events and corrections from `/:lang/contribute`. Everything lands in a Postgres table as **pending**; you review it at **`/admin`**. For stories, events, businesses and photos you can **✎ edit** (fix wording, link a village, set the event date or the business phone) and then **⤒ publish**: stories appear in News ("Bà con kể"), events on the Events page, businesses in the directory, photos in the Gallery. Only items whose sender ticked the consent box can be published; **⤓ unpublish** takes them down again. The sender's original wording is kept for reference. Corrections and "other" messages are for editors only.

Spam protection: a hidden honeypot field, a minimum fill time, and a limit of 5 submissions per hour per IP (only a salted hash of the IP is stored). Photos are resized in the browser (max 2000px, JPEG, ≤1.4 MB each, up to 3).

### One-time setup on Vercel

1. **Database** — Vercel project → *Storage* → *Create* → **Neon** (Marketplace, free plan) → connect it to the project. This adds `DATABASE_URL`.
2. **Photo storage** — *Storage* → *Create* → **Blob** → connect it. This adds `BLOB_READ_WRITE_TOKEN`. (Skip it and the form still works, without photos.)
3. **Admin password** — *Settings* → *Environment Variables* → add `ADMIN_PASSWORD` (long and random). Changing it later signs everyone out.
4. **Email alerts (optional)** — create a free account at [resend.com](https://resend.com), make an API key, then add `RESEND_API_KEY` and `NOTIFY_EMAIL` (comma-separate several addresses). Until you verify your own domain in Resend, emails can only go to your Resend account's address, so use that as `NOTIFY_EMAIL`; after verifying, set `NOTIFY_FROM` (e.g. `Triệu Lộc <thongbao@your-domain.vn>`). Each email has the submission details, reply-to set to the sender's email (if they gave one) and a button to `/admin`.
5. **Create the table** — on your machine:
   ```bash
   vercel env pull .env.local        # brings DATABASE_URL down
   export $(grep DATABASE_URL .env.local | xargs)
   pnpm db:migrate
   ```
6. Redeploy, then open `https://<your-site>/admin`.

See `.env.example` for all variables. When the schema changes: edit `src/server/schema.ts`, run `pnpm db:generate`, commit the new file in `drizzle/`, and run `pnpm db:migrate`. **This release adds a migration (`0001_publishing.sql`) — run `pnpm db:migrate` again after deploying.**

`pnpm build` ends with a check that fails if server-only code (database driver, crypto, Blob SDK) ends up in the browser bundle. If it trips, you imported a plain value from `src/server/*` into a route — import only server functions from there.

## Installable app (PWA)

The site can be added to a phone's home screen (Chrome/Android shows an **Install the app** button in the footer; on iPhone use Share → *Add to Home Screen*). A service worker in `public/sw.js` keeps pages you've visited, fonts, build assets and images available offline, and shows `public/offline.html` for pages not yet saved. `/admin`, server functions and the live weather API are never cached. After changing `sw.js`, bump its `VERSION` so old caches are cleared. Icons are generated by `node scripts/icons.mjs`.

## Analytics

Vercel Web Analytics (cookie-free visitor counts) and Speed Insights (real-user page speed) are wired in. Turn them on in the Vercel project: *Analytics* tab → **Enable**, and *Speed Insights* tab → **Enable**. Nothing is collected until then.

## Deploy to Vercel

The project uses the Vercel deployment adapter (`vercel.json` → `"framework": "tanstack-start"`; Nitro builds the Vercel output automatically).

1. Push this repo to GitHub.
2. On [vercel.com/new](https://vercel.com/new), import the repo — the framework is auto-detected, no settings needed.
3. Optionally add a custom domain under *Project → Settings → Domains*.

Or from the CLI: `npx vercel` (preview) and `npx vercel --prod`.

## Credits

Map data © OpenStreetMap contributors (ODbL). Commune boundary from OSM relation 19521065.
