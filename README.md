<p align="center">
  <div align="center">
    <a href="https://offanime.to">
      <img alt="offanime" src="https://github.com/offanimeCore/offanime/blob/main/public/footer.png" width="220"/>
    </a>
  </div>
    <h3 align="center">offanime - Clean anime streaming platform</h3>
    <p align="center">
  <a href="https://github.com/offanimeCore/offanime">
      <img src="https://img.shields.io/github/stars/offanimeCore/offanime" alt="Github Stars">
    </a>
      <img src="https://img.shields.io/github/issues/offanimeCore/offanime" alt="Github Issues">
     <a href="https://github.com/offanimeCore/offanime">
      <img src="https://img.shields.io/github/forks/offanimeCore/offanime" alt="Github Forks" />
    </a>
</p>
</p>
<p align="center">
    <a href="https://offanime.to">offanime</a> is an open-source anime streaming service that uses <a href="https://github.com/offanimeCore/HiAnime-Api">HiAnime-Api</a>, built using ReactJS with javascript and Tailwind CSS. It lets you easily find any anime with intuitive search & suggestion feature and stream without any ads.
 </p>

<p align="center">
  <a href="https://discord.gg/P3yqksmGun">
    <img src="https://img.shields.io/badge/Join%20our%20Discord-5865F2?logo=discord&logoColor=white" alt="Join our Discord">
  </a>
  <a href="https://t.me/offanimeZone">
    <img src="https://img.shields.io/badge/Join%20our%20Telegram-26A5E4?logo=telegram&logoColor=white" alt="Join our Telegram">
  </a>
  <a href="https://www.instagram.com/watchoffanime">
    <img src="https://img.shields.io/badge/Follow%20on%20Instagram-E4405F?logo=instagram&logoColor=white" alt="Follow on Instagram">
  </a>
</p>

<details>
<summary>View more Features</summary>

### General

- Sub Anime support
- Dub Anime support
- User-friendly interface
- Mobile responsive
- Fast page load
- Character & Voice Actors

### Watch Page

- Related Animes
- Recommended Animes
- Available seasons
- Estimated schedule of upcoming episodes
- **Player**
  - Autoplay
  - Autoskip intro/outro
  - Autonext

</details>

## Previews

<div style="text-align: left;">
  <img src="https://github.com/offanimeCore/offanime/blob/main/public/home.PNG" alt="Home Page" style="max-width: 80%;" >
  <details>
  <summary style="margin-top:10px">View more screenshots</summary>
  <br/>
  AnimeInfo Page
  <img src="https://github.com/offanimeCore/offanime/blob/main/public/info.PNG" style="margin-top:10px" src="" alt="AnimeInfo Page" style="max-width: 80%;">
  <br/>
  Character & Voice Actors
  <img src="https://github.com/offanimeCore/offanime/blob/main/public/char.PNG" style="margin-top:10px" src="" alt="Character & Voice Actors" style="max-width: 80%;">
  <br/>
  Watch Page
  <img src="https://github.com/offanimeCore/offanime/blob/main/public/watch.PNG" style="margin-top:10px" src="" alt="Watch Page" style="max-width: 80%;">
  <br/>
  </details>
</div>

## Installation and Local Development

### 1. Make sure you have node installed on your device

### 2. Run the following code to clone the repository and install all required dependencies

```bash
git clone https://github.com/offanimeCore/offanime.git
cd offanime
npm install # or yarn
```

### 3. Refer the <a href="https://github.com/offanimeCore/offanime/blob/main/.env.example">.env.example</a> to set your .env file up

## Start the server

```bash
npm start # or npm run dev (to run develepment server)
```
## Live Deployment

### Vercel

Host your own instance of <a href="https://offanime.fun">offanime</a>  on vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/offanimeCore/offanime)

### Render

Host your own instance of <a href="https://offanime.fun">offanime</a> on Render.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/offanimeCore/offanime)

## Pull Requests

- Pull requests are welcomed that address bug fixes, improvements, or new features.
- Fork the repository and create a new branch for your changes.
- Ensure your code follows our coding standards.
- Include tests if applicable.
- Describe your changes clearly in the pull request, explaining the problem and solution.

 ### Reporting Issues

If you discover any issues or have suggestions for improvement, please open an issue. Provide a clear and concise description of the problem, steps to reproduce it, and any relevant information about your environment.


<h2 align="center">
  <b>Enjoy streaming anime the way it should be! 🍿</b>
</h2>

---

## Anime API Split (3 separate deployments)

To avoid rate limits, the anime section talks to **three separate API
deployments**, one per page type. The live-action movies section (`src/movies/`)
is unaffected and keeps using its own TMDB config.

| Page  | Env var          | Suggested deployment      | Endpoints |
|-------|------------------|---------------------------|-----------|
| HOME  | `VITE_API_URL`   | `anime-details-api`       | `/home`, `/category`, `/schedule`, `/search`, `/search/suggest`, `/top-search`, `/producer`, **`/tmdb`** (logos + episode thumbnails — see note) |
| INFO  | `VITE_API_URL_2` | `anime-details-api-2`     | `/details`, `/seasons`, `/recommendations`, `/character/list`, `/jikan`, `/qtip` |
| WATCH | `VITE_API_URL_3` | `anime-details-api-3`     | `/episodes`, `/schedule/:id` (next-episode) |

> **`/tmdb/` exception:** the `/tmdb/:id` endpoint (which provides the anime
> **logo** on the spotlight/info page and the **episode thumbnail images** in
> the episode grid) only exists on the main `anime-details-api` deployment.
> So *all* `/tmdb/` calls — including the ones on the INFO page — always use
> `VITE_API_URL` (HOME), regardless of page. This is why, after the split, the
> logo and episode thumbnails were missing on the info page until the routing
> was corrected.

Routing is centralized in **`src/config/api.js`** which exports
`HOME_API`, `INFO_API`, and `WATCH_API`. Every anime util/component imports the
correct base URL from there instead of reading `import.meta.env.VITE_API_URL`
directly.

**Fallback:** if `VITE_API_URL_2` or `VITE_API_URL_3` are not set, they fall
back to `VITE_API_URL`, so the site keeps working until all three are configured.

### Setting the URLs in Cloudflare Pages
Add these as environment variables (Production + Preview) in the Cloudflare Pages
project settings, then redeploy:

```
VITE_API_URL    = https://anime-details-api.vercel.app/api
VITE_API_URL_2  = https://anime-details-api-2.vercel.app/api
VITE_API_URL_3  = https://anime-details-api-3.vercel.app/api
```

---

## Video Players (updated 2026-06)

Players from the supplied list were tested for embeddability + sandbox-based
ad-blocking. Each iframe source declares a sandbox policy: safe (blocks
pop-ups/redirects, player still works), loose (megaplay-style, needs popup
tokens present), or none (player refuses any sandbox -> loaded unrestricted).

Movies / TV  -  src/movies/utils/sources.js
  Server 1  Videasy      TMDB              sandbox=none (refuses sandbox)
  Server 2  ezvidapi x8  TMDB              direct HLS, ad-free in our own player
  Server 3  Vidapi       IMDB+TMDB         sandbox=safe
  Server 4  StreamRip    TMDB              sandbox=safe
  Server 5  Vidsrc.pm    IMDB / TMDB(tv)   sandbox=safe
  Server 6  Screenscape  TMDB              sandbox=safe (explicitly allows framing)
  Server 7  Vidnest      TMDB              sandbox=safe
  Server 8  Vidcore      IMDB              sandbox=safe
  Server 9  Vidup        TMDB              sandbox=safe
  Server 10 Filmu        TMDB              sandbox=safe (sandbox-detector, kept same-origin)

NOT added (movies/TV): Peachify (X-Frame-Options SAMEORIGIN + 403, cannot embed),
VidVault (download-only SPA), nyaa/animetosho/tokyotosho (torrent download sites),
Bingr (needs a custom scraper).

Anime  -  src/utils/animeSources.utils.js
  Server 1 Megaplay anilist   AniList  sub/dub  sandbox=none  (popup-guard blocks ads)
  Server 2 Megaplay mal        MAL      sub/dub  sandbox=none  (popup-guard blocks ads)
  Server 3 Vidnest             AniList  sub/dub  sandbox=safe
  Server 4 Vidnest AnimePahe   AniList  sub/dub  sandbox=safe
  Server 5 AnimePlay           AniList  sub/dub  sandbox=none  (popup-guard blocks ads)
  Server 6 StreamRip           AniList  sub      sandbox=safe
  Server 7 TryEmbed            AniList  sub/dub  sandbox=safe (nonce player)
  Hindi    Screenscape         AniList  sub*     sandbox=safe (HINDI dub)

  * "Hindi" resolves the AniList id -> TMDB/IMDB id via the public ani.zip
    mapping API (cached 7 days), then loads Screenscape with lan=hin. Hindi
    audio only exists for popular titles; otherwise the player shows nothing,
    so users should switch to another server.

Sandbox change (June 2026)
  Most players (megaplay, animeplay, ...) now REJECT any sandboxed iframe
  ("Sandboxed our player is not allowed"). Those servers are therefore marked
  sandbox="none". Ads are still blocked via a PAGE-LEVEL popup/redirect guard
  (src/utils/popupGuard.utils.js) that intercepts window.open and untrusted
  top-navigation. The "safe" sandbox is kept only for players that tolerate it.
  The Ad-Block toggle controls the popup guard + the safe-sandbox at once.

Watch-page UX
  - Anime title removed from the server box; servers/audio now live in their own
    "Choose a Server" panel with a grid of redesigned buttons.
  - Each server has an Info (?) button -> "How to use the servers" modal that
    explains every server in plain language (NO URLs exposed) and tells users to
    switch servers if an error occurs.
  - Auto-switch: if a player never finishes loading within ~14s the page falls
    back to the next server automatically and shows a small notice.

Speed improvements
  - preconnect / dns-prefetch for TMDB, image CDN, ezvidapi and every player host.
  - Anime stream URLs are built locally (no API round-trip) -> instant switching.
  - ezvidapi HLS responses cached client-side 5 min -> instant re-selects.
  - ani.zip Hindi-mapping cached in memory + localStorage (7-day TTL).

## Download Sources (updated 2026-06)

The universal /download page (src/pages/download/Download.jsx) deep-links to
external download/streaming sites. Registry: src/utils/downloadSources.utils.js.
Reached via the Download button on both anime Watch and Movie Watch pages.

  Source       Kind          Label             Keyed by      Notes
  VidVault     movie+anime   Direct  (REC.)    TMDB id       deep-links /movie/<id> or /tv/<id>/<s>/<e>
  Nyaa         anime         Torrent           title search  /?f=0&c=1_0&q=<terms>
  AnimeTosho   anime         Torrent + Direct  title search  /search?q=<terms>
  TokyoTosho   anime         Torrent           title search  /search.php?terms=<terms>&type=1 (type=1 required)
  StreamRip    movie/TV      Direct            TMDB id       /movie/<id> | /tv/<id>

  - VidVault is shown FIRST and badged "Recommended" (emerald).
  - Source rows show a simple label (Direct / Torrent / ...) instead of a verbose note.
  - Anime has no TMDB id natively, so src/utils/animeTmdb.utils.js resolves a TMDB
    TV id from the title (TMDB /search/tv, movie fallback; cached 24h). The Watch
    page passes that id via the ?tmdb= query param so VidVault deep-links the show
    instead of redirecting to its homepage.
  - cleanSearchQuery strips "Season N / 2nd Season / Final Season Part N / subtitle
    dashes" so torrent searches return results.
  - Download links use data-allow-popup="true" to bypass the page-level popup guard.

## Accounts & User Sync (added 2026-06)

Optional login system powered by **Supabase Auth** + Postgres. Logging in is
NOT required to use the site — it only syncs your list across devices.

Features
  - Login / Register popup (src/components/auth/AuthModal.jsx), opened from the
    navbar "Log in" button or the dashboard. Cool gradient card, show/hide
    password, switch between login & register.
  - Register REQUIRES ticking "I agree to the Terms of Service … at my own risk"
    before the Create-account button enables.
  - Email + password auth. Passwords are bcrypt-hashed by Supabase (never stored
    by us, never in plain text). Client only holds a short-lived JWT.
  - Avatar dropdown in navbar when logged in -> My Dashboard / Log out.
  - Watch Later: a reusable bookmark button (src/components/auth/WatchLaterButton.jsx)
    available EVERYWHERE — anime info (Hero) + anime watch pages, and live-action
    movie/TV info + watch pages. Toggles saved/✓, syncs when logged in.
  - Continue Watching: the Watch page auto-saves your current anime + episode.
  - User Dashboard (/dashboard): redesigned (2026-06, round 7) — hero banner with
    avatar + account status + stats chips (total / watching / anime / movies),
    tabbed Continue-Watching vs Watch-Later collections, per-card Anime/Movie tags,
    polished empty states, and a Log-out action. Works for guests too (local),
    syncs once logged in.
  - Guests' local lists are MERGED up to the cloud on first login (no data loss).
  - Movie/TV items reuse the watch_later/watch_progress tables via a generic
    string id keyed as "movie:<tmdbId>" / "tv:<tmdbId>" (no schema change needed);
    `watchHref()` + `isMediaItem()` in watchlist.js route them back correctly.

Files
  - src/lib/supabase.js     – shared client (persistSession enabled for auth)
  - src/lib/auth.js         – signUp / signIn / signOut / session helpers
  - src/lib/watchlist.js    – progress + watch-later (cloud + localStorage),
                              + watchHref() / isMediaItem() (anime & movie aware)
  - src/context/AuthContext.jsx – global auth state + "open login popup" trigger
  - src/components/auth/AuthModal.jsx – the popup
  - src/components/auth/WatchLaterButton.jsx – reusable bookmark toggle (anime+movie)
  - src/pages/dashboard/Dashboard.jsx – redesigned user dashboard
  - supabase/auth_schema.sql – tables + Row-Level Security (RUN THIS ONCE)

Security
  - Every user table (profiles, watch_progress, watch_later) has Row-Level
    Security ON: a user can only read/write rows where auth.uid() = user_id.
    With the public anon key, user A can never see user B's data.
  - The ToS page has a prominent "Accounts, Data & Login Risk" section stating
    we are not responsible for any data leak — log in at your own risk.

### ⚠️ One-time Supabase setup (REQUIRED for cross-device sync)
1. Supabase dashboard -> SQL Editor -> New query -> open the file
   `supabase/auth_schema.sql`, COPY ALL OF ITS TEXT (the SQL itself), paste that
   into the editor, then Run.
   ⛔ Do NOT type/paste the file NAME (`supabase/auth_schema.sql`) into the editor
   — that causes `syntax error at or near "supabase"`. You must paste the file's
   CONTENTS. (Creates profiles / watch_progress / watch_later with RLS.)
2. (Recommended) Authentication -> Providers -> Email -> turn OFF "Confirm email"
   so new users are logged in instantly. If left ON, users must click an email
   link before they can log in (the popup tells them to check their inbox).
3. The Supabase URL + anon key live in `.env` (VITE_SUPABASE_URL /
   VITE_SUPABASE_ANON_KEY). For production, set the same two vars in your
   Cloudflare Pages / Vercel project env.

Until step 1 is done, login still works but lists are stored locally only
(the app degrades gracefully — no crashes).

---

## 🚀 Round 8 Update — TMDB Banners, Fresh Sitemaps, SEO & Premium Polish

This round focused on six requested improvements. Summary of every change:

### 1. TMDB banners everywhere (spotlight + all banners)
- **New resolver** `src/utils/getTmdbBanner.utils.js` — maps an anime id → its
  `tmdbId` (via HOME_API `/tmdb/{id}`), then pulls the best **text-free,
  highest-resolution backdrop** from TMDB `/tv/{id}/images` (falls back to
  `/movie/`). Cached in-memory + `sessionStorage` (`tmdbBannerCache_v1`),
  de-dupes in-flight requests, never throws.
- **Spotlight** (`src/components/spotlight/Spotlight.jsx`) now fetches TMDB
  banners progressively (first slides immediately, rest after) and passes
  `tmdbBanner` to each `Banner`.
- **Banner** (`src/components/banner/Banner.jsx`) renders the TMDB banner with a
  crossfade (`key={bannerImage}`) and falls back to the old image if TMDB has none.
- **AnimeInfo Hero** (`src/pages/animeInfo/components/Hero.jsx`) uses the TMDB
  banner with a fade-in.

### 2. Brand-new sitemap system (fixes "couldn't fetch" in GSC)
- Deleted **all** old sitemap files (`sitemap-genre/movie-*/page/type.xml`).
- New generator `scripts/generate-sitemap.mjs` produces:
  - `sitemap.xml` — clean **index** (3 child maps)
  - `sitemap-pages.xml` — static + category + A-Z + genre pages
  - `sitemap-anime-N.xml` — anime info pages (≤5000 URLs/file)
  - `sitemap-movies.xml` — TMDB popular/top Movies + TV
- Standardised on **https://offanime.cc**, uses **today's** `<lastmod>`, escapes
  XML, all files validated as well-formed.
- Regenerate any time: `npm run sitemap` (also runs automatically on `prebuild`).
  Tune crawl depth with `SITEMAP_ANIME_PAGES=50 npm run sitemap`.

### 3. SEO toward 100
- Fixed the root cause of GSC failures: **domain mismatch** — every
  `offanime.fun` (dead) reference replaced with `offanime.cc` (live) across
  `index.html`, `src/utils/seo.utils.js`, and all components.
- `src/pages/animeInfo/AnimeInfo.jsx` now ships a full `<Helmet>` block:
  optimised title/description/keywords, canonical, robots, Open Graph, Twitter
  cards, plus **two JSON-LD blocks** (anime + breadcrumb structured data).
- Cleaner `public/robots.txt` (focuses crawl budget on rich info pages,
  points to `https://offanime.cc/sitemap.xml`).

### 4. Super-smooth + 5. Premium animations
- `tailwind.config.js` — new keyframes/animations: `heroFade`, `bannerFade`,
  `fadeInUp`, `fadeIn`, `floatUp`, `shimmer`.
- `src/components/banner/Banner.css` — cinematic `bannerFade` + slow `kenBurns`
  drift on the spotlight, `spotlightRise` content entrance (reduced-motion safe).
- `src/index.css` — global polish: smooth scroll, `.card-hover`, `.reveal-up`,
  `.page-fade`, pink `:focus-visible` ring, shimmer skeletons.
- `src/App.jsx` — route fade-in (`page-fade` + `key={location.pathname}`).
- `src/components/trending/Trending.jsx` — hover lift on trending cards.

### 6. Continue Watching redesign
- `src/components/ContinueWatching.jsx` rebuilt premium: 16:9 TMDB-still
  thumbnails (poster fallback), animated pink-gradient progress bar, EP badge,
  hover remove (X), center play overlay, hover lift, shimmer skeletons, and a
  section header with a clock icon + staggered fade-in.

### Sitemap entry points
- `https://offanime.cc/sitemap.xml` (index)
- `…/sitemap-pages.xml`, `…/sitemap-anime-1.xml`, `…/sitemap-movies.xml`

### Build / preview
- Build: `npm run build` (auto-generates sitemaps) or `npm run build:nositemap`.
- Local preview of the built SPA: `pm2 start ecosystem.config.cjs`
  (serves `dist/` on port 3000 with SPA fallback via `sirv-cli`).

**Last Updated:** 2026-06-28

---

## 🚀 Round 9 Update — Smaller Spotlight Logo, Full Card Redesign, Movies Continue Watching & Faster Images

### 1. Smaller spotlight logo
- `src/components/banner/Banner.jsx` — spotlight logo reduced from `h-[150px]`
  to a more refined `h-[110px]` (with smaller responsive steps), and the text
  fallback title scaled down to match. Cleaner, less overpowering hero.

### 2. Whole-homepage + card redesign (smooth, interactive)
- **Anime poster cards** (`CategoryCard.jsx`): rounded-xl, soft ring that lights
  up pink on hover, smooth lift (`-translate-y-1.5`), slow image zoom, a glassy
  blur play-button that scales in, gradient wash, and a title that fades to pink.
  Replaced the old heavy `blur-sm` hover with GPU-friendly transforms.
- **Movie/TV cards** (`MovieCard.jsx`): same premium treatment in the movies
  purple accent (ring + glow + lift + glassy info button).
- **Trending & Top 10 rails** (`Trending.jsx`, `Topten.jsx`): hover lift, pink
  border glow, banner de-saturates → colour on hover, poster zoom, pink title.
- All hover effects use `transform`/`opacity`/`color` transitions (compositor-
  friendly) so they stay buttery without costing scroll/runtime performance.

### 3. Continue Watching for Movies & TV (separate from anime)
- New `src/movies/components/MovieContinueWatching.jsx` — a dedicated rail on the
  Movies home page showing only live-action items the user has started, with the
  same premium 16:9 card design in the purple movies accent.
- `src/movies/pages/MovieWatch.jsx` now records progress (via the shared
  `watchlist` lib) using media-prefixed ids (`movie:550` / `tv:1399`) and a
  `/movies/...` watch link when a title/episode is opened.
- **Anime and Movies stay separate on their home pages** — anime uses the legacy
  `continueWatching` store; movies use the media-filtered shared store.

### 4. Merged only in the user Dashboard
- The Dashboard (`src/pages/dashboard/Dashboard.jsx`) already reads the shared
  store and merges anime + movies into one "Continue Watching" + stats — so the
  two now appear together **only** there, exactly as requested. Movies finally
  show up because MovieWatch now writes progress.

### 5. Faster-feeling anime page images
- New `src/components/ui/SmartImage.jsx` — a tiny, dependency-free image wrapper
  that shows a shimmer placeholder, then fades + un-blurs the image once it has
  actually decoded (`decoding="async"`, lazy by default). This makes posters /
  episode stills feel instant and never show half-painted/janky frames.
- Applied across the anime info page: Hero poster, Episode grid stills,
  Recommendations and Seasons poster grids.

### 6. Animations don't hurt speed
- Everything above is CSS transform/opacity based (no layout thrash) and the JS
  bundle grew only ~3 KB total. Image work is browser-native (async decode + lazy
  load), so motion is added **without** slowing the site. A
  `prefers-reduced-motion` guard remains in global CSS.

**Last Updated:** 2026-06-28 (Round 9)

## Round 10 Update

- **Movies Top 10 Today** — added a Netflix-style ranked rail (giant outlined rank numbers behind the poster cards) to the live-action Movies/TV home, powered by TMDB trending. Purple accent, drag-scroll + chevrons.
- **Continue Watching capped at 10** — both anime and movies/TV continue-watching now keep a maximum of 10 titles; watching an 11th drops the oldest. Anime and movies are capped independently.
- **Latest-episode-only** — anime continue-watching now stores ONE entry per anime (the latest episode you watched), not one row per episode. Fixed the bug where watching 7 episodes created 7 entries.
- **Community comments** — embedded The Anime Community (theanimecommunity.com) per-episode comment section on every anime watch page, themed to match (pink). Reloads in sync as you change episode/anime.
- **Schedule page redesign + Load More** — rebuilt the schedule page with a scrollable 7-day week selector, a premium 2-column card grid (pink accent, hover lift/glow), and a **Load More** button that reveals 8 more episodes per click.

- **Last Updated**: 2026-06-29

## Round 11 Update — Playback resume + security hardening

- **Resume where you left off** — the native HTML5/HLS player now tracks the exact playback position per anime+episode (`src/utils/playbackProgress.utils.js`), saving every ~5s plus on pause / tab-hide / unmount, and resumes from that second on reload (with a "Resuming from m:ss" notice). Finished episodes (>95%) start fresh.
  - *Note:* external **iframe** players (most movie/TV providers + some anime servers) are cross-origin, so the browser physically cannot read their video time — those resume at the episode level, not the exact second. Browser security limitation, not a bug.
- **TMDB key moved OFF the frontend** — added a Cloudflare Pages Function `functions/api/tmdb/[[path]].js` that proxies TMDB server-side. The browser now calls our own `/api/tmdb/*`; the real key is read from the `TMDB_API_KEY` server secret and never ships in the JS bundle (verified gone from `dist`). Set it with `npx wrangler pages secret put TMDB_API_KEY`.
- **Security headers** (`public/_headers`): HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options, COOP and a `frame-ancestors 'self'` CSP — protecting against clickjacking, MIME-sniffing, referrer leakage and downgrade attacks (without breaking the embedded video iframes).
- **Build hardening**: production source maps disabled and `console.*`/`debugger` stripped from the bundle.
- **Honest note on "hiding requests":** no website can hide network requests from DevTools — the browser itself makes them, so they are always visible (true for Netflix/YouTube too). What we now protect is the **secret** behind those requests (the API key) and we make the code hard to read.

- **Last Updated**: 2026-06-29

## Round 12 Update — Watch-page overflow fix, themed server dropdowns & smooth movie sliders

- **Fixed horizontal overflow on watch pages** — two anime watch pages (e.g. One Piece, Bleach) were wider than the viewport and clipped on the right edge. Root cause: a grid/flex column defaults to `min-width:auto`, so the embedded community-comments iframe forced the whole `1fr` column past the screen edge. Fixes:
  - `Watch.jsx`: main grid is now `xl:grid-cols-[minmax(0,1fr)_420px]` and the content column has `min-w-0`, so it can shrink instead of overflowing.
  - `AnimeComments.jsx`: the comment container is now `min-w-0 max-w-full overflow-hidden` with `[&_iframe]:w-full [&_iframe]:max-w-full`, so the embedded iframe can never push the layout wide.
- **Themed dropdown server selectors (anime + movies)** — replaced the old plain "Server 1 / Server 5 …" button grids with a single, compact dropdown that matches each section's theme:
  - **Anime** (`Watch.jsx`): pink (`#ffbade`/`#ff7eb6`) dropdown showing the current server, a server count, live "now-playing" dot, Sub/Dub icon and a check on the active item.
  - **Movies/TV** (`MovieWatch.jsx`): purple (`#a855f7`/`#c084fc`) dropdown; Server 2's many ad-free providers appear as an indented sub-list inside the same menu. Closes on outside-click / Escape.
- **Smooth, inertial movie sliders** — the live-action rows no longer "hard scroll" (stop dead on release). New shared hook `src/movies/hooks/useMomentumScroll.js` adds velocity-tracked **momentum/glide** after a drag and **eased (easeOutCubic) chevron paging**, used by both `MovieRow` and the Top 10 rail (`MovieTop10`). Scrollbars stay hidden; native smooth-scroll is auto-disabled while the rAF animation drives the position.

- **Last Updated**: 2026-06-29
