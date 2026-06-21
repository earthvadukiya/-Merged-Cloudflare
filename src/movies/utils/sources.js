/**
 * Streaming source registry for the Movies / TV section.
 *  - type "iframe": embed provider player in an <iframe> (videasy, vidapi).
 *  - type "hls":    ezvidapi returns a direct .m3u8 stream_url playable
 *                   in our own ArtPlayer (ad-free).
 *
 * Servers:
 *   Server 1 = videasy   (iframe)
 *   Server 2 = ezvidapi  (multiple providers, direct HLS, ad-free)
 *   Server 3 = vidapi    (iframe, embed via vaplayer.ru)
 */
const VIDEASY = import.meta.env.VITE_VIDEASY_URL || "https://player.videasy.to";
const EZ = import.meta.env.VITE_EZVIDAPI_URL || "https://api.ezvidapi.com";
const VIDAPI = import.meta.env.VITE_VIDAPI_URL || "https://vaplayer.ru";

// vidapi (Server 3) player customisation — purple skin matching the site theme.
// Reference: https://vidapi.ru/player  ->  skin=vidzilla & accent color 9146ff
const VIDAPI_SKIN = "vidzilla";
const VIDAPI_COLOR = "9146ff";

const EZ_PROVIDERS = [
  { id: "vidsrc", name: "Vidsrc", cc: false },
  { id: "vidrock", name: "Vidrock", cc: true },
  { id: "vidzee", name: "Vidzee", cc: true },
  { id: "icefy", name: "Icefy", cc: false },
  { id: "vidlink", name: "Vidlink", cc: false },
  { id: "vidnest", name: "Vidnest", cc: true },
  { id: "vixsrc", name: "VixSrc", cc: false },
  { id: "popr", name: "Popr", cc: true },
];

export function buildSources(type, tmdbId, season = 1, episode = 1) {
  const sources = [];

  // Server 1: videasy iframe
  const videasyUrl =
    type === "tv"
      ? `${VIDEASY}/tv/${tmdbId}/${season}/${episode}`
      : `${VIDEASY}/movie/${tmdbId}`;
  sources.push({
    key: "videasy",
    label: "Default",
    server: "Server 1",
    type: "iframe",
    cc: true,
    url: videasyUrl,
  });

  // Server 2: ezvidapi providers (direct HLS)
  for (const p of EZ_PROVIDERS) {
    const api =
      type === "tv"
        ? `${EZ}/tv/${p.id}/${tmdbId}?season=${season}&episode=${episode}`
        : `${EZ}/movie/${p.id}/${tmdbId}`;
    sources.push({
      key: `ez-${p.id}`,
      label: p.name,
      server: "Server 2",
      type: "hls",
      cc: p.cc,
      api,
    });
  }

  // Server 3: vidapi iframe (vaplayer.ru). Supports TMDB IDs directly.
  // Customised player: skin=vidzilla, accent colour 9146ff (site purple).
  const vidapiQuery = `?skin=${VIDAPI_SKIN}&color=${VIDAPI_COLOR}`;
  const vidapiUrl =
    type === "tv"
      ? `${VIDAPI}/embed/tv/${tmdbId}/${season}/${episode}${vidapiQuery}`
      : `${VIDAPI}/embed/movie/${tmdbId}${vidapiQuery}`;
  sources.push({
    key: "vidapi",
    label: "Default",
    server: "Server 3",
    type: "iframe",
    cc: true,
    url: vidapiUrl,
  });

  return sources;
}

export async function resolveHls(apiUrl) {
  const res = await fetch(apiUrl, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Source returned ${res.status}`);
  const json = await res.json();

  const streamUrl =
    json.stream_url || json.url || json.streamUrl || json.source || null;
  if (!streamUrl) throw new Error(json.detail || "Stream not found for this source");

  let subtitles = [];
  const subs = json.subtitles || json.subs || json.tracks;
  if (Array.isArray(subs)) {
    subtitles = subs
      .map((s) => ({
        label: s.label || s.lang || s.language || "Subtitle",
        url: s.url || s.file || s.src,
        lang: s.lang || s.language || s.srclang || "",
      }))
      .filter((s) => s.url);
  }
  return { streamUrl, subtitles };
}
