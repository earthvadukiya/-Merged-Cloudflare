import axios from "axios";

export default async function getSchedInfo(date) {
  const api_url = import.meta.env.VITE_API_URL;

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