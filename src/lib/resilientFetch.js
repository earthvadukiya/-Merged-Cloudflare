// Resilient request helper — makes the anime API "unbreakable" under load.
//
// Strategy (in order):
//   1. If a fresh Supabase cache snapshot exists -> return it instantly.
//   2. Otherwise call the live API with: short timeout + automatic retry with
//      exponential backoff + jitter (so a thundering herd doesn't all retry at
//      the same instant).
//   3. On total failure -> return the last good data we have (stale Supabase
//      snapshot or localStorage), so users still see content instead of an
//      error. This is "stale-while-revalidate".
//
// This means: even if the upstream API is slow / rate-limited / briefly down,
// the site keeps serving the last known-good data.

import axios from "axios";
import { readCache, writeCache } from "./supabase";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {Object}   opts
 * @param {string}   opts.cacheKey      Supabase + localStorage key
 * @param {Function} opts.fetcher       async () => data  (calls the live API)
 * @param {number}   opts.maxAgeMs      freshness window (default 1h)
 * @param {number}   opts.retries       live-API retries (default 3)
 * @param {*}        opts.fallback      value if everything fails
 */
export async function resilientGet({
  cacheKey,
  fetcher,
  maxAgeMs = 60 * 60 * 1000,
  retries = 3,
  fallback = null,
}) {
  // 1) Fast path: fresh Supabase snapshot.
  const cached = await readCache(cacheKey, maxAgeMs);
  if (cached && !cached.stale) return cached.data;

  // 2) Live API with retry/backoff.
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fetcher();
      if (data) {
        // Best-effort warm caches for next time.
        writeCache(cacheKey, data);
        try {
          localStorage.setItem(
            `swr:${cacheKey}`,
            JSON.stringify({ t: Date.now(), d: data })
          );
        } catch {
          /* ignore quota */
        }
        return data;
      }
    } catch (err) {
      lastErr = err;
      // exponential backoff with jitter: 300ms, 700ms, 1500ms...
      const base = 300 * Math.pow(2, attempt);
      await sleep(base + Math.random() * 250);
    }
  }

  // 3) Stale-while-revalidate fallbacks.
  if (cached?.data) return cached.data; // stale Supabase snapshot
  try {
    const raw = localStorage.getItem(`swr:${cacheKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.d) return parsed.d;
    }
  } catch {
    /* ignore */
  }

  if (import.meta.env.DEV) console.error(`resilientGet(${cacheKey}) failed:`, lastErr?.message);
  return fallback;
}

/** A pre-configured axios instance with a sane timeout for the anime API. */
export const apiClient = axios.create({
  timeout: 9000,
  headers: { Accept: "application/json" },
});
