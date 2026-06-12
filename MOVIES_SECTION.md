# OFFanime — Movies / TV Section

A self-contained Movies & TV module added to the existing OFFanime React/Vite
anime site. **Nothing in the anime site was changed** — all movie code lives
under `src/movies/` and is reached only via `/movies*` routes plus a single
"Movies" button added to the navbar.

## URLs / Routes
| Route | Page |
|-------|------|
| `/movies` | Home: spotlight carousel + 6 rows (Trending, Popular Movies, Now Playing, Popular TV, Top Movies, Top TV) |
| `/movies/trending` | Trending grid w/ load-more |
| `/movies/category/:cat` | Category grid (`popular-movies`, `top-movies`, `now-playing`, `popular-tv`, `top-tv`, `airing-tv`) |
| `/movies/search?q=...` | TMDB multi search w/ load-more |
| `/movies/:type/:id` | Info page (`type` = `movie` or `tv`) |
| `/movies/watch/:type/:id?s=&e=` | Watch page (player + per-server buttons + Ad-Block toggle); `s`/`e` = TV season/episode |

> All `/movies/*` routes are registered **before** the anime `/:id` catch-all
> in `src/App.jsx`, so they take precedence without affecting anime routing.

## Data
- **TMDB v3** (`src/movies/utils/tmdb.js`) for all movie/TV metadata, images,
  cast, recommendations, seasons & episodes.
- API key: set `VITE_TMDB_API_KEY` in `.env`. Falls back to a working public
  key if not set.

## Streaming sources (`src/movies/utils/sources.js`)
Three servers, each selected with its **own button** on the watch page.
- **Server 1 — Videasy** (iframe embed):
  - Movie: `https://player.videasy.to/movie/{tmdbId}`
  - TV: `https://player.videasy.to/tv/{tmdbId}/{season}/{episode}`
- **Server 2 — ezvidapi** (direct HLS, played ad-free in our own ArtPlayer):
  - providers: vidsrc, vidrock, vidzee, icefy, vidlink, vidnest, vixsrc, popr
  - Movie: `{EZ}/movie/{provider}/{tmdbId}`
  - TV: `{EZ}/tv/{provider}/{tmdbId}?season=&episode=`
  - returns `stream_url` (m3u8) or `{"detail":"stream not found"}` → UI shows an
    error and prompts the user to pick another source.
  - The **Server 2** button is split: click it to activate it; click it again
    (or its chevron) to open a **provider sub-menu** (it has many providers).
- **Server 3 — vidapi** (iframe embed via `vaplayer.ru`, supports TMDB IDs):
  - Movie: `https://vaplayer.ru/embed/movie/{tmdbId}?skin=vidzilla&color=9146ff`
  - TV: `https://vaplayer.ru/embed/tv/{tmdbId}/{season}/{episode}?skin=vidzilla&color=9146ff`
  - Player customised with `skin=vidzilla` and accent `color=9146ff` (site purple).

## Player & Ad-Block (`src/movies/components/MoviePlayer.jsx`)
- HLS sources → **ArtPlayer + hls.js** (native, ad-free, theme `#a855f7`).
- Iframe sources (Server 1 videasy, Server 3 vidapi) → embedded `<iframe>`.
- **Server selector**: separate **per-server buttons** (Server 1, Server 2
  (Ad-Free), Server 3) in the player toolbar — the active server is purple.
- **Ad-Block toggle** (green when ON): when ON, external iframes (Server 1/3)
  get a restrictive `sandbox` attribute that blocks pop-ups / redirect ads.
  Note: some external players (e.g. videasy) detect sandbox and refuse to play —
  if a server won't load, turn Ad-Block **OFF**. Server 2 always plays ad-free
  in our own ArtPlayer regardless of this toggle. State persisted in
  `localStorage["off_movies_adblock"]`. It never touches the anime site's ads.

## Info page hero (Netflix-style) (`src/movies/pages/MovieInfo.jsx`)
- Full-bleed background **trailer/backdrop** (`min-h-[78vh]`, `object-cover
  object-top`); the muted YouTube trailer auto-plays behind, with mute / stop /
  restart controls top-right.
- Left-to-transparent + bottom gradient fade to dark so the content reads.
- Content stacked on the **left** (max ~640px): logo (or large title) → tagline →
  metadata row (rating · year · HD/TV/status badge · runtime · votes) → 3-line
  synopsis → **white "Watch Now" button** (no "My List") → a status pill
  (Must Watch / Trending / Popular / New) → "Starring: / Genres: / This X is:" lines.
- No poster image and no stat-card pills on the hero (kept the rich info as text
  lines instead). Episodes / Cast / Recommendations sections below are unchanged.

## Card behaviour & row drag
- **Cards link to the info page first** (`/movies/:type/:id`, info icon on hover),
  not straight to the watch page — the user picks **Watch Now** on the info page.
- **Rows drag 1:1 / smoothly** on desktop: scroll-snap (`scrollSnapType` /
  `scrollSnapAlign`) was removed so the track follows the mouse freely instead of
  jumping one card at a time. A 5px threshold + click-capture still prevents an
  accidental navigation when you finish a drag.

## Config (`.env`)
```
VITE_TMDB_API_KEY=...      # your TMDB v3 key (optional, has public fallback)
VITE_VIDEASY_URL=https://player.videasy.to
VITE_EZVIDAPI_URL=https://api.ezvidapi.com
VITE_VIDAPI_URL=https://vaplayer.ru
```

## Run
```
npm install
npm run build
pm2 start ecosystem.config.cjs   # vite preview on :3000
```
