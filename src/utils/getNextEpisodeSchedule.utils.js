import axios from "axios";
import { INFO_API } from "../config/api";

// Old /schedule/:id was removed. Derive from /details/:id or return null.
const getNextEpisodeSchedule = async (id) => {
  const api_url = INFO_API;
  const cleanId = String(id ?? "").split("-").pop();
  if (!cleanId) return null;

  try {
    const response = await axios.get(`${api_url}/details/${cleanId}`, {
      timeout: 15000,
    });

    const d = response.data?.data || response.data?.results || response.data;
    if (!d) return null;

    const status = String(d.status || "").toLowerCase();
    const isAiring = status.includes("releasing") || status.includes("airing");
    if (!isAiring) return null;

    return {
      broadcast: d.broadcast || null,
      status: d.status || "",
      nextAiringEpisode: d.nextAiringEpisode || null,
    };
  } catch (err) {
    console.error("Error fetching next episode schedule:", err);
    return null;
  }
};

export default getNextEpisodeSchedule;
