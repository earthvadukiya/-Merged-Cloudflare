/**
 * TMDB data layer for the Movies / TV section.
 * Fully isolated from the anime API utils — does not touch any anime code.
 */
import axios from "axios";
import { readCache } from "@/src/lib/supabase";

// Read a Supabase-cached TMDB snapshot first (instant, CDN-served, refreshed
// hourly by the Edge Function). If it's missing/stale/disabled, fall through to
// the live TMDB call. This keeps the Movies homepage instant AND avoids hitting
// TMDB on every visitor.
async function cachedList(cacheKey, liveFetcher, mediaTypeHint) {
  const snap = await readCache(`tmdb:${cacheKey}`);
  if (snap?.data?.results?.length) {
    const tagged = mediaTypeHint
      ? snap.data.results.map((m) => ({ ...m, media_type: mediaTypeHint }))
      : snap.data.results;
    return normalizeList(tagged);
  }
  return liveFetcher();
}

// --- TMDB access strategy ---------------------------------------------------
//
// In PRODUCTION the browser talks to our OWN same-origin proxy at /api/tmdb/*
// (a Cloudflare Pages Function). The real TMDB key lives only on the server, so
// it never ships in the JS bundle and never shows up in DevTools.
//
// In LOCAL dev / static preview there's no edge function, so we fall back to
// calling TMDB directly with a public key. `import.meta.env.PROD` is true only
// in the built/deployed bundle.
const USE_PROXY = import.meta.env.PROD;

// Public fallback key — only used in local/static dev where the proxy is absent.
const TMDB_KEY =
  import.meta.env.VITE_TMDB_API_KEY &&
  import.meta.env.VITE_TMDB_API_KEY !== "REPLACE_WITH_YOUR_TMDB_V3_KEY"
    ? import.meta.env.VITE_TMDB_API_KEY
    : "1cf50e6248dc270629e802686245c2c8";

// Direct hosts used only in the dev fallback path. A mirror covers ISPs that
// block the primary host.
const TMDB_HOSTS = [
  "https://api.themoviedb.org/3",
  "https://api.tmdb.org/3",
];

// Whether we're actually using the proxy. Starts as USE_PROXY but flips to
// false if a probe shows the edge function isn't deployed (e.g. static preview),
// so the Movies section still works everywhere without leaking the key in prod.
let proxyActive = USE_PROXY;

const client = axios.create({
  baseURL: proxyActive ? "/api/tmdb" : TMDB_HOSTS[0],
  params: proxyActive ? { language: "en-US" } : { api_key: TMDB_KEY, language: "en-US" },
  timeout: 8000,
});

// Switch the client to direct-TMDB mode (used only if the proxy is unavailable).
function fallbackToDirect() {
  if (!proxyActive) return;
  proxyActive = false;
  client.defaults.baseURL = TMDB_HOSTS[0];
  client.defaults.params = { api_key: TMDB_KEY, language: "en-US" };
}

// On a failed request, transparently retry against the next host once.
client.interceptors.response.use(
  (res) => {
    // If the "proxy" responded with HTML (a SPA 404 page), the edge function
    // isn't there — fall back to direct TMDB for the rest of the session.
    const ct = res.headers?.["content-type"] || "";
    if (proxyActive && ct.includes("text/html")) {
      fallbackToDirect();
      return Promise.reject(new Error("tmdb-proxy-missing"));
    }
    return res;
  },
  async (error) => {
    const cfg = error.config || {};
    // Proxy mode: a 404/network error likely means no edge function — fall back
    // to direct TMDB once and retry the same request.
    if (proxyActive) {
      fallbackToDirect();
      try {
        return await client.request({
          ...cfg,
          baseURL: TMDB_HOSTS[0],
          params: { ...(cfg.params || {}), api_key: TMDB_KEY },
        });
      } catch (e) {
        return Promise.reject(e);
      }
    }
    const tried = cfg.__hostIndex ?? 0;
    if (tried < TMDB_HOSTS.length - 1 && !cfg.__noRetry) {
      const nextIndex = tried + 1;
      const retryCfg = {
        ...cfg,
        baseURL: TMDB_HOSTS[nextIndex],
        __hostIndex: nextIndex,
      };
      return client.request(retryCfg);
    }
    return Promise.reject(error);
  }
);

const IMG_BASE = "https://image.tmdb.org/t/p";

export const IMG = {
  poster: (path, size = "w500") => (path ? `${IMG_BASE}/${size}${path}` : ""),
  backdrop: (path, size = "w1280") => (path ? `${IMG_BASE}/${size}${path}` : ""),
  logo: (path, size = "w500") => (path ? `${IMG_BASE}/${size}${path}` : ""),
};

function pickLogo(images) {
  const logos = images?.logos || [];
  if (!logos.length) return "";
  const en = logos.find((l) => l.iso_639_1 === "en") || logos[0];
  return IMG.logo(en.file_path);
}

/**
 * Find the best YouTube trailer from a TMDB `videos` payload.
 * Preference: official Trailer > any Trailer > Teaser > Clip.
 */
function pickTrailerKey(videos) {
  const list = (videos?.results || []).filter((v) => v.site === "YouTube" && v.key);
  if (!list.length) return "";
  const byType = (type, official) =>
    list.find((v) => v.type === type && (official ? v.official : true));
  const candidate =
    byType("Trailer", true) ||
    byType("Trailer", false) ||
    byType("Teaser", false) ||
    byType("Clip", false) ||
    list[0];
  return candidate?.key || "";
}

export function mediaType(item) {
  if (item.media_type === "tv" || item.first_air_date || item.name) return "tv";
  return "movie";
}

export function normalizeCard(item) {
  const type = mediaType(item);
  const title = item.title || item.name || item.original_title || item.original_name || "";
  const date = item.release_date || item.first_air_date || "";
  return {
    id: item.id,
    type,
    title,
    poster: IMG.poster(item.poster_path, "w342"),
    backdrop: IMG.backdrop(item.backdrop_path),
    year: date ? date.slice(0, 4) : "",
    rating: item.vote_average ? Number(item.vote_average).toFixed(1) : null,
    overview: item.overview || "",
    adult: !!item.adult,
  };
}

export function normalizeList(results = []) {
  return results
    .filter((r) => (r.media_type ? r.media_type !== "person" : true))
    .filter((r) => r.poster_path || r.backdrop_path)
    .map(normalizeCard);
}

export async function getTrending(window = "week", page = 1) {
  const live = async () => {
    const { data } = await client.get(`/trending/all/${window}`, { params: { page } });
    return normalizeList(data.results);
  };
  if (window === "week" && page === 1) return cachedList("trending", live);
  return live();
}

const LOGO_CACHE = new Map();

export async function getLogo(type, id) {
  const key = `${type}:${id}`;
  if (LOGO_CACHE.has(key)) return LOGO_CACHE.get(key);
  try {
    const { data } = await client.get(`/${type}/${id}/images`, {
      params: { include_image_language: "en,null" },
    });
    const logo = pickLogo(data);
    LOGO_CACHE.set(key, logo);
    return logo;
  } catch {
    return "";
  }
}

/**
 * Return the spotlight items WITHOUT logos — instant (one trending call only).
 * The page renders the spotlight immediately from this, then logos are attached
 * progressively via `getSpotlightLogo` so the section never waits on 8 logo
 * requests (the old behaviour that made the Movies page hang on mobile).
 */
export async function getSpotlight(count = 8) {
  const trending = await getTrending("week");
  return trending.slice(0, count).map((item) => ({ ...item, logo: "" }));
}

/**
 * Fetch a single spotlight logo (used by the page to fill logos in one-by-one
 * after the spotlight is already on screen). Never throws.
 */
export async function getSpotlightLogo(item) {
  try {
    return await getLogo(item.type, item.id);
  } catch {
    return "";
  }
}

export async function getPopularMovies(page = 1) {
  const live = async () => {
    const { data } = await client.get("/movie/popular", { params: { page } });
    return normalizeList((data.results || []).map((m) => ({ ...m, media_type: "movie" })));
  };
  if (page === 1) return cachedList("movie-popular", live, "movie");
  return live();
}

export async function getTopRatedMovies(page = 1) {
  const live = async () => {
    const { data } = await client.get("/movie/top_rated", { params: { page } });
    return normalizeList((data.results || []).map((m) => ({ ...m, media_type: "movie" })));
  };
  if (page === 1) return cachedList("movie-top", live, "movie");
  return live();
}

export async function getNowPlaying(page = 1) {
  const { data } = await client.get("/movie/now_playing", { params: { page } });
  return normalizeList((data.results || []).map((m) => ({ ...m, media_type: "movie" })));
}

export async function getPopularTV(page = 1) {
  const live = async () => {
    const { data } = await client.get("/tv/popular", { params: { page } });
    return normalizeList((data.results || []).map((m) => ({ ...m, media_type: "tv" })));
  };
  if (page === 1) return cachedList("tv-popular", live, "tv");
  return live();
}

export async function getTopRatedTV(page = 1) {
  const live = async () => {
    const { data } = await client.get("/tv/top_rated", { params: { page } });
    return normalizeList((data.results || []).map((m) => ({ ...m, media_type: "tv" })));
  };
  if (page === 1) return cachedList("tv-top", live, "tv");
  return live();
}

export async function getAiringTodayTV(page = 1) {
  const { data } = await client.get("/tv/airing_today", { params: { page } });
  return normalizeList((data.results || []).map((m) => ({ ...m, media_type: "tv" })));
}

export async function discover(type = "movie", params = {}) {
  const { data } = await client.get(`/discover/${type}`, { params });
  return normalizeList((data.results || []).map((m) => ({ ...m, media_type: type })));
}

export async function getGenres(type = "movie") {
  const { data } = await client.get(`/genre/${type}/list`);
  return data.genres || [];
}

export async function searchMulti(query, page = 1) {
  if (!query) return [];
  const { data } = await client.get("/search/multi", {
    params: { query, page, include_adult: false },
  });
  return normalizeList(data.results);
}

export async function getMovieDetails(id) {
  const { data } = await client.get(`/movie/${id}`, {
    params: {
      append_to_response: "images,credits,videos,recommendations,release_dates",
      include_image_language: "en,null",
    },
  });
  return {
    id: data.id,
    type: "movie",
    title: data.title,
    overview: data.overview,
    poster: IMG.poster(data.poster_path),
    backdrop: IMG.backdrop(data.backdrop_path),
    logo: pickLogo(data.images),
    trailerKey: pickTrailerKey(data.videos),
    year: data.release_date ? data.release_date.slice(0, 4) : "",
    releaseDate: data.release_date,
    runtime: data.runtime,
    rating: data.vote_average ? Number(data.vote_average).toFixed(1) : null,
    voteCount: data.vote_count,
    genres: data.genres || [],
    tagline: data.tagline,
    status: data.status,
    imdbId: data.imdb_id,
    cast: (data.credits?.cast || []).slice(0, 18).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile: IMG.poster(c.profile_path, "w185"),
    })),
    recommendations: normalizeList(
      (data.recommendations?.results || []).map((m) => ({
        ...m,
        media_type: "movie",
      }))
    ),
  };
}

export async function getTVDetails(id) {
  const { data } = await client.get(`/tv/${id}`, {
    params: {
      append_to_response: "images,credits,videos,recommendations,external_ids",
      include_image_language: "en,null",
    },
  });
  return {
    id: data.id,
    type: "tv",
    title: data.name,
    imdbId: data.external_ids?.imdb_id || "",
    overview: data.overview,
    poster: IMG.poster(data.poster_path),
    backdrop: IMG.backdrop(data.backdrop_path),
    logo: pickLogo(data.images),
    trailerKey: pickTrailerKey(data.videos),
    year: data.first_air_date ? data.first_air_date.slice(0, 4) : "",
    firstAirDate: data.first_air_date,
    lastAirDate: data.last_air_date,
    rating: data.vote_average ? Number(data.vote_average).toFixed(1) : null,
    voteCount: data.vote_count,
    genres: data.genres || [],
    tagline: data.tagline,
    status: data.status,
    numberOfSeasons: data.number_of_seasons,
    numberOfEpisodes: data.number_of_episodes,
    seasons: (data.seasons || []).filter(
      (s) => s.season_number > 0 || data.seasons.length === 1
    ),
    cast: (data.credits?.cast || []).slice(0, 18).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile: IMG.poster(c.profile_path, "w185"),
    })),
    recommendations: normalizeList(
      (data.recommendations?.results || []).map((m) => ({
        ...m,
        media_type: "tv",
      }))
    ),
  };
}

export async function getSeasonEpisodes(tvId, seasonNumber) {
  const { data } = await client.get(`/tv/${tvId}/season/${seasonNumber}`);
  return (data.episodes || []).map((e) => ({
    id: e.id,
    episodeNumber: e.episode_number,
    seasonNumber: e.season_number,
    name: e.name,
    overview: e.overview,
    still: IMG.backdrop(e.still_path, "w500"),
    airDate: e.air_date,
    runtime: e.runtime,
    rating: e.vote_average ? Number(e.vote_average).toFixed(1) : null,
  }));
}

export async function getDetails(type, id) {
  return type === "tv" ? getTVDetails(id) : getMovieDetails(id);
}
