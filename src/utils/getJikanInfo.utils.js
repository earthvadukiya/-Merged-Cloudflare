import axios from "axios";

export default async function getJikanInfo(malId) {
  try {
    const apiUrl = import.meta.env.VITE_API_URL;

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
