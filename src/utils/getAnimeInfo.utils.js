import axios from "axios";
import { HOME_API, INFO_API } from "../config/api";

function cleanText(text = "") {
  return String(text)
    .replace(/<[^>]*>/g, "")
    .replace(/\\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\\"/g, '"')
    .trim();
}

function normalizeStatus(status = "") {
  const text = String(status).replaceAll("_", " ").trim();
  const lower = text.toLowerCase();

  if (lower.includes("finished") || lower.includes("completed")) {
    return "Completed";
  }

  if (lower.includes("not yet")) {
    return "Upcoming";
  }

  if (lower.includes("releasing") || lower.includes("currently airing")) {
    return "Airing";
  }

  return text || "";
}

function normalizeForTheme(item = {}) {
  const title = item.title || item.name || "Unknown";
  const poster = item.poster || item.image || "";
  const banner = item.banner || poster;

  const malId =
    item.malId ||
    item.idMal ||
    item.mal_id ||
    item.malID ||
    item.mappings?.mal ||
    item.mappings?.malId ||
    item.externalIds?.mal ||
    item.externalIds?.malId ||
    item.ids?.mal ||
    item.ids?.malId ||
    null;

  const status = normalizeStatus(item.status || "");
  const isCompleted = status === "Completed";

  return {
    id: item.id,
    anilistId: item.anilistId || item.id,

    malId,
    idMal: malId,
    mal_id: malId,
    malID: malId,

    title,
    name: title,
    animeTitle: title,
    japanese_title: item.japaneseTitle || "",

    poster,
    image: poster,
    banner,

    description: cleanText(item.description),
    genres: item.genres || [],
    status,
    type: item.type || "TV",
    duration: item.duration || "",
    season: item.season || "",
    year: item.year || "",
    studios: item.studios || [],
    score: item.score || "",
    episodes: item.episodes || item.totalEpisodes || null,
    totalEpisodes: item.totalEpisodes || item.episodes || null,

    nextAiringEpisode: isCompleted ? null : item.nextAiringEpisode || null,
    nextEpisode: isCompleted ? null : item.nextEpisode || null,
    broadcast: isCompleted ? null : item.broadcast || null,

    animeInfo: {
      Overview: cleanText(item.description),
      Genres: item.genres || [],
      Status: status,
      Type: item.type || "TV",
      Duration: item.duration ? `${item.duration} min` : "",
      Premiered: item.season && item.year ? `${item.season} ${item.year}` : "",
      Aired: item.year ? String(item.year) : "",
      Studios: item.studios || [],
      Producers: item.studios || [],
      "MAL Score": item.score || "",
      Japanese: item.japaneseTitle || "",
      Synonyms: "",

      tvInfo: {
        rating: item.score ? String(item.score) : "",
        quality: "HD",
        sub: item.episodes || item.totalEpisodes || "?",
        dub: item.dubEpisodes || item.dub || "N/A",
      },
    },

    adultContent: false,
    charactersVoiceActors: [],
    recommended_data: [],
  };
}

export default async function fetchAnimeInfo(id, random = false) {
  const api_url = INFO_API;

  try {
    let animeId = id;

    if (random) {
      // The random-pick uses HOME data (trending list), so it goes to HOME_API.
      const homeRes = await axios.get(`${HOME_API}/home`, {
        timeout: 8000,
      });

      const list =
        homeRes.data?.results?.trending ||
        homeRes.data?.trending ||
        [];

      animeId = list[Math.floor(Math.random() * list.length)]?.id;
    }

    if (!animeId) {
      throw new Error("Missing anime ID");
    }

    const response = await axios.get(`${api_url}/details/${animeId}`, {
      timeout: 10000,
    });

    const raw =
      response.data?.data ||
      response.data?.results ||
      response.data?.anime ||
      response.data ||
      {};

    const normalized = normalizeForTheme(raw);

    return {
      data: normalized,
      seasons: [],
    };
  } catch (error) {
    console.error("Error fetching anime info:", error?.message || error);
    return null;
  }
}
