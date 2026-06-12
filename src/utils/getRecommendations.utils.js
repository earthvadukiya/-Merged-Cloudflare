import axios from "axios";

export default async function getRecommendations(id) {
  const api_url = import.meta.env.VITE_API_URL;

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