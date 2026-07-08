import axios from "axios";
import { INFO_API } from "../config/api";

// Old /qtip/:id was removed. Build the tooltip from /details/:id.
const buildSlug = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getQtip = async (id) => {
  const api_url = INFO_API;
  const cleanId = String(id ?? "").split("-").pop();
  if (!cleanId) return null;

  try {
    const response = await axios.get(`${api_url}/details/${cleanId}`, {
      timeout: 15000,
    });

    const d = response.data?.data || response.data?.results || response.data;
    if (!d) return null;

    const title = d.title || d.titleEnglish || d.name || "";
    const episodes = d.episodes || d.totalEpisodes || null;

    return {
      title,
      japaneseTitle: d.titleNative || d.titleRomaji || "",
      rating: d.score ? String(d.score) : d.rating || "",
      quality: "HD",
      subCount: episodes || null,
      dubCount: null,
      episodeCount: episodes || null,
      type: d.type || d.format || "",
      description: String(d.description || d.synopsis || "").replace(/<[^>]*>/g, ""),
      Synonyms: "",
      airedDate: d.year ? String(d.year) : "",
      status: d.status || "",
      genres: Array.isArray(d.genres) ? d.genres : [],
      watchLink: `/watch/${buildSlug(title)}-${d.id || cleanId}`,
    };
  } catch (err) {
    console.error("Error fetching qtip info:", err);
    return null;
  }
};

export default getQtip;
