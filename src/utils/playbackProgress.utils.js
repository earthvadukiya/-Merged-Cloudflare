/**
 * Playback position tracking ("resume where you left off").
 *
 * Stores the last playback position PER episode in localStorage under a single
 * key, separate from the "continueWatching" rail data. This lets the player jump
 * back to the exact second the viewer stopped at, even across tabs/sessions.
 *
 * We key by a stable string: `${animeId}:${episodeNumber}` so each episode keeps
 * its own resume point. Entries older than 60 days are pruned automatically so
 * the store never grows unbounded.
 */
const KEY = "offanime:playback";
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
// If the viewer finished >= 95% of an episode we treat it as "watched" and do
// NOT resume (so they don't get dropped into the last 30s of credits).
const FINISHED_RATIO = 0.95;
// Don't bother resuming the very first few seconds.
const MIN_RESUME_SECONDS = 10;

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj));
  } catch {
    /* ignore quota errors */
  }
}

export function progressKey(animeId, episode) {
  return `${animeId ?? "?"}:${episode ?? "?"}`;
}

/**
 * Save the current playback position for an episode.
 * @param {string} key      progressKey(animeId, episode)
 * @param {number} time     current time in seconds
 * @param {number} duration total duration in seconds
 */
export function savePosition(key, time, duration) {
  if (!key || !Number.isFinite(time) || time < 0) return;
  const all = read();
  all[key] = {
    t: Math.floor(time),
    d: Math.floor(duration) || 0,
    at: Date.now(),
  };

  // Prune stale entries.
  const cutoff = Date.now() - MAX_AGE_MS;
  for (const k of Object.keys(all)) {
    if ((all[k]?.at || 0) < cutoff) delete all[k];
  }
  write(all);
}

/**
 * Returns the second to resume from, or 0 if there's nothing useful to resume
 * (no record, too early, or already finished).
 */
export function getResumeTime(key) {
  if (!key) return 0;
  const rec = read()[key];
  if (!rec || !Number.isFinite(rec.t)) return 0;
  if (rec.t < MIN_RESUME_SECONDS) return 0;
  if (rec.d > 0 && rec.t / rec.d >= FINISHED_RATIO) return 0;
  return rec.t;
}

/** Clear a single episode's resume point (e.g. when it finishes). */
export function clearPosition(key) {
  if (!key) return;
  const all = read();
  if (all[key]) {
    delete all[key];
    write(all);
  }
}
