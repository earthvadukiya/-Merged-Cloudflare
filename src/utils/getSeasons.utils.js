import axios from "axios";

export default async function getSeasons(id) {
  const api_url = import.meta.env.VITE_API_URL;

  try {
    const response = await axios.get(`${api_url}/seasons/${id}`, {
      timeout: 30000,
    });

    return response.data?.results || [];
  } catch (error) {
    console.error("Error fetching seasons:", error);
    return [];
  }
}