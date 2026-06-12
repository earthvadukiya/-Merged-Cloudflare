import axios from "axios";

const CACHE_KEY = "topSearch";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

export default async function getTopSearch() {
  const api_url = import.meta.env.VITE_API_URL;

  try {
    const storedData = localStorage.getItem(CACHE_KEY);

    if (storedData) {
      const { data, timestamp } = JSON.parse(storedData);

      if (Date.now() - timestamp <= CACHE_DURATION && Array.isArray(data)) {
        return data;
      }
    }

    const response = await axios.get(`${api_url}/top-search`, {
      timeout: 30000,
    });

    const results = response.data?.results || [];

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: results,
        timestamp: Date.now(),
      })
    );

    return results;
  } catch (error) {
    console.error("Error fetching top search:", error);
    return [];
  }
}