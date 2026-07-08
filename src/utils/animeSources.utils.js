/**
 * Anime streaming source registry (Watch page).
 *
 * All anime providers are iframe embeds. Each declares:
 *   id        unique key
 *   name      button label
 *   provider  internal grouping (megaplay variants share resolution logic)
 *   needs     "anilist" | "mal" | "tmdb" — which id the provider's URL expects
 *   audio     ["sub","dub"] supported audio tracks
 *   sandbox   "safe" | "none"  (ad-block sandbox policy, see getAnimeSandbox)
 *   info      short help text shown in the "How to use" modal (NEVER a URL)
 *   build     ({anilistId, malId, episode, audio, mapping}) => embed URL | Promise<string>
 *
 * IMPORTANT (June 2026): most providers (megaplay, animeplay, etc.) now
 * actively refuse to run inside a sandboxed iframe ("Sandboxed our player is
 * not allowed. Remove sandbox to use it."). We therefore mark those as
 * sandbox:"none" and rely on a PAGE-LEVEL popup/redirect blocker for ad
 * protection instead of the iframe sandbox. See popupGuard.utils.js.
 */

const MEGAPLAY =
  import.meta.env.VITE_MEGAPLAY_URL || "https://megaplayproxy1.vercel.app";
const VIDNEST = import.meta.env.VITE_VIDNEST_URL || "https://vidnest.fun";
const ANIMEPLAY = import.meta.env.VITE_ANIMEPLAY_URL || "https://animeplay.cfd";
const TRYEMBED = import.meta.env.VITE_TRYEMBED_URL || "https://tryembed.us.cc";
const SCREENSCAPE =
  import.meta.env.VITE_SCREENSCAPE_URL || "https://nxsha.screenscape.me";

const mega = MEGAPLAY.replace(/\/$/, "");
const screenscape = SCREENSCAPE.replace(/\/$/, "");

/* ------------------------------------------------------------------ *
 * AniList -> TMDB / IMDB id mapping (for providers that need them).
 * Uses the public ani.zip mapping API, cached in-memory + localStorage.
 * ------------------------------------------------------------------ */
const MAPPING_MEM = new Map();

export async function getAnimeExternalIds(anilistId) {
  if (!anilistId) return null;
  const key = String(anilistId);
  if (MAPPING_MEM.has(key)) return MAPPING_MEM.get(key);

  // localStorage cache (survives reloads, 7-day TTL)
  try {
    const raw = localStorage.getItem(`anime_map_${key}`);
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached && Date.now() - cached.t < 7 * 24 * 60 * 60 * 1000) {
        MAPPING_MEM.set(key, cached.v);
        return cached.v;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const res = await fetch(
      `https://api.ani.zip/mappings?anilist_id=${encodeURIComponent(key)}`
    );
    if (!res.ok) throw new Error("mapping failed");
    const data = await res.json();
    const m = data?.mappings || {};
    const out = {
      tmdbId: m.themoviedb_id ? String(m.themoviedb_id) : "",
      imdbId: m.imdb_id || "",
      type: (m.type || "TV").toLowerCase() === "movie" ? "movie" : "tv",
    };
    MAPPING_MEM.set(key, out);
    try {
      localStorage.setItem(
        `anime_map_${key}`,
        JSON.stringify({ t: Date.now(), v: out })
      );
    } catch {
      /* ignore */
    }
    return out;
  } catch {
    const out = { tmdbId: "", imdbId: "", type: "tv" };
    MAPPING_MEM.set(key, out);
    return out;
  }
}

export const ANIME_SERVERS = [
  // ── Megaplay (original default servers) — proven, stable ───────────────
  // These refuse to run inside a sandbox, so sandbox:"none".
  {
    id: "megaplay-anilist",
    name: "Server 1",
    provider: "megaplay-anilist",
    needs: "anilist",
    audio: ["sub", "dub"],
    sandbox: "none",
    info: "Main HD server. Best overall quality with Sub & Dub. If it shows an error or a black screen, just pick another server.",
    build: ({ anilistId, episode, audio }) =>
      `${mega}/watch/${anilistId}?ep=${episode}&lang=${audio}&idType=anilist`,
  },
  {
    id: "megaplay-mal",
    name: "Server 2",
    provider: "megaplay-mal",
    needs: "mal",
    audio: ["sub", "dub"],
    sandbox: "none",
    info: "Backup of the main HD server (uses a different source). Try this one if Server 1 fails to load.",
    build: ({ malId, anilistId, episode, audio }) =>
      `${mega}/watch/${malId || anilistId}?ep=${episode}&lang=${audio}&idType=mal`,
  },

  // ── Vidnest (HiAnime/megacloud, anilist) ──────────────────────────────
  {
    id: "vidnest",
    name: "Server 3",
    provider: "vidnest",
    needs: "anilist",
    audio: ["sub", "dub"],
    sandbox: "safe",
    info: "Fast server with Sub & Dub. Good fallback when the main servers are slow.",
    build: ({ anilistId, episode, audio }) =>
      `${VIDNEST}/anime/${anilistId}/${episode}/${audio}`,
  },
  // ── Vidnest (AnimePahe backend, anilist) ──────────────────────────────
  {
    id: "vidnest-pahe",
    name: "Server 4",
    provider: "vidnest",
    needs: "anilist",
    audio: ["sub", "dub"],
    sandbox: "safe",
    info: "Alternative source (AnimePahe backend). Useful for older or less-common titles.",
    build: ({ anilistId, episode, audio }) =>
      `${VIDNEST}/animepahe/${anilistId}/${episode}/${audio}`,
  },

  // ── AnimePlay (megaplay wrapper, accepts anilist) ─────────────────────
  {
    id: "animeplay",
    name: "Server 5",
    provider: "animeplay",
    needs: "anilist",
    audio: ["sub", "dub"],
    sandbox: "none",
    info: "Lightweight player with Sub & Dub. A solid alternative if other servers buffer.",
    build: ({ anilistId, episode, audio }) =>
      `${ANIMEPLAY}/stream/ani/${anilistId}/${episode}/${audio}`,
  },

  // NOTE: StreamRip was previously an inline anime server, but streamrip.fun is
  // a full SPA — embedding it shows the whole site instead of a player. It now
  // lives on the Download page (getDownloadSources) for its download links.

  // ── TryEmbed (anilist; self-contained videojs player) ─────────────────
  {
    id: "tryembed",
    name: "Server 6",
    provider: "tryembed",
    needs: "anilist",
    audio: ["sub", "dub"],
    sandbox: "safe",
    info: "Built-in player with Sub & Dub. Try this if you want a cleaner interface.",
    build: ({ anilistId, episode, audio }) =>
      `${TRYEMBED}/embed/anime/${anilistId}/${episode}/${audio}`,
  },

  // ── Screenscape "Hindi" (TMDB/IMDB; HINDI audio) ──────────────────────
  // Needs a TMDB or IMDB id, resolved from the AniList id via ani.zip.
  {
    id: "screenscape-hindi",
    name: "Hindi",
    provider: "screenscape",
    needs: "anilist",
    audio: ["sub"],
    sandbox: "safe",
    info: "Special server that plays the HINDI dub when available. Hindi audio only exists for popular titles \u2014 if it doesn't load, the Hindi dub isn't out yet, so use another server.",
    // Async build: resolve TMDB/IMDB first, then form the embed URL.
    build: async ({ anilistId, episode, mapping }) => {
      const map = mapping || (await getAnimeExternalIds(anilistId));
      if (!map) return "";
      const lan = "hin";
      if (map.type === "movie" && map.tmdbId) {
        return `${screenscape}/embed?tmdb=${map.tmdbId}&type=movie&lan=${lan}`;
      }
      if (map.tmdbId) {
        return `${screenscape}/embed?tmdb=${map.tmdbId}&type=tv&s=1&e=${episode}&lan=${lan}`;
      }
      if (map.imdbId) {
        return `${screenscape}/embed?imdb=${map.imdbId}&type=tv&s=1&e=${episode}&lan=${lan}`;
      }
      return "";
    },
  },
];

/**
 * Build the iframe URL for the chosen anime server.
 * Some providers (Screenscape) resolve ids asynchronously, so this is async.
 * @returns {Promise<string>} embed URL (empty string if required id is missing)
 */
export async function buildAnimeUrl(server, { anilistId, malId, episode, audio }) {
  if (!server) return "";
  const ep = episode || 1;
  const a = audio === "dub" && server.audio.includes("dub") ? "dub" : "sub";
  try {
    const result = server.build({ anilistId, malId, episode: ep, audio: a });
    return (await result) || "";
  } catch {
    return "";
  }
}
