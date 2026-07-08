import axios from "axios";
import { getCached, setCached } from "./apiCache.utils";

/**
 * Resolve an anime's TMDB id from its title.
 *
 * Anime exists on TMDB as TV series (and sometimes movies), but our anime data
 * layer only has AniList / MAL ids — not TMDB. Download sites like VidVault and
 * StreamRip are TMDB-keyed, so to deep-link them for anime we look the title up
 * on TMDB's search API and grab the best match. Cached so we only resolve once.
 */

// In production, route through our same-origin proxy so the TMDB key stays on
// the server (never in the bundle / DevTools). In dev, hit TMDB directly.
const USE_PROXY = import.meta.env.PROD;

const TMDB_KEY =
  import.meta.env.VITE_TMDB_API_KEY &&
  import.meta.env.VITE_TMDB_API_KEY !== "REPLACE_WITH_YOUR_TMDB_V3_KEY"
    ? import.meta.env.VITE_TMDB_API_KEY
    : "1cf50e6248dc270629e802686245c2c8";

const TMDB_HOSTS = [
  "https://api.themoviedb.org/3",
  "https://api.tmdb.org/3",
];

// Strip season/part decorations so "Re:Zero ... Season 2" matches the base show
// on TMDB (TMDB lists all seasons under one TV entry).
function baseTitle(title = "") {
  let q = String(title || "").trim();
  q = q.replace(/\s*[-–—]\s*[^-–—]+\s*[-–—].*$/, "");
  q = q.replace(/\b(\d+(st|nd|rd|th)|final|the)\s+(season|part|cour|chapter)\b/gi, " ");
  q = q.replace(/\b(season|series|part|cour|saison|chapter)\b\s*\d*/gi, " ");
  q = q.replace(/\b(\d+(st|nd|rd|th)|final)\b\s*$/gi, " ");
  q = q.replace(/\s+\b([ivx]{1,4})\b\s*$/i, " ");
  q = q.replace(/\s+/g, " ").trim();
  return q || String(title || "").trim();
}

async function tmdbGet(path, params) {
  // Production: single call to our same-origin proxy (server adds the key +
  // handles host failover). `path` starts with "/", proxy base is "/api/tmdb".
  if (USE_PROXY) {
    try {
      const res = await axios.get(`/api/tmdb${path}`, {
        params: { ...params },
        timeout: 8000,
      });
      // A SPA 404 returns HTML, not JSON — treat that as "proxy missing".
      if (typeof res.data === "string") throw new Error("tmdb-proxy-missing");
      return res.data;
    } catch {
      /* fall through to direct TMDB below */
    }
  }
  // Dev fallback (and prod fallback if the proxy isn't deployed): hit TMDB
  // directly with the public key, trying each host.
  let lastErr;
  for (const host of TMDB_HOSTS) {
    try {
      const res = await axios.get(`${host}${path}`, {
        params: { api_key: TMDB_KEY, ...params },
        timeout: 8000,
      });
      return res.data;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

/**
 * @returns {Promise<{tmdbId:number, type:"tv"|"movie"}|null>}
 */
export default async function resolveAnimeTmdb(title) {
  const q = baseTitle(title);
  if (!q) return null;

  const key = `animeTmdb:${q.toLowerCase()}`;
  const cached = getCached(key, 24 * 60 * 60 * 1000); // 24h
  if (cached !== undefined) return cached;

  try {
    // Prefer TV (most anime are series). Fall back to movie if no TV match.
    const tv = await tmdbGet("/search/tv", { query: q, language: "en-US" });
    const tvHit = tv?.results?.[0];
    if (tvHit?.id) {
      const out = { tmdbId: tvHit.id, type: "tv" };
      setCached(key, out);
      return out;
    }

    const movie = await tmdbGet("/search/movie", { query: q, language: "en-US" });
    const movieHit = movie?.results?.[0];
    if (movieHit?.id) {
      const out = { tmdbId: movieHit.id, type: "movie" };
      setCached(key, out);
      return out;
    }
  } catch (err) {
    console.warn("resolveAnimeTmdb failed:", err?.message || err);
  }

  // Cache the miss too (as null) so we don't re-query a title with no match.
  setCached(key, null);
  return null;
}
