import axios from "axios";
import { HOME_API } from "../config/api";

export default async function getCategoryInfo(path, page = 1, genre = "") {
  const api_url = HOME_API;

  try {
    if (!api_url) {
      console.error("VITE_API_URL missing");
      return { results: [], data: [], paginationInfo: null };
    }

    const cleanPath = String(path || "").replace(/^\/+/, "");

    const params = { page };

    if (cleanPath === "genre" && genre) {
      params.genre = String(genre).replaceAll("-", " ");
    }

    const response = await axios.get(`${api_url}/category/${cleanPath}`, {
      params,
      timeout: 30000,
    });

    return (
      response.data || {
        results: [],
        data: [],
        paginationInfo: null,
      }
    );
  } catch (error) {
    console.error("Category fetch error:", error);

    return {
      results: [],
      data: [],
      paginationInfo: null,
    };
  }
}
