import axios from "axios";
import { HOME_API } from "../config/api";

// Old /producer/:producer was removed. Approximate with /search?q=<name>.
// Producer component expects: { data: [...anime...], totalPages }.
const getProducer = async (producer, page = 1) => {
  const api_url = HOME_API;
  const query = String(producer || "").split("-").join(" ").trim();
  if (!query) return { data: [], totalPages: 0 };

  try {
    const response = await axios.get(`${api_url}/search`, {
      params: { q: query, page },
      timeout: 30000,
    });

    const results =
      response.data?.data ||
      response.data?.results ||
      (Array.isArray(response.data) ? response.data : []) ||
      [];

    return { data: Array.isArray(results) ? results : [], totalPages: 1 };
  } catch (err) {
    console.error("Error fetching producer info:", err);
    return { data: [], totalPages: 0 };
  }
};

export default getProducer;
