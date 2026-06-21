// ============================================================================
// OFFANIME — refresh-cache Edge Function
//
// Pulls fresh data from the anime API + TMDB and writes JSON snapshots into the
// `api_cache` table. The website then reads those snapshots instead of hitting
// the upstream APIs on every visit => instant loads + APIs never get hammered.
//
// Deploy:
//   supabase functions deploy refresh-cache --no-verify-jwt
//
// Secrets (set once):
//   supabase secrets set SUPABASE_URL=...            (your project URL)
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... (service_role key)
//   supabase secrets set ANIME_API_URL=https://anime-details-api.vercel.app/api
//   supabase secrets set TMDB_API_KEY=64b03fca3936439f3d3da531973e5ff9
//
// Schedule hourly (Supabase dashboard -> Database -> Cron, or pg_cron):
//   select cron.schedule(
//     'refresh-offanime-cache', '0 * * * *',
//     $$ select net.http_post(
//          url := 'https://<project>.functions.supabase.co/refresh-cache',
//          headers := '{"Content-Type":"application/json"}'::jsonb
//        ) $$);
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANIME_API = Deno.env.get("ANIME_API_URL") ?? "https://anime-details-api.vercel.app/api";
const TMDB_KEY = Deno.env.get("TMDB_API_KEY") ?? "64b03fca3936439f3d3da531973e5ff9";
const TMDB_BASE = "https://api.themoviedb.org/3";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function getJson(url: string, tries = 3): Promise<any> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

async function putCache(key: string, payload: unknown) {
  const { error } = await admin
    .from("api_cache")
    .upsert(
      { cache_key: key, payload, updated_at: new Date().toISOString() },
      { onConflict: "cache_key" },
    );
  if (error) throw error;
}

// Which snapshots to refresh every hour.
const ANIME_ENDPOINTS: Array<{ key: string; path: string }> = [
  { key: "home", path: "/home" },
  { key: "category:most-popular", path: "/most-popular?page=1" },
  { key: "category:top-airing", path: "/top-airing?page=1" },
  { key: "category:recently-updated", path: "/recently-updated?page=1" },
];

const TMDB_ENDPOINTS: Array<{ key: string; path: string }> = [
  { key: "tmdb:trending", path: `/trending/all/week?api_key=${TMDB_KEY}` },
  { key: "tmdb:movie-popular", path: `/movie/popular?api_key=${TMDB_KEY}&page=1` },
  { key: "tmdb:tv-popular", path: `/tv/popular?api_key=${TMDB_KEY}&page=1` },
  { key: "tmdb:movie-top", path: `/movie/top_rated?api_key=${TMDB_KEY}&page=1` },
  { key: "tmdb:tv-top", path: `/tv/top_rated?api_key=${TMDB_KEY}&page=1` },
];

Deno.serve(async (_req) => {
  const results: Record<string, string> = {};

  // Refresh anime snapshots.
  for (const ep of ANIME_ENDPOINTS) {
    try {
      const data = await getJson(`${ANIME_API}${ep.path}`);
      await putCache(ep.key, data);
      results[ep.key] = "ok";
    } catch (err) {
      results[ep.key] = `fail: ${(err as Error).message}`;
    }
  }

  // Refresh TMDB snapshots (Movies/TV section).
  for (const ep of TMDB_ENDPOINTS) {
    try {
      const data = await getJson(`${TMDB_BASE}${ep.path}`);
      await putCache(ep.key, data);
      results[ep.key] = "ok";
    } catch (err) {
      results[ep.key] = `fail: ${(err as Error).message}`;
    }
  }

  return new Response(JSON.stringify({ refreshed_at: new Date().toISOString(), results }), {
    headers: { "Content-Type": "application/json" },
  });
});
