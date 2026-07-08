// Supabase client — used as a fast edge cache in front of the anime API + TMDB.
//
// How it works:
//   * A Supabase Edge Function ("refresh-cache") runs every 1 hour (cron) and
//     writes fresh JSON snapshots into the `api_cache` table.
//   * The site reads those snapshots instead of hitting the anime API / TMDB on
//     every visit. Supabase serves them from its global edge, so loads are near
//     instant AND the upstream APIs are never hammered (so they don't break).
//
// Keys are read from .env (Vite exposes only VITE_-prefixed vars to the client):
//   VITE_SUPABASE_URL=...
//   VITE_SUPABASE_ANON_KEY=...
//
// If the keys are missing the whole layer silently no-ops and the app falls back
// to calling the APIs directly — so the site keeps working even before you add
// the Supabase credentials.

import { createClient } from "@supabase/supabase-js";

// IMPORTANT — why there are hardcoded defaults below:
//
// Vite inlines VITE_* env vars at BUILD time, NOT at runtime. Setting the keys
// in the Cloudflare Pages *runtime* environment does NOT put them into the
// already-built static JS bundle — so the client kept seeing them as undefined
// ("Login is not configured yet"). The fix is to bake them in at build time.
//
// The Supabase ANON key is *designed to be public* — it's safe in client code
// (that's its entire purpose; row-level security on the server is what protects
// your data). So we use the project's public URL + anon key as the default, and
// still let a build-time VITE_ override win if one is provided.
const FALLBACK_SUPABASE_URL = "https://azmzidkyhhlwayzdxuzp.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bXppZGt5aGhsd2F5emR4dXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTEzMDQsImV4cCI6MjA5MzYyNzMwNH0.-QioA6ynIg8jidYwF5jvIKtaH0B4BR6ZHciC9xGS9Cs";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = supabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Persist the logged-in session so users stay signed in across reloads
        // and devices. Tokens are stored by supabase-js in localStorage under a
        // project-scoped key; only the short-lived JWT + refresh token live there.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "offanime-auth",
      },
      global: { headers: { "x-application-name": "offanime" } },
    })
  : null;

/**
 * Read a cached JSON snapshot by key from the `api_cache` table.
 * Returns { data, updatedAt, stale } or null when missing / disabled.
 *
 * @param {string} key       cache key, e.g. "home", "category:tv", "tmdb:123"
 * @param {number} maxAgeMs  how long a snapshot is considered "fresh"
 */
export async function readCache(key, maxAgeMs = 60 * 60 * 1000) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("api_cache")
      .select("payload, updated_at")
      .eq("cache_key", key)
      .maybeSingle();

    if (error || !data) return null;

    const updatedAt = data.updated_at ? new Date(data.updated_at).getTime() : 0;
    return {
      data: data.payload,
      updatedAt,
      stale: Date.now() - updatedAt > maxAgeMs,
    };
  } catch {
    return null;
  }
}

/**
 * Write/overwrite a cached JSON snapshot. Used by the client only as a
 * best-effort warm-up; the authoritative writer is the Edge Function.
 */
export async function writeCache(key, payload) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("api_cache")
      .upsert(
        { cache_key: key, payload, updated_at: new Date().toISOString() },
        { onConflict: "cache_key" }
      );
    return !error;
  } catch {
    return false;
  }
}
