import axios from "axios";
import { INFO_API } from "../config/api";

export default async function getRecommendations(id) {
  const api_url = INFO_API;

  try {
    const response = await axios.get(`${api_url}/recommendations/${id}`, {
      timeout: 30000,
    });

    return response.data?.results || [];
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}