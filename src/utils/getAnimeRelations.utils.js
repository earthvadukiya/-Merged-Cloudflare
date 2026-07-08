import axios from "axios";

// Fetch season/series relations for an anime directly from AniList GraphQL.
// We use AniList because it returns rich node metadata (type/format/status/year),
// which the details API's `relations` field does not include.

const ANILIST_GQL = "https://graphql.anilist.co";

// Relations that form the "watch order" chain (seasons / direct continuations).
const SEASON_RELATIONS = ["PREQUEL", "SEQUEL", "PARENT", "SIDE_STORY"];
// Anime-only relations we still surface in a generic "Related" list.
const RELATED_RELATIONS = [
  "PREQUEL",
  "SEQUEL",
  "PARENT",
  "SIDE_STORY",
  "ALTERNATIVE",
  "SPIN_OFF",
  "SUMMARY",
];

const QUERY = `query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    relations {
      edges {
        relationType(version: 2)
        node {
          id
          type
          format
          status
          episodes
          seasonYear
          title { english romaji }
          coverImage { large medium }
        }
      }
    }
  }
}`;

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function prettyStatus(status = "") {
  const s = String(status).toUpperCase();
  if (s === "FINISHED") return "Completed";
  if (s === "RELEASING") return "Airing";
  if (s === "NOT_YET_RELEASED") return "Upcoming";
  if (s === "CANCELLED") return "Cancelled";
  if (s === "HIATUS") return "Hiatus";
  return "";
}

function prettyFormat(format = "", type = "") {
  const f = String(format).toUpperCase();
  if (f === "TV") return "TV";
  if (f === "TV_SHORT") return "TV Short";
  if (f === "MOVIE") return "Movie";
  if (f === "OVA") return "OVA";
  if (f === "ONA") return "ONA";
  if (f === "SPECIAL") return "Special";
  return type === "ANIME" ? "Anime" : f || "";
}

// In-memory cache to avoid re-hitting AniList for the same anime.
const cache = new Map();

export default async function fetchAnimeRelations(anilistId) {
  const id = Number(anilistId);
  if (!id || Number.isNaN(id)) return { seasons: [], related: [] };

  if (cache.has(id)) return cache.get(id);

  try {
    const res = await axios.post(
      ANILIST_GQL,
      { query: QUERY, variables: { id } },
      { timeout: 8000, headers: { "Content-Type": "application/json" } }
    );

    const edges = res.data?.data?.Media?.relations?.edges || [];

    const mapped = edges
      .map((e) => {
        const n = e?.node || {};
        if (n.type !== "ANIME") return null; // skip manga/novel adaptations
        const t = n.title || {};
        const name = t.english || t.romaji || "";
        if (!n.id || !name) return null;
        return {
          id: n.id,
          watchId: `${slugify(name)}-${n.id}`,
          relationType: e.relationType || "",
          title: name,
          poster: n.coverImage?.large || n.coverImage?.medium || "",
          format: prettyFormat(n.format, n.type),
          status: prettyStatus(n.status),
          year: n.seasonYear || "",
          episodes: n.episodes || null,
        };
      })
      .filter(Boolean);

    const seasons = mapped.filter((r) =>
      SEASON_RELATIONS.includes(r.relationType)
    );
    const related = mapped.filter((r) =>
      RELATED_RELATIONS.includes(r.relationType)
    );

    const out = { seasons, related };
    cache.set(id, out);
    return out;
  } catch (err) {
    console.warn("fetchAnimeRelations failed:", err?.message || err);
    const empty = { seasons: [], related: [] };
    cache.set(id, empty);
    return empty;
  }
}
