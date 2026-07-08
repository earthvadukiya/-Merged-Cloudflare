import axios from "axios";
// The /tmdb/ endpoint (logos + episode thumbnails) only exists on the main
// HOME API (anime-details-api), so this enrichment call must always use HOME_API
// regardless of which page it is rendered on.
import { HOME_API } from "../config/api";

export default async function getTmdbInfo(id) {
  const api_url = HOME_API;

  try {
    const response = await axios.get(`${api_url}/tmdb/${id}`, {
      timeout: 30000,
    });

    return response.data?.data || null;
  } catch (error) {
    console.error("TMDB info error:", error);
    return null;
  }
}
