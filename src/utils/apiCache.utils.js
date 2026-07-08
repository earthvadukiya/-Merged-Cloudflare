// Lightweight client-side cache for API responses.
//
// Why: the anime data APIs are Vercel serverless functions that can cold-start
// (multi-second) and we were re-fetching the same anime/episode data on every
// navigation. This made the watch page feel slow (6-7s for episode buttons to
// appear) even though the payloads are tiny.
//
// Strategy:
//  - In-memory Map for instant hits within the same session/tab.
//  - sessionStorage as a fallback so client-side route changes (and quick
//    back/forward) stay instant without hammering the API.
//  - A short TTL so data still refreshes for long-lived tabs.

const memory = new Map();

// Default 10 minutes; episodes/details don't change often within a session.
const DEFAULT_TTL = 10 * 60 * 1000;

function now() {
  return Date.now();
}

function readSession(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(key, entry) {
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // sessionStorage can be full or blocked (private mode) — ignore.
  }
}

export function getCached(key, ttl = DEFAULT_TTL) {
  const mem = memory.get(key);
  if (mem && now() - mem.t < ttl) {
    return mem.v;
  }

  const sess = readSession(key);
  if (sess && now() - sess.t < ttl) {
    memory.set(key, sess); // promote into memory for instant future reads
    return sess.v;
  }

  return undefined;
}

export function setCached(key, value) {
  const entry = { v: value, t: now() };
  memory.set(key, entry);
  writeSession(key, entry);
}

// Wrap an async loader with caching. If a fresh cached value exists it is
// returned immediately (no network). Otherwise the loader runs and its result
// is cached. `null`/`undefined`/empty-array results are NOT cached so we retry
// next time instead of caching a failure.
export async function cachedFetch(key, loader, ttl = DEFAULT_TTL) {
  const hit = getCached(key, ttl);
  if (hit !== undefined) return hit;

  const value = await loader();

  const isEmpty =
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0);

  if (!isEmpty) setCached(key, value);

  return value;
}
