# Frontend Re-routing to "Anime Invincible API v2"

This frontend was re-wired from the **old multi-API backend** (which returned
`{ results: ... }` on three separate deployments) to the new single
**Anime Invincible API v2** backend, which uses the envelope
`{ "success": true, "data": ... }` on one base URL ending in `/api`.

## How to configure

Set a single env var (base URL **must** include `/api`):

```
VITE_API_URL=http://localhost:5000/api          # local dev
# VITE_API_URL=https://your-api.example.com/api # production
VITE_API_URL_2=      # leave blank (defaults to VITE_API_URL)
VITE_API_URL_3=      # leave blank (defaults to VITE_API_URL)
```

`src/config/api.js` now exports `HOME_API`, `INFO_API`, `WATCH_API` that all
resolve to the same backend (the legacy names are kept for compatibility).

## Files changed

| File | Change |
| ---- | ------ |
| `src/config/api.js` | Collapsed 3-API split into one base URL (`/api`). |
| `getHomeInfo.utils.js` | Unwrap `.data` envelope (keys already match). |
| `getAnimeInfo.utils.js` | `/details/:id` → **`/smart/details/:id`** (details + relations + seasons + recommendations in one call). |
| `getEpisodes.utils.js` | Read `.data`. |
| `getSearch.utils.js` | Read `.data` (array). |
| `getTopSearch.utils.js` | Read `.data`. |
| `getCategoryInfo.utils.js` | Unwrap nested `.data.results` + `paginationInfo`; route `az-list` to top-level `/az-list/:letter` (not `/category`). |
| `getScheduleInfo.utils.js` | Read `.data`. |
| `getRecommendations.utils.js` | Read `.data`. |
| `getSeasons.utils.js` | Read `.data`. |
| `getVoiceActor.utils.js` | `/character/list/:id` → **`/characters/:id`**; map flat `{name, role, image, voiceActors}` → nested `{character:{name,image,poster,cast}, voiceActors:[{name,image,poster,language}]}`. |
| `getTmdbInfo.utils.js` | No change (already reads `.data`). |
| `getJikanInfo.utils.js` | No change (already reads `.data`). |
| `getTmdbBanner.utils.js` | No change (already reads `.data`). |

## Removed routes (gracefully degraded)

| Old route | Handling |
| --------- | -------- |
| `/qtip/:id` | `getQtip` now builds the tooltip from `/details/:id`. |
| `/search/suggest?keyword=` | `getSearchSuggestion` now uses `/search?q=` (top 10). |
| `/producer/:producer` | `getProducer` now approximates via `/search?q=<studio>`. |
| `/schedule/:id` (next-ep) | `getNextEpisodeSchedule` derives from `/details/:id` airing status or returns `null` (value is informational only). |

## Verification

- `npm run build` succeeds (no import/syntax errors).
- All 17 re-routed endpoints return HTTP 200 with correctly-shaped, non-empty
  data against the live API (home, search, smart/details with 63 relations /
  38 seasons / 15 recs, episodes 1169, category + pagination, az-list, schedule,
  recommendations, seasons, characters→voiceactor mapping, qtip, suggestions,
  producer, jikan, tmdb).
