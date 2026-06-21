import axios from "axios";
import { WATCH_API } from "../config/api";

export default async function getEpisodes(id) {
  const api_url = WATCH_API;

  try {
    const response = await axios.get(`${api_url}/episodes/${id}`, {
      timeout: 30000,
    });

    return response.data?.results || [];
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return [];
  }
}
