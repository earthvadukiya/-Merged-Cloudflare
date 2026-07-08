import axios from "axios";
import { WATCH_API } from "../config/api";
import { cachedFetch } from "./apiCache.utils";

export default async function getEpisodes(id) {
  if (!id) return [];

  const api_url = WATCH_API;

  return cachedFetch(`episodes:${id}`, async () => {
    try {
      const response = await axios.get(`${api_url}/episodes/${id}`, {
        timeout: 30000,
      });

      return response.data?.data || response.data?.results || response.data?.episodes || [];
    } catch (error) {
      console.error("Error fetching episodes:", error);
      return [];
    }
  });
}
