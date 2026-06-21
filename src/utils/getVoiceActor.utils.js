import axios from "axios";
import { INFO_API } from "../config/api";

export default async function fetchVoiceActorInfo(id, page = 1) {
  const api_url = INFO_API;

  try {
    const response = await axios.get(
      `${api_url}/character/list/${id}?page=${page}`,
      { timeout: 30000 }
    );

    return response.data?.results || [];
  } catch (error) {
    console.error("Error fetching voice actors:", error);
    return [];
  }
}