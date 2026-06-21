# Deploying OFFanime (Anime + Movies) to Cloudflare Pages

This is the **merged** build: your production anime site **plus** the isolated
Movies/TV section (`src/movies/`) and the rebuilt SEO sitemaps. It is configured
to deploy to **Cloudflare Pages** (same place your `offanime.cc` domain lives).

## Why the previous v6 showed a blank screen on Cloudflare
The earlier `public/_redirects` had extra placeholder rules
(`/sitemap-:name.xml ...`). Cloudflare Pages can misbehave when `_redirects`
contains anything beyond the standard SPA fallback, which blanked the app.
It is now reverted to the **exact single rule your working anime site uses**:

```
/*    /index.html    200
```

Cloudflare Pages always serves real files in the build output (the sitemaps,
`robots.txt`, JS/CSS) *before* this rule, so SEO files still work.

## Cloudflare Pages settings
When connecting the repo (or re-deploying the existing project):

| Setting                   | Value            |
| ------------------------- | ---------------- |
| Framework preset          | `None` / `Vite`  |
| Build command             | `npm run build`  |
| Build output directory    | `dist`           |
| Node version              | 18 or 20         |

## Environment variables (set in Cloudflare Pages → Settings → Variables)
All have safe fallbacks in code, but set them so the right APIs are used:

```
VITE_ANILIST_URL    = https://anime-details-api.vercel.app/api
VITE_ANIMEPAHE_API  = https://anime-streaming-system-1.onrender.com
VITE_API_URL        = https://anime-details-api.vercel.app/api
VITE_MEGAPLAY_URL   = https://megaplayproxy1.vercel.app
VITE_TMDB_API_KEY   = 64b03fca3936439f3d3da531973e5ff9
VITE_VIDEASY_URL    = https://player.videasy.to
VITE_EZVIDAPI_URL   = https://api.ezvidapi.com
VITE_VIDAPI_URL     = https://vaplayer.ru
```

## After deploy
1. Visit `/` (anime) and `/movies` (movies) — both should load.
2. In Google Search Console, (re)submit `https://offanime.cc/sitemap.xml`.
3. To refresh the movies sitemap with new titles later:
   `node scripts/gen-movies-sitemap.mjs` then redeploy.

## What's included from the Movies work
- Netflix-style movie info page (trailer background, left-aligned details).
- Cards open the info page first, then "Watch Now" → player.
- Smooth 1:1 row dragging on desktop.
- Mobile-optimized movie pages.
- Resilient TMDB layer (12s timeout + automatic mirror host + `allSettled`)
  so the Movies section no longer hangs forever on mobile networks.
- Rebuilt sitemaps: BOM removed, full index (all 20 anime + new
  `sitemap-movies.xml`), correct type URLs — fixes "Couldn't fetch" in GSC.
