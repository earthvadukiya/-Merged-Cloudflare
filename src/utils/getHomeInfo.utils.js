import axios from "axios";

const CACHE_KEY = "offanime-home-cache-v1";
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes browser cache

const EMPTY_HOME_DATA = {
  spotlights: [],
  trending: [],
  topten: [],
  todaySchedule: [],
  top_airing: [],
  most_popular: [],
  most_favorite: [],
  latest_completed: [],
  latest_episode: [],
  top_upcoming: [],
  recently_added: [],
  genres: [],
};

function readLocalCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached?.data) return null;

    return {
      fresh: Date.now() - Number(cached.time || 0) < CACHE_TTL,
      data: cached.data,
    };
  } catch {
    return null;
  }
}

function saveLocalCache(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        time: Date.now(),
        data,
      })
    );
  } catch {
    // ignore storage errors
  }
}

function normalizeAnime(item = {}) {
  const title =
    item.title ||
    item.name ||
    item.animeTitle ||
    item.japaneseTitle ||
    "Unknown";

  const poster =
    item.poster ||
    item.image ||
    item.img ||
    item.cover ||
    item.coverImage ||
    "";

  return {
    ...item,
    id: item.id || item.anilistId || item.malId || item.session || title,
    anilistId: item.anilistId || item.id,
    malId: item.malId || null,
    title,
    name: item.name || title,
    poster,
    image: item.image || poster,
    banner: item.banner || item.bannerImage || poster,
    description: item.description || item.synopsis || "",
    type: item.type || item.format || "TV",
    episodes: item.episodes || item.episode || "?",
    episode: item.episode || item.episodes || "?",
    status: item.status || "",
    year: item.year || item.seasonYear || "",
    season: item.season || "",
    score: item.score || item.averageScore || null,
    genres: item.genres || [],
  };
}

function normalizeList(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(Boolean).map(normalizeAnime);
}

function normalizeHomeResponse(responseData = {}) {
  const r = responseData?.results || responseData || {};

  return {
    spotlights: normalizeList(r.spotlights || r.spotlight),
    trending: normalizeList(r.trending),
    topten: normalizeList(r.topTen || r.topten || r.top_10),
    todaySchedule: normalizeList(r.today || r.todaySchedule),
    top_airing: normalizeList(r.topAiring || r.top_airing),
    most_popular: normalizeList(r.mostPopular || r.most_popular),
    most_favorite: normalizeList(r.mostFavorite || r.most_favorite),
    latest_completed: normalizeList(r.latestCompleted || r.latest_completed),
    latest_episode: normalizeList(r.latestEpisode || r.latest_episode),
    top_upcoming: normalizeList(r.topUpcoming || r.top_upcoming),
    recently_added: normalizeList(r.recentlyAdded || r.recently_added),
    genres: Array.isArray(r.genres) ? r.genres : [],
  };
}

export default async function getHomeInfo() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const cached = readLocalCache();

  if (cached?.fresh) {
    return cached.data;
  }

  try {
    if (!apiUrl) {
      console.error("VITE_API_URL missing in .env");
      return cached?.data || EMPTY_HOME_DATA;
    }

    const response = await axios.get(`${apiUrl}/home`, {
      timeout: 8000,
      headers: {
        Accept: "application/json",
      },
    });

    const homeData = normalizeHomeResponse(response.data);

    saveLocalCache(homeData);

    return homeData;
  } catch (error) {
    console.error("getHomeInfo error:", error?.message || error);

    if (cached?.data) {
      return cached.data;
    }

    return EMPTY_HOME_DATA;
  }
}
