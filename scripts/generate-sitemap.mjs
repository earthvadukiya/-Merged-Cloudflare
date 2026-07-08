/**
 * generate-sitemap.mjs — Master sitemap generator for offanime.cc
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds a brand-new, fully valid sitemap set from scratch:
 *
 *   public/sitemap.xml            ← sitemap INDEX (points to all child maps)
 *   public/sitemap-pages.xml      ← static + category + A-Z + genre pages
 *   public/sitemap-anime-N.xml    ← anime info pages, ≤5000 URLs per file
 *   public/sitemap-movies.xml     ← Movies / TV section (TMDB popular + top)
 *
 * Why a clean rebuild: the old sitemap kept failing in Google Search Console
 * ("couldn't fetch") because of (a) a domain mismatch (offanime.fun vs the live
 * offanime.cc), (b) future-dated <lastmod> values, and (c) oversized child maps.
 * This generator standardises on https://offanime.cc, uses today's date, escapes
 * XML correctly, and caps each child map at 5000 URLs.
 *
 * Run:   node scripts/generate-sitemap.mjs
 *        SITEMAP_ANIME_PAGES=40 node scripts/generate-sitemap.mjs
 *
 * Env:
 *   SITE_URL              base URL            (default https://offanime.cc)
 *   VITE_API_URL          anime HOME API      (default anime-details-api.vercel.app/api)
 *   VITE_TMDB_API_KEY     TMDB key            (default baked-in public key)
 *   SITEMAP_ANIME_PAGES   API pages to crawl  (default 60)
 *
 * Never throws: on any failure it still emits a minimal valid index so the build
 * never breaks.
 */
import fs from "node:fs";
import path from "node:path";

// ── Config ──────────────────────────────────────────────────────────────────
const BASE = (process.env.SITE_URL || "https://offanime.cc").replace(/\/+$/, "");
const HOME_API = (process.env.VITE_API_URL || "https://anime-details-api.vercel.app/api").replace(/\/+$/, "");
const TMDB_KEY = process.env.VITE_TMDB_API_KEY || "64b03fca3936439f3d3da531973e5ff9";
const ANIME_PAGES = Number(process.env.SITEMAP_ANIME_PAGES || 60);
const URLS_PER_FILE = 5000;
const TODAY = new Date().toISOString().slice(0, 10);
const PUBLIC_DIR = path.resolve("public");

// Category endpoints that yield indexable anime info pages.
const ANIME_CATEGORIES = ["most-popular", "most-favorite", "tv-series", "subbed-anime"];

// Static + section routes (no params).
const STATIC_PAGES = [
  { loc: "/home", priority: "1.0", freq: "daily" },
  { loc: "/schedule", priority: "0.6", freq: "daily" },
  { loc: "/recently-updated", priority: "0.8", freq: "daily" },
  { loc: "/top-airing", priority: "0.8", freq: "daily" },
  { loc: "/most-favorite", priority: "0.7", freq: "weekly" },
  { loc: "/latest-completed", priority: "0.7", freq: "weekly" },
  { loc: "/movies", priority: "0.8", freq: "daily" },
  { loc: "/movies/trending", priority: "0.7", freq: "daily" },
  { loc: "/terms-of-service", priority: "0.3", freq: "yearly" },
  { loc: "/dmca", priority: "0.3", freq: "yearly" },
  { loc: "/contact", priority: "0.3", freq: "yearly" },
];

const CATEGORY_ROUTES = [
  "recently-added", "top-upcoming", "subbed-anime", "dubbed-anime",
  "most-popular", "movies", "tv-series", "ovas", "onas", "specials",
];

const AZ_ROUTES = [
  "az-list", "az-list/other", "az-list/0-9",
  ..."abcdefghijklmnopqrstuvwxyz".split("").map((c) => `az-list/${c}`),
];

const GENRES = [
  "action", "adventure", "cars", "comedy", "dementia", "demons", "drama",
  "ecchi", "fantasy", "game", "harem", "historical", "horror", "isekai",
  "josei", "kids", "magic", "martial-arts", "mecha", "military", "music",
  "mystery", "parody", "police", "psychological", "romance", "samurai",
  "school", "sci-fi", "seinen", "shoujo", "shoujo-ai", "shounen", "shounen-ai",
  "slice-of-life", "space", "sports", "super-power", "supernatural", "thriller",
  "vampire",
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function createAnimeSlug(title, id) {
  const slug = String(title || "anime")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug}-${id}`;
}

function urlEntry({ loc, lastmod = TODAY, freq = "weekly", priority = "0.5" }) {
  return (
    `  <url>\n` +
    `    <loc>${xmlEscape(BASE + loc)}</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>${freq}</changefreq>\n` +
    `    <priority>${priority}</priority>\n` +
    `  </url>`
  );
}

function wrapUrlset(entries) {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join("\n") +
    `\n</urlset>\n`
  );
}

function wrapIndex(maps) {
  const body = maps
    .map(
      (m) =>
        `  <sitemap>\n` +
        `    <loc>${xmlEscape(BASE + "/" + m)}</loc>\n` +
        `    <lastmod>${TODAY}</lastmod>\n` +
        `  </sitemap>`
    )
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    body +
    `\n</sitemapindex>\n`
  );
}

function write(file, content) {
  fs.writeFileSync(path.join(PUBLIC_DIR, file), content, "utf8");
  console.log(`  ✓ ${file} (${(content.length / 1024).toFixed(1)} KB)`);
}

async function fetchJson(url, timeoutMs = 12000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`  ! fetch failed: ${url} → ${e.message}`);
    return null;
  }
}

// ── Page sitemap (static + categories + az + genres) ─────────────────────────
function buildPagesSitemap() {
  const entries = [];
  entries.push(urlEntry({ loc: "/", priority: "1.0", freq: "daily" }));
  for (const p of STATIC_PAGES) entries.push(urlEntry(p));
  for (const c of CATEGORY_ROUTES)
    entries.push(urlEntry({ loc: `/${c}`, priority: "0.7", freq: "daily" }));
  for (const a of AZ_ROUTES)
    entries.push(urlEntry({ loc: `/${a}`, priority: "0.5", freq: "weekly" }));
  for (const g of GENRES)
    entries.push(urlEntry({ loc: `/genre/${g}`, priority: "0.6", freq: "weekly" }));
  write("sitemap-pages.xml", wrapUrlset(entries));
  return entries.length;
}

// ── Anime sitemaps (paginate category endpoints, dedupe by id) ───────────────
async function buildAnimeSitemaps() {
  const seen = new Map(); // id -> title
  for (const cat of ANIME_CATEGORIES) {
    for (let page = 1; page <= ANIME_PAGES; page++) {
      const data = await fetchJson(`${HOME_API}/category/${cat}?page=${page}`);
      const results = data?.results || data?.data?.results || [];
      if (!Array.isArray(results) || results.length === 0) break;
      for (const item of results) {
        const id = item?.id ?? item?.anilistId;
        if (id == null) continue;
        if (!seen.has(id)) seen.set(id, item.title || item.name || "anime");
      }
    }
  }

  const ids = [...seen.entries()];
  const files = [];
  if (ids.length === 0) {
    console.warn("  ! no anime ids collected — skipping anime sitemaps");
    return { files, count: 0 };
  }

  let part = 1;
  for (let i = 0; i < ids.length; i += URLS_PER_FILE) {
    const chunk = ids.slice(i, i + URLS_PER_FILE);
    const entries = chunk.map(([id, title]) =>
      urlEntry({
        loc: `/${createAnimeSlug(title, id)}`,
        priority: "0.8",
        freq: "weekly",
      })
    );
    const file = `sitemap-anime-${part}.xml`;
    write(file, wrapUrlset(entries));
    files.push(file);
    part++;
  }
  return { files, count: ids.length };
}

// ── Movies / TV sitemap (TMDB popular + top rated) ───────────────────────────
async function buildMoviesSitemap() {
  const collect = async (type, endpoints, pages) => {
    const ids = new Set();
    for (const ep of endpoints) {
      for (let p = 1; p <= pages; p++) {
        const data = await fetchJson(
          `https://api.themoviedb.org/3/${type}/${ep}?api_key=${TMDB_KEY}&language=en-US&page=${p}`
        );
        for (const item of data?.results || []) if (item.id) ids.add(item.id);
      }
    }
    return [...ids];
  };

  const movieIds = await collect("movie", ["popular", "top_rated"], 5);
  const tvIds = await collect("tv", ["popular", "top_rated"], 5);

  const entries = [
    ...movieIds.map((id) =>
      urlEntry({ loc: `/movies/movie/${id}`, priority: "0.7", freq: "weekly" })
    ),
    ...tvIds.map((id) =>
      urlEntry({ loc: `/movies/tv/${id}`, priority: "0.7", freq: "weekly" })
    ),
  ];

  if (entries.length === 0) {
    console.warn("  ! no TMDB ids collected — skipping movies sitemap");
    return { built: false, movies: 0, tv: 0 };
  }
  write("sitemap-movies.xml", wrapUrlset(entries));
  return { built: true, movies: movieIds.length, tv: tvIds.length };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🗺️  Generating sitemaps for ${BASE}\n`);
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  // Remove every stale sitemap file so old/broken ones never linger.
  for (const f of fs.readdirSync(PUBLIC_DIR)) {
    if (/^sitemap.*\.xml$/i.test(f)) fs.rmSync(path.join(PUBLIC_DIR, f));
  }

  const childMaps = [];

  const pageCount = buildPagesSitemap();
  childMaps.push("sitemap-pages.xml");

  const anime = await buildAnimeSitemaps();
  childMaps.push(...anime.files);

  const movies = await buildMoviesSitemap();
  if (movies.built) childMaps.push("sitemap-movies.xml");

  write("sitemap.xml", wrapIndex(childMaps));

  console.log(
    `\n✅ Done — ${pageCount} page URLs, ${anime.count} unique anime` +
      (movies.built ? `, ${movies.movies} movies + ${movies.tv} TV` : "") +
      `\n   Index → ${BASE}/sitemap.xml (${childMaps.length} child maps)\n`
  );
}

main().catch((err) => {
  console.error("Sitemap generation failed, writing minimal fallback:", err);
  try {
    write("sitemap-pages.xml", wrapUrlset([urlEntry({ loc: "/", priority: "1.0", freq: "daily" })]));
    write("sitemap.xml", wrapIndex(["sitemap-pages.xml"]));
  } catch {}
  process.exitCode = 0; // never break the build
});
