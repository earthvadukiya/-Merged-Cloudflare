// Central API configuration for the anime section.
//
// This app now talks to a SINGLE consolidated backend: the
// "Anime Invincible API v2". Every route lives under the same base URL and
// the base already includes the `/api` suffix (e.g. http://host:5000/api).
//
// The legacy three-API split (HOME/INFO/WATCH) has been collapsed. We keep the
// three exported names for backward compatibility so the existing util files
// import them unchanged, but they all resolve to the same backend.
//
// Response envelope: every endpoint returns { "success": true, "data": ... }.

const DEFAULT_API = "http://localhost:5000/api";

export const HOME_API = import.meta.env.VITE_API_URL || DEFAULT_API;
export const INFO_API = import.meta.env.VITE_API_URL_2 || HOME_API;
export const WATCH_API = import.meta.env.VITE_API_URL_3 || HOME_API;
