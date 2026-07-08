import axios from "axios";
import { INFO_API } from "../config/api";

// New API route: /characters/:id -> { success, data: [ ... ] }
// Each item is FLAT: { id, malId, name, role, favorites, image,
//                      voiceActors: [ { name, language, image, malId } ] }
// Components expect NESTED:
//   { character: { name, image, poster, cast }, role,
//     voiceActors: [ { name, image, poster, language } ] }
export default async function fetchVoiceActorInfo(id, page = 1) {
  const api_url = INFO_API;
  if (!id) return [];

  try {
    const response = await axios.get(`${api_url}/characters/${id}`, {
      params: { page },
      timeout: 30000,
    });

    const raw =
      response.data?.data ||
      response.data?.results ||
      (Array.isArray(response.data) ? response.data : []) ||
      [];

    if (!Array.isArray(raw)) return [];

    return raw.map((c) => ({
      role: c.role || "",
      character: {
        name: c.name || "",
        image: c.image || "",
        poster: c.image || "",
        cast: c.role || "",
      },
      voiceActors: Array.isArray(c.voiceActors)
        ? c.voiceActors.map((va) => ({
            name: va.name || "",
            image: va.image || "",
            poster: va.image || "",
            language: va.language || "",
          }))
        : [],
    }));
  } catch (error) {
    console.error("Error fetching voice actors:", error);
    return [];
  }
}
