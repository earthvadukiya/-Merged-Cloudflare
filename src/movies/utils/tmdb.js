/**
 * TMDB data layer for the Movies / TV section.
 * Fully isolated from the anime API utils — does not touch any anime code.
 */
import axios from "axios";

// Prefer the user's own key; fall back to a known-working public v3 key.
const TMDB_KEY =
  import.meta.env.VITE_TMDB_API_KEY &&
  import.meta.env.VITE_TMDB_API_KEY !== "REPLACE_WITH_YOUR_TMDB_V3_KEY"
    ? import.meta.env.VITE_TMDB_API_KEY
    : "1cf50e6248dc270629e802686245c2c8";

// Primary TMDB host + a mirror. Some mobile ISPs (notably in IN/parts of Asia)
// block `api.themoviedb.org`, which is why the anime site worked on the phone
// but Movies hung forever. If the primary host fails (timeout/network/blocked),
// we automatically retry the SAME request against a CORS-friendly mirror so the
// section keeps working on those networks.
const TMDB_HOSTS = [
  "https://api.themoviedb.org/3",
  "https://api.tmdb.org/3", // alternate official host (different IP, often unblocked)
];

const client = axios.create({
  baseURL: TMDB_HOSTS[0],
  params: { api_key: TMDB_KEY, language: "en-US" },
  // Mobile networks can stall a request forever — a hard timeout means the UI
  // gets an error fast instead of spinning indefinitely. The callers below use
  // Promise.allSettled + safe fallbacks so one failed row never blanks the page.
  timeout: 8000,
});

// On a failed request, transparently retry against the next host once.
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const cfg = error.config || {};
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
    // Card posters are small (~130-180px) — w342 is plenty and ~50% lighter
    // than w500, which noticeably speeds up the grid on mobile data.
    poster: IMG.poster(item.poster_path, "w342"),
    // Spotlight uses w780 backdrops (smaller than w1280) — sharp on phones,
    // far less to download than the full-size image.
    backdrop: IMG.backdrop(item.backdrop_path, "w780"),
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
  const { data } = await client.get(`/trending/all/${window}`, { params: { page } });
  return normalizeList(data.results);
}

export async function getLogo(type, id) {
  try {
    const { data } = await client.get(`/${type}/${id}/images`, {
      params: { include_image_language: "en,null" },
    });
    return pickLogo(data);
  } catch {
    return "";
  }
}

/**
 * attachLogos — given a list of cards, fetch each title's logo image and merge
 * it in. Called in the BACKGROUND from MoviesHome AFTER the hero is already on
 * screen, so these extra requests never delay first paint (the old getSpotlight
 * blocked the whole page on 8 logo calls, which is what made mobile take 35s).
 */
export async function attachLogos(items = []) {
  const settled = await Promise.allSettled(
    items.map(async (item) => ({ ...item, logo: await getLogo(item.type, item.id) }))
  );
  return settled.map((r, i) =>
    r.status === "fulfilled" ? r.value : { ...items[i], logo: "" }
  );
}

// Kept for any other callers; now just trending + background logos.
export async function getSpotlight(count = 8) {
  const trending = await getTrending("week");
  return attachLogos(trending.slice(0, count));
}

export async function getPopularMovies(page = 1) {
  const { data } = await client.get("/movie/popular", { params: { page } });
  return normalizeList((data.results || []).map((m) => ({ ...m, media_type: "movie" })));
}

export async function getTopRatedMovies(page = 1) {
  const { data } = await client.get("/movie/top_rated", { params: { page } });
  return normalizeList((data.results || []).map((m) => ({ ...m, media_type: "movie" })));
}

export async function getNowPlaying(page = 1) {
  const { data } = await client.get("/movie/now_playing", { params: { page } });
  return normalizeList((data.results || []).map((m) => ({ ...m, media_type: "movie" })));
}

export async function getPopularTV(page = 1) {
  const { data } = await client.get("/tv/popular", { params: { page } });
  return normalizeList((data.results || []).map((m) => ({ ...m, media_type: "tv" })));
}

export async function getTopRatedTV(page = 1) {
  const { data } = await client.get("/tv/top_rated", { params: { page } });
  return normalizeList((data.results || []).map((m) => ({ ...m, media_type: "tv" })));
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
      append_to_response: "images,credits,videos,recommendations",
      include_image_language: "en,null",
    },
  });
  return {
    id: data.id,
    type: "tv",
    title: data.name,
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
