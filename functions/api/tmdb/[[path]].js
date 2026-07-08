/**
 * Cloudflare Pages Function — server-side TMDB proxy.
 *
 * Why this exists:
 *   The TMDB v3 API key used to be bundled into the frontend JavaScript, which
 *   meant anyone could open DevTools, read the key, and abuse it. This edge
 *   function keeps the key on the SERVER. The browser only ever calls
 *   `/api/tmdb/<tmdb-path>` on our OWN domain — the real key + upstream host are
 *   added here, out of the user's view.
 *
 * Usage from the frontend:
 *   GET /api/tmdb/trending/all/week
 *   GET /api/tmdb/movie/550?append_to_response=videos,images
 *   (everything after /api/tmdb/ is forwarded to api.themoviedb.org/3/<that>)
 *
 * The key is read from the `TMDB_API_KEY` environment variable / secret. Set it
 * in the Cloudflare Pages dashboard (Settings → Environment variables) or via:
 *   npx wrangler pages secret put TMDB_API_KEY
 */

const TMDB_HOSTS = ["https://api.themoviedb.org/3", "https://api.tmdb.org/3"];

// Only allow these characters in the forwarded path (defence against weird
// injection). TMDB paths are simple: letters, numbers, /, -, _ and dots.
const SAFE_PATH = /^[a-zA-Z0-9/_.-]*$/;

export async function onRequestGet({ params, request, env }) {
  // `params.path` is an array of the wildcard segments after /api/tmdb/.
  const segments = Array.isArray(params.path) ? params.path : [params.path].filter(Boolean);
  const path = segments.join("/");

  if (!SAFE_PATH.test(path)) {
    return json({ error: "Invalid path" }, 400);
  }

  const key = env.TMDB_API_KEY || env.VITE_TMDB_API_KEY;
  if (!key) {
    return json({ error: "TMDB key not configured on server" }, 500);
  }

  // Preserve any query params the client sent (e.g. ?page=2&append_to_response=…)
  // but strip anything trying to inject its own api_key.
  const incoming = new URL(request.url);
  const qs = new URLSearchParams(incoming.search);
  qs.delete("api_key");
  qs.set("api_key", key);
  if (!qs.has("language")) qs.set("language", "en-US");

  // Try the primary host, fall back to the mirror (some ISPs block the main one).
  let lastErr;
  for (const host of TMDB_HOSTS) {
    try {
      const upstream = `${host}/${path}?${qs.toString()}`;
      const res = await fetch(upstream, {
        headers: { Accept: "application/json" },
        // Edge-cache successful responses for an hour to cut TMDB calls.
        cf: { cacheTtl: 3600, cacheEverything: true },
      });
      const body = await res.text();
      return new Response(body, {
        status: res.status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=600",
          // Same-origin only; no need for permissive CORS.
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (e) {
      lastErr = e;
    }
  }
  return json({ error: "Upstream TMDB request failed", detail: String(lastErr) }, 502);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
