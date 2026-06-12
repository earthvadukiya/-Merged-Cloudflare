import axios from "axios";

export default async function getTmdbInfo(id) {
  const api_url = import.meta.env.VITE_API_URL;

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
