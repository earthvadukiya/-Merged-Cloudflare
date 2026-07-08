import axios from "axios";
import { HOME_API } from "../config/api";

// Handles both category browsing and A-Z listing against the new API.
//   /category/:type?page=&genre=  -> { success, source, data:{ results, paginationInfo, ... } }
//   /az-list/:letter?page=        -> { success, source, data:{ results, paginationInfo, ... } }
//   /az-list?page=                -> { success, source, data:{ results, paginationInfo, ... } }
export default async function getCategoryInfo(path, page = 1, genre = "") {
  const api_url = HOME_API;
  const EMPTY = { results: [], data: [], paginationInfo: null };

  try {
    if (!api_url) {
      console.error("VITE_API_URL missing");
      return EMPTY;
    }

    const cleanPath = String(path || "").replace(/^\/+/, "");
    const params = { page };

    let endpoint;
    if (cleanPath === "az-list" || cleanPath.startsWith("az-list/")) {
      // A-Z list lives at its own top-level route, NOT under /category.
      endpoint = `${api_url}/${cleanPath}`;
    } else if (cleanPath === "genre") {
      endpoint = `${api_url}/category/genre`;
      if (genre) params.genre = String(genre).replaceAll("-", " ");
    } else {
      endpoint = `${api_url}/category/${cleanPath}`;
    }

    const response = await axios.get(endpoint, { params, timeout: 30000 });

    const payload =
      response.data?.data && typeof response.data.data === "object"
        ? response.data.data
        : response.data || {};

    const results = Array.isArray(payload.results)
      ? payload.results
      : Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.animes)
      ? payload.animes
      : [];

    const paginationInfo = payload.paginationInfo || null;

    return {
      results,
      data: results,
      paginationInfo,
      totalPages: paginationInfo?.lastPage || null,
      category: payload.category,
      genre: payload.genre,
      page: payload.page || page,
    };
  } catch (error) {
    console.error("Category fetch error:", error);
    return EMPTY;
  }
}
