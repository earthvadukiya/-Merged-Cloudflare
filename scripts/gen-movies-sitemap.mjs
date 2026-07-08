/**
 * Generates public/sitemap-movies.xml for the Movies / TV section.
 * Pulls popular + top-rated + trending Movies and TV from TMDB and emits
 * canonical info-page URLs:  https://offanime.cc/movies/<type>/<id>
 *
 * Run:  node scripts/gen-movies-sitemap.mjs
 */
import fs from "node:fs";
import path from "node:path";

const TMDB_KEY = process.env.VITE_TMDB_API_KEY || "64b03fca3936439f3d3da531973e5ff9";
const BASE = "https://offanime.cc";
const OUT = path.resolve("public/sitemap-movies.xml");
const today = new Date().toISOString().slice(0, 10);

const HOSTS = ["https://api.themoviedb.org/3", "https://api.tmdb.org/3"];

async function tmdb(pathname, params = {}) {
  const qs = new URLSearchParams({ api_key: TMDB_KEY, language: "en-US", ...params });
  let lastErr;
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}${pathname}?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function collect(type, endpoints, pages) {
  const ids = new Map(); // id -> popularity (for priority)
  for (const ep of endpoints) {
    for (let p = 1; p <= pages; p++) {
      try {
        const data = await tmdb(`/${type}/${ep}`, { page: String(p) });
        for (const item of data.results || []) {
          if (item.id) ids.set(item.id, item.popularity || 0);
        }
      } catch {
        /* skip a failed page, keep going */
      }
    }
  }
  return ids;
}

function urlBlock(type, id, popularity) {
  // Higher popularity → higher priority (clamped 0.5–0.9) so Google crawls the
  // hottest titles first → faster ranking for trending content.
  const pr = Math.min(0.9, Math.max(0.5, 0.5 + (popularity > 500 ? 0.4 : popularity / 1250)));
  return `  <url>
    <loc>${BASE}/movies/${type}/${id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${pr.toFixed(1)}</priority>
  </url>`;
}

async function main() {
  console.log("Fetching TMDB movies + TV ...");
  const movieIds = await collect("movie", ["popular", "top_rated", "now_playing", "upcoming"], 10);
  const tvIds = await collect("tv", ["popular", "top_rated", "on_the_air", "airing_today"], 10);

  const blocks = [];
  // Section landing pages first (high priority).
  for (const [loc, pr] of [
    ["/movies", "1.0"],
    ["/movies/trending", "0.9"],
    ["/movies/category/popular-movies", "0.8"],
    ["/movies/category/now-playing", "0.8"],
    ["/movies/category/popular-tv", "0.8"],
    ["/movies/category/top-movies", "0.8"],
    ["/movies/category/top-tv", "0.8"],
  ]) {
    blocks.push(`  <url>
    <loc>${BASE}${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${pr}</priority>
  </url>`);
  }

  for (const [id, pop] of movieIds) blocks.push(urlBlock("movie", id, pop));
  for (const [id, pop] of tvIds) blocks.push(urlBlock("tv", id, pop));

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blocks.join("\n")}
</urlset>
`;
  fs.writeFileSync(OUT, xml, "utf8");
  console.log(`Wrote ${OUT} with ${blocks.length} URLs (${movieIds.size} movies, ${tvIds.size} TV).`);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
