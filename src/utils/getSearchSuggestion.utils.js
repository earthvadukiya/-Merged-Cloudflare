import axios from "axios";
import { HOME_API } from "../config/api";

// Old /search/suggest?keyword= was removed. Derive from /search?q=.
const getSearchSuggestion = async (keyword) => {
  const api_url = HOME_API;
  const q = String(keyword || "").trim();
  if (!q) return [];

  try {
    const response = await axios.get(`${api_url}/search`, {
      params: { q },
      timeout: 30000,
    });

    const results =
      response.data?.data ||
      response.data?.results ||
      (Array.isArray(response.data) ? response.data : []) ||
      [];

    return Array.isArray(results) ? results.slice(0, 10) : [];
  } catch (err) {
    console.error("Error fetching search suggestions:", err);
    return [];
  }
};

export default getSearchSuggestion;
