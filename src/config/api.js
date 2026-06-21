// Central API configuration for the anime section.
//
// The anime app talks to THREE separate API deployments to spread load and
// avoid rate limits. Each anime "page" uses its own base URL:
//
//   HOME  page  -> VITE_API_URL    (e.g. anime-details-api)
//   INFO  page  -> VITE_API_URL_2  (e.g. anime-details-api-2)
//   WATCH page  -> VITE_API_URL_3  (e.g. anime-details-api-3)
//
// If a per-page URL is not set, we fall back to the main HOME URL so the app
// keeps working before all three Cloudflare env vars are configured.
//
// NOTE: This config is ONLY for the anime section. The live-action movies
// section (src/movies/) has its own TMDB config and must NOT use these.

const DEFAULT_API = "https://anime-details-api.vercel.app/api";

// HOME page API (anime home, listings, search, schedule, producers).
//
// IMPORTANT: The /tmdb/ enrichment endpoint (anime logos + episode thumbnails)
// ONLY exists on this main API deployment. So every /tmdb/ call — even ones
// rendered on the INFO page (logo + episode grid thumbnails) — must use HOME_API,
// not INFO_API. See getTmdbInfo.utils.js, Spotlight.jsx, ContinueWatching.jsx.
export const HOME_API = import.meta.env.VITE_API_URL || DEFAULT_API;

// INFO page API (anime details, seasons, recommendations, characters, jikan, qtip).
// NOTE: tmdb (logos + episode thumbnails) is NOT here — it uses HOME_API above.
export const INFO_API = import.meta.env.VITE_API_URL_2 || HOME_API;

// WATCH page API (episodes, next-episode schedule)
export const WATCH_API = import.meta.env.VITE_API_URL_3 || HOME_API;
