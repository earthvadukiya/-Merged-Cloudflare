// ────────────────────────────────────────────────────────────────────────────
// TMDB BANNER RESOLVER (anime section)
//
// The anime APIs return AniList banner images by default (s4.anilist.co). Those
// are low-res, often missing, and inconsistent in size. This helper resolves a
// proper high-resolution TMDB *backdrop* for an anime so the spotlight / hero /
// other banners look premium and consistent.
//
// HOW IT WORKS
//   1. Our own /tmdb/:id endpoint (HOME_API) maps an AniList/anime id -> the
//      real TMDB id + the anime logo. We read `tmdbId` and `logo`.
//   2. With that tmdbId we hit TMDB's /tv/:id/images (and /movie fallback) to
//      pull the best language-agnostic backdrop at original size.
//   3. Everything is cached in-memory + sessionStorage so navigating around the
//      site never refetches the same banner.
//
// It NEVER throws — every failure path returns a graceful fallback so the UI is
// always populated (TMDB banner -> anime API banner -> poster).
// ────────────────────────────────────────────────────────────────────────────
import { HOME_API } from "../config/api";

// In production, go through our same-origin /api/tmdb proxy so the key stays on
// the server. In dev (or if the proxy isn't deployed) fall back to direct TMDB.
const USE_PROXY = import.meta.env.PROD;

const TMDB_KEY =
  import.meta.env.VITE_TMDB_API_KEY &&
  import.meta.env.VITE_TMDB_API_KEY !== "REPLACE_WITH_YOUR_TMDB_V3_KEY"
    ? import.meta.env.VITE_TMDB_API_KEY
    : "1cf50e6248dc270629e802686245c2c8";

// Two official hosts — some mobile ISPs block the primary, so we fail over.
const TMDB_HOSTS = ["https://api.themoviedb.org/3", "https://api.tmdb.org/3"];
const IMG_BASE = "https://image.tmdb.org/t/p";

// id (anime id) -> { banner, logo, tmdbId }
const BANNER_CACHE = new Map();
// id -> Promise (so multiple components asking at once share one round-trip)
const INFLIGHT = new Map();

const SS_KEY = "tmdbBannerCache_v1";

// Hydrate the in-memory cache from sessionStorage once on load.
(function hydrate() {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    Object.entries(obj).forEach(([k, v]) => BANNER_CACHE.set(Number(k), v));
  } catch {
    /* noop */
  }
})();

function persist() {
  try {
    const obj = {};
    BANNER_CACHE.forEach((v, k) => {
      obj[k] = v;
    });
    sessionStorage.setItem(SS_KEY, JSON.stringify(obj));
  } catch {
    /* quota / disabled — in-memory cache still works */
  }
}

async function tmdbGet(pathname, params = {}, signal) {
  // Production: one call to our same-origin proxy (key added server-side).
  if (USE_PROXY) {
    try {
      const qs = new URLSearchParams({ ...params });
      const res = await fetch(`/api/tmdb${pathname}?${qs}`, { signal });
      const ct = res.headers.get("content-type") || "";
      // HTML => the edge function isn't deployed; fall through to direct TMDB.
      if (res.ok && ct.includes("application/json")) return await res.json();
    } catch {
      /* fall through to direct below */
    }
  }
  // Dev / fallback: direct TMDB with the public key, trying each host.
  const qs = new URLSearchParams({ api_key: TMDB_KEY, ...params });
  let lastErr;
  for (const host of TMDB_HOSTS) {
    try {
      const res = await fetch(`${host}${pathname}?${qs}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

// Pick the widest, language-neutral backdrop (no embedded text) for a clean hero.
function pickBackdrop(images, size = "original") {
  const list = images?.backdrops || [];
  if (!list.length) return "";
  const sorted = [...list].sort((a, b) => {
    const aNeutral = a.iso_639_1 == null ? 1 : 0;
    const bNeutral = b.iso_639_1 == null ? 1 : 0;
    if (aNeutral !== bNeutral) return bNeutral - aNeutral;
    return (b.width || 0) - (a.width || 0);
  });
  const best = sorted[0];
  return best?.file_path ? `${IMG_BASE}/${size}${best.file_path}` : "";
}

async function resolveTmdbBanner(animeId, signal) {
  let tmdbId = null;
  let logo = "";
  try {
    const res = await fetch(`${HOME_API}/tmdb/${animeId}`, { signal });
    const json = await res.json();
    const data = json?.data || {};
    tmdbId = data.tmdbId || null;
    logo = data.logo || "";
  } catch {
    /* no enrichment available */
  }

  if (!tmdbId) return { banner: "", logo, tmdbId: null };

  let banner = "";
  try {
    const tv = await tmdbGet(
      `/tv/${tmdbId}/images`,
      { include_image_language: "en,ja,null" },
      signal
    );
    banner = pickBackdrop(tv);
  } catch {
    /* try movie below */
  }

  if (!banner) {
    try {
      const mv = await tmdbGet(
        `/movie/${tmdbId}/images`,
        { include_image_language: "en,ja,null" },
        signal
      );
      banner = pickBackdrop(mv);
    } catch {
      /* caller falls back to anime API image */
    }
  }

  return { banner, logo, tmdbId };
}

/**
 * Resolve a high-res TMDB banner + logo for an anime id.
 * Always resolves (never rejects). Shape: { banner, logo, tmdbId }.
 */
export default async function getTmdbBanner(animeId, signal) {
  if (!animeId) return { banner: "", logo: "", tmdbId: null };

  if (BANNER_CACHE.has(animeId)) return BANNER_CACHE.get(animeId);
  if (INFLIGHT.has(animeId)) return INFLIGHT.get(animeId);

  const p = (async () => {
    let result = { banner: "", logo: "", tmdbId: null };
    try {
      result = await resolveTmdbBanner(animeId, signal);
    } catch {
      /* keep empty result */
    }
    BANNER_CACHE.set(animeId, result);
    persist();
    INFLIGHT.delete(animeId);
    return result;
  })();

  INFLIGHT.set(animeId, p);
  return p;
}

/** Synchronous read of an already-cached banner (no network). */
export function getCachedTmdbBanner(animeId) {
  return BANNER_CACHE.get(animeId) || null;
}
