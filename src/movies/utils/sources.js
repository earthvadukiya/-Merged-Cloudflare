/**
 * Streaming source registry for the Movies / TV section.
 *
 *  - type "iframe": embed provider player in an <iframe>.
 *  - type "hls":    a JSON API (ezvidapi) returns a direct .m3u8 stream_url
 *                   played in our own ad-free ArtPlayer.
 *
 * Every iframe source declares how it should be sandboxed for ad-blocking:
 *
 *   sandbox: "safe"   -> can run inside a restrictive sandbox that still blocks
 *                        pop-ups / auto-redirect ads while keeping the player
 *                        playable (allow-scripts allow-same-origin ...).
 *   sandbox: "loose"  -> player runs but checks for a *restrictive* sandbox and
 *                        needs popup tokens present (megaplay-style). We give it
 *                        the tokens it expects but still withhold the
 *                        unrestricted top-navigation that silent redirect ads use.
 *   sandbox: "none"   -> player refuses to run under any sandbox (detects it and
 *                        shows an error / rickrolls). We must load it WITHOUT a
 *                        sandbox attribute, so the global Ad-Block toggle has no
 *                        effect on these — they may show ads.
 *
 * The actual sandbox attribute strings live in MoviePlayer.jsx (getSandbox()).
 *
 * Verified June 2026 against TMDB 550 (Fight Club) / 1396 (Breaking Bad).
 */
const VIDEASY = import.meta.env.VITE_VIDEASY_URL || "https://player.videasy.to";
const EZ = import.meta.env.VITE_EZVIDAPI_URL || "https://api.ezvidapi.com";
const VIDAPI = import.meta.env.VITE_VIDAPI_URL || "https://vaplayer.ru";

// Newly added providers (configurable via env, sensible defaults otherwise).
const FILMU = import.meta.env.VITE_FILMU_URL || "https://embed.filmu.in";
const VIDSRCPM = import.meta.env.VITE_VIDSRCPM_URL || "https://vidsrc.pm";
const SCREENSCAPE =
  import.meta.env.VITE_SCREENSCAPE_URL || "https://nxsha.screenscape.me";
const VIDNEST = import.meta.env.VITE_VIDNEST_URL || "https://vidnest.fun";
const VIDCORE = import.meta.env.VITE_VIDCORE_URL || "https://vidcore.net";
const VIDUP = import.meta.env.VITE_VIDUP_URL || "https://vidup.to";

// vidapi (vaplayer.ru) player customisation — purple skin matching the theme.
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

/**
 * Build the list of movie/TV sources.
 *
 * @param {"movie"|"tv"} type
 * @param {string|number} tmdbId   TMDB id (always available)
 * @param {number} season
 * @param {number} episode
 * @param {string} [imdbId]        IMDB id (tt…). Some providers require it.
 */
export function buildSources(type, tmdbId, season = 1, episode = 1, imdbId = "") {
  const sources = [];
  const isTV = type === "tv";

  // ─── Server 1: videasy iframe (default) ───────────────────────────────
  sources.push({
    key: "videasy",
    label: "Videasy",
    server: "Server 1",
    type: "iframe",
    cc: true,
    sandbox: "none", // videasy refuses restrictive sandbox -> load unrestricted
    url: isTV
      ? `${VIDEASY}/tv/${tmdbId}/${season}/${episode}`
      : `${VIDEASY}/movie/${tmdbId}`,
  });

  // ─── Server 2: ezvidapi providers (direct HLS, ad-free in our player) ──
  for (const p of EZ_PROVIDERS) {
    sources.push({
      key: `ez-${p.id}`,
      label: p.name,
      server: "Server 2",
      type: "hls",
      cc: p.cc,
      api: isTV
        ? `${EZ}/tv/${p.id}/${tmdbId}?season=${season}&episode=${episode}`
        : `${EZ}/movie/${p.id}/${tmdbId}`,
    });
  }

  // ─── Server 3: vidapi iframe (vaplayer.ru) ────────────────────────────
  const vidapiQuery = `?skin=${VIDAPI_SKIN}&color=${VIDAPI_COLOR}`;
  if (imdbId) {
    sources.push({
      key: "vidapi",
      label: "Vidapi",
      server: "Server 3",
      type: "iframe",
      cc: true,
      sandbox: "safe",
      url: isTV
        ? `${VIDAPI}/embed/tv/${imdbId}/${tmdbId}/${season}/${episode}${vidapiQuery}`
        : `${VIDAPI}/embed/movie/${imdbId}/${tmdbId}${vidapiQuery}`,
    });
  }

  // NOTE: StreamRip was previously an iframe server here, but streamrip.fun is
  // a full SPA — embedding it shows the entire site (logo, nav, Play/Download
  // buttons) instead of a bare player. It is now offered on the Download page
  // (getDownloadSources) where its real strength — direct download links — fits.

  // ─── Server 4: Vidsrc.pm (IMDB for movies, TMDB for TV) ───────────────
  if (isTV) {
    sources.push({
      key: "vidsrcpm",
      label: "Vidsrc.pm",
      server: "Server 4",
      type: "iframe",
      cc: true,
      sandbox: "safe",
      url: `${VIDSRCPM}/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,
    });
  } else if (imdbId) {
    sources.push({
      key: "vidsrcpm",
      label: "Vidsrc.pm",
      server: "Server 4",
      type: "iframe",
      cc: true,
      sandbox: "safe",
      url: `${VIDSRCPM}/embed/movie?imdb=${imdbId}`,
    });
  }

  // ─── Server 5: Screenscape (TMDB, explicitly allows framing) ──────────
  sources.push({
    key: "screenscape",
    label: "Screenscape",
    server: "Server 5",
    type: "iframe",
    cc: true,
    sandbox: "safe",
    url: isTV
      ? `${SCREENSCAPE}/embed?tmdb=${tmdbId}&type=tv&s=${season}&e=${episode}&lan=eng`
      : `${SCREENSCAPE}/embed?tmdb=${tmdbId}&type=movie&lan=eng`,
  });

  // ─── Server 6: Vidnest (TMDB) ─────────────────────────────────────────
  sources.push({
    key: "vidnest",
    label: "Vidnest",
    server: "Server 6",
    type: "iframe",
    cc: true,
    sandbox: "safe",
    url: isTV
      ? `${VIDNEST}/tv/${tmdbId}/${season}/${episode}`
      : `${VIDNEST}/movie/${tmdbId}`,
  });

  // ─── Server 7: Vidcore (IMDB) ─────────────────────────────────────────
  if (imdbId) {
    sources.push({
      key: "vidcore",
      label: "Vidcore",
      server: "Server 7",
      type: "iframe",
      cc: false,
      sandbox: "safe",
      url: isTV
        ? `${VIDCORE}/tv/${imdbId}/${season}/${episode}`
        : `${VIDCORE}/movie/${imdbId}`,
    });
  }

  // ─── Server 8: Vidup (TMDB) ───────────────────────────────────────────
  sources.push({
    key: "vidup",
    label: "Vidup",
    server: "Server 8",
    type: "iframe",
    cc: false,
    sandbox: "safe",
    url: isTV
      ? `${VIDUP}/tv/${tmdbId}/${season}/${episode}`
      : `${VIDUP}/movie/${tmdbId}`,
  });

  // ─── Server 9: Filmu (TMDB) ───────────────────────────────────────────
  // Filmu detects a sandbox WITHOUT allow-same-origin and refuses; the "safe"
  // sandbox keeps allow-same-origin so it plays while popups stay blocked.
  sources.push({
    key: "filmu",
    label: "Filmu",
    server: "Server 9",
    type: "iframe",
    cc: true,
    sandbox: "safe",
    url: isTV
      ? `${FILMU}/tv/${tmdbId}/${season}/${episode}`
      : `${FILMU}/movie/${tmdbId}`,
  });

  return sources;
}

// Small in-memory cache so switching back to a provider / re-opening an episode
// you already loaded resolves instantly instead of re-hitting the API. Entries
// live 5 minutes (HLS tokens can expire) and the map is capped to 40 entries.
const HLS_CACHE = new Map();
const HLS_TTL = 5 * 60 * 1000;

export async function resolveHls(apiUrl) {
  const cached = HLS_CACHE.get(apiUrl);
  if (cached && Date.now() - cached.t < HLS_TTL) return cached.v;

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
  const result = { streamUrl, subtitles };

  if (HLS_CACHE.size >= 40) HLS_CACHE.delete(HLS_CACHE.keys().next().value);
  HLS_CACHE.set(apiUrl, { t: Date.now(), v: result });

  return result;
}
