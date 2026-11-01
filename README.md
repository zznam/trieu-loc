# Triệu Lộc — Quê hương Bà Triệu

A bilingual (Vietnamese / English) community website for **Xã Triệu Lộc, tỉnh Thanh Hoá**, built with [TanStack Start](https://tanstack.com/start) + Tailwind CSS v4, ready to deploy on Vercel.

## Pages

| Route | Content |
| --- | --- |
| `/vi`, `/en` | Home: hero, key stats, highlights, festival, latest news |
| `/:lang/history` | History, Lady Triệu, timeline, festivals & traditions |
| `/:lang/places` | Interactive map (Leaflet + OpenStreetMap, commune boundary) and place list |
| `/:lang/food` | Specialties and a searchable local business directory |
| `/:lang/news` | News & announcements (Markdown) |
| `/:lang/gallery` | Photo gallery by season |

`/` redirects to `/vi`. The language toggle keeps you on the same page.

## Editing content (no code needed)

All content lives in `src/content/`:

- `site.json` — commune name, stats, contact info, home-page highlights
- `history.json` — intro, timeline, Lady Triệu, traditions
- `places.json` — places on the map (`coords: [lat, lng]`, set `approx: false` once verified)
- `food.json` — specialties
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

## Deploy to Vercel

The project uses the Vercel deployment adapter (`vercel.json` → `"framework": "tanstack-start"`; Nitro builds the Vercel output automatically).

1. Push this repo to GitHub.
2. On [vercel.com/new](https://vercel.com/new), import the repo — the framework is auto-detected, no settings needed.
3. Optionally add a custom domain under *Project → Settings → Domains*.

Or from the CLI: `npx vercel` (preview) and `npx vercel --prod`.

## Credits

Map data © OpenStreetMap contributors (ODbL). Commune boundary from OSM relation 19521065.
