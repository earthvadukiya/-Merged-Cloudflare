const API = import.meta.env.VITE_API_URL || "https://anime-details-api.vercel.app/api";

const memoryCache = new Map();

export default async function getSearch(keyword) {
  try {
    const q = keyword?.trim().toLowerCase();

    if (!q || q.length < 3) return [];

    if (memoryCache.has(q)) {
      return memoryCache.get(q);
    }

    const response = await fetch(
      `${API}/search?q=${encodeURIComponent(q)}`
    );

    if (!response.ok) {
      throw new Error(`Search API failed: ${response.status}`);
    }

    const json = await response.json();
    const results = Array.isArray(json?.results) ? json.results : [];

    memoryCache.set(q, results);

    return results;
  } catch (error) {
    console.log("Search failed:", error.message);
    return [];
  }
}
