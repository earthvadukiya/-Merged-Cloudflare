import axios from "axios";
import { HOME_API } from "../config/api";

export default async function getSchedInfo(date) {
  const api_url = HOME_API;

  try {
    if (!date) return [];

    const response = await axios.get(`${api_url}/schedule`, {
      params: { date },
      timeout: 30000,
    });

    return response.data?.results || [];
  } catch (error) {
    console.error("Schedule fetch error:", error);
    return [];
  }
}