/**
 * Download-source registry.
 *
 * These are EXTERNAL sites that provide downloads for anime / movies. We only
 * deep-link to them with a pre-filled search (or a direct title page when the
 * site is keyed by TMDB id) for the current title — we never host or proxy any
 * file. A disclaimer is shown on the Download page making it clear we are not
 * responsible for anything (viruses / malware / content) from these sites.
 *
 * Verified URL formats (June 2026):
 *   Nyaa        https://nyaa.si/?f=0&c=1_0&q=<terms>            (anime torrents, search by title)
 *   AnimeTosho  https://animetosho.org/search?q=<terms>          (anime, search by title)
 *   TokyoTosho  https://www.tokyotosho.info/search.php?terms=<terms>&type=1  (anime; type=1 REQUIRED, else 500)
 *   VidVault    https://vidvault.ru/movie/<tmdbId>               (movie, TMDB-keyed)
 *               https://vidvault.ru/tv/<tmdbId>/<season>/<episode> (TV, TMDB-keyed)
 *   StreamRip   https://streamrip.fun/movie/<tmdbId> | /tv/<tmdbId>  (movie/TV, TMDB-keyed)
 *
 * Anime sites search by TITLE TEXT (always works), so anime sources never need
 * a TMDB/IMDB id. Movie sites are keyed by TMDB id (which movie pages have).
 */

const STREAMRIP = import.meta.env.VITE_STREAMRIP_URL || "https://streamrip.fun";

const enc = (s) => encodeURIComponent(String(s || "").trim());

/**
 * Build a clean torrent-search query from a (possibly long / decorated) title.
 * Torrent indexes match release names, so over-specific titles like
 * "Re:ZERO -Starting Life in Another World- Season 4" return nothing. We strip
 * season/part suffixes, punctuation and subtitle dashes down to the core name.
 */
export function cleanSearchQuery(title = "") {
  let q = String(title || "").trim();

  // Drop everything after a subtitle dash group:  "Re:ZERO -Starting Life-" -> "Re:ZERO"
  // (only when there's a leading word before the dash)
  q = q.replace(/\s*[-–—]\s*[^-–—]+\s*[-–—].*$/, "");

  // Remove ordinal + season/part FIRST: "2nd Season", "3rd Part", "Final Season Part 2"
  q = q.replace(/\b(\d+(st|nd|rd|th)|final|the)\s+(season|part|cour|chapter)\b/gi, " ");
  // Remove "Season N" / "Part N" / "Cour N" / "Series N" (number optional, may follow)
  q = q.replace(/\b(season|series|part|cour|saison|chapter)\b\s*\d*/gi, " ");
  // Remove any now-orphaned ordinals/keywords left behind ("2nd", "final")
  q = q.replace(/\b(\d+(st|nd|rd|th)|final)\b\s*$/gi, " ");

  // Drop trailing standalone numbers / roman numerals (sequel markers)
  q = q.replace(/\s+\b([ivx]{1,4}|\d{1,2})\b\s*$/i, " ");

  // Collapse leftover punctuation/whitespace
  q = q.replace(/[:_]/g, " ").replace(/[-–—]+/g, " ").replace(/\s+/g, " ").trim();

  return q || String(title || "").trim();
}

export const DOWNLOAD_SOURCES = [
  // ── VidVault (anime + movies/TV) — RECOMMENDED ────────────────────────
  // TMDB-keyed direct streaming/download. For anime we resolve a TMDB TV id
  // (see animeTmdb.utils) so it deep-links straight to the show.
  {
    id: "vidvault",
    name: "VidVault",
    kind: "both",
    label: "Direct",
    recommended: true,
    build: (query, { tmdbId, type, season, episode } = {}) => {
      if (tmdbId) {
        return type === "movie"
          ? `https://vidvault.ru/movie/${tmdbId}`
          : `https://vidvault.ru/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      }
      return `https://vidvault.ru/`;
    },
  },

  // ── Nyaa (anime torrents) ─────────────────────────────────────────────
  {
    id: "nyaa",
    name: "Nyaa",
    kind: "anime",
    label: "Torrent",
    build: (query) =>
      `https://nyaa.si/?f=0&c=1_0&q=${enc(cleanSearchQuery(query))}`,
  },

  // ── AnimeTosho (anime, direct + torrents) ─────────────────────────────
  {
    id: "animetosho",
    name: "AnimeTosho",
    kind: "anime",
    label: "Torrent + Direct",
    build: (query) =>
      `https://animetosho.org/search?q=${enc(cleanSearchQuery(query))}`,
  },

  // ── TokyoTosho (anime torrents) ───────────────────────────────────────
  {
    id: "tokyotosho",
    name: "TokyoTosho",
    kind: "anime",
    label: "Torrent",
    // type=1 (anime category) is REQUIRED — without it the site returns 500.
    build: (query) =>
      `https://www.tokyotosho.info/search.php?terms=${enc(
        cleanSearchQuery(query)
      )}&type=1`,
  },

  // ── StreamRip (movies + TV, TMDB-keyed direct downloads) ──────────────
  {
    id: "streamrip",
    name: "StreamRip",
    kind: "movie",
    label: "Direct",
    build: (query, { tmdbId, type } = {}) => {
      if (tmdbId) {
        return type === "tv"
          ? `${STREAMRIP}/tv/${tmdbId}`
          : `${STREAMRIP}/movie/${tmdbId}`;
      }
      return `${STREAMRIP}/`;
    },
  },
];

/**
 * Return the download sources relevant to a media kind.
 * @param {"anime"|"movie"} mediaKind
 */
export function getDownloadSources(mediaKind) {
  return DOWNLOAD_SOURCES.filter(
    (s) => s.kind === mediaKind || s.kind === "both"
  );
}

/**
 * Resolve a source's outbound URL for the given title context.
 */
export function buildDownloadUrl(source, query, ctx = {}) {
  try {
    return source.build(query, ctx) || "";
  } catch {
    return "";
  }
}
