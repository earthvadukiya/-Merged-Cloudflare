import axios from "axios";
import { INFO_API } from "../config/api";

export default async function getJikanInfo(malId) {
  try {
    const apiUrl = INFO_API;

    const response = await axios.get(
      `${apiUrl}/jikan/anime/${malId}`,
      {
        timeout: 30000,
      }
    );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "Jikan fetch failed:",
      error?.response?.status || error.message
    );

    return null;
  }
}
