// Watch-progress ("continue watching") + watch-later helpers.
//
// When a user is LOGGED IN, everything is stored in Supabase (synced across
// devices) under their user_id, protected by Row-Level Security.
//
// When NOT logged in, we keep a local copy in localStorage so the feature still
// works for guests; on first login we MERGE the local data up to the cloud so
// nothing is lost.
//
// All functions degrade gracefully if Supabase tables aren't created yet
// (they just no-op on the cloud and use localStorage).

import { supabase } from "./supabase";

const LS_PROGRESS = "offanime:progress";
const LS_LATER = "offanime:later";

/* ----------------------------- localStorage ----------------------------- */
function lsGet(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}
function lsSet(key, obj) {
  try {
    localStorage.setItem(key, JSON.stringify(obj));
  } catch {
    /* ignore quota errors */
  }
}

/* ------------------------------ progress -------------------------------- */

/**
 * Save / update continue-watching for an anime.
 * @param {object} entry { animeId, watchId, title, poster, episode, total }
 * @param {string|null} userId  current user id (null for guests)
 */
export async function saveProgress(entry, userId) {
  if (!entry?.animeId) return;
  const animeId = String(entry.animeId);
  const row = {
    anime_id: animeId,
    watch_id: entry.watchId || null,
    title: entry.title || null,
    poster: entry.poster || null,
    episode: Number(entry.episode) || 1,
    total: entry.total != null ? Number(entry.total) : null,
    updated_at: new Date().toISOString(),
  };

  // Local copy (always — instant + guest support).
  //
  // The local store also keeps a few presentation-only extras that the cloud
  // schema doesn't have a column for (a wide backdrop, the season number, and
  // the media type). These power the Movies "Continue Watching" rail; they are
  // simply ignored by the cloud upsert below.
  const local = lsGet(LS_PROGRESS);
  local[animeId] = {
    ...row,
    animeId,
    backdrop: entry.backdrop || null,
    season: entry.season != null ? Number(entry.season) : null,
    media_type: entry.mediaType || null,
  };

  // Cap each kind of continue-watching at 10 entries. When an 11th title is
  // added, the OLDEST one (by updated_at) is dropped. Anime and movies/TV are
  // capped independently so adding movies never evicts anime and vice-versa.
  // (A media item is one whose id is prefixed "movie:" / "tv:".)
  const isMedia = (id) => /^(movie|tv):/i.test(id);
  const trimKind = (mediaKind) => {
    const ids = Object.keys(local)
      .filter((k) => isMedia(k) === mediaKind)
      .sort(
        (a, b) =>
          new Date(local[b].updated_at || 0) - new Date(local[a].updated_at || 0)
      );
    ids.slice(10).forEach((id) => delete local[id]);
  };
  trimKind(true); // movies / TV
  trimKind(false); // anime
  lsSet(LS_PROGRESS, local);

  if (userId && supabase) {
    try {
      await supabase
        .from("watch_progress")
        .upsert({ ...row, user_id: userId }, { onConflict: "user_id,anime_id" });
    } catch {
      /* offline / table missing -> local copy still saved */
    }
  }
}

/** List continue-watching, newest first. */
export async function listProgress(userId) {
  if (userId && supabase) {
    try {
      const { data, error } = await supabase
        .from("watch_progress")
        .select("anime_id, watch_id, title, poster, episode, total, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(60);
      if (!error && data) {
        return data.map((r) => ({ ...r, animeId: r.anime_id }));
      }
    } catch {
      /* fall through to local */
    }
  }
  const local = lsGet(LS_PROGRESS);
  return Object.values(local).sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
  );
}

/** Remove one continue-watching entry. */
export async function removeProgress(animeId, userId) {
  const id = String(animeId);
  const local = lsGet(LS_PROGRESS);
  delete local[id];
  lsSet(LS_PROGRESS, local);
  if (userId && supabase) {
    try {
      await supabase
        .from("watch_progress")
        .delete()
        .eq("user_id", userId)
        .eq("anime_id", id);
    } catch {
      /* ignore */
    }
  }
}

/* ----------------------------- watch later ------------------------------ */

export async function addLater(entry, userId) {
  if (!entry?.animeId) return;
  const animeId = String(entry.animeId);
  const row = {
    anime_id: animeId,
    watch_id: entry.watchId || null,
    title: entry.title || null,
    poster: entry.poster || null,
    added_at: new Date().toISOString(),
  };

  const local = lsGet(LS_LATER);
  local[animeId] = { ...row, animeId };
  lsSet(LS_LATER, local);

  if (userId && supabase) {
    try {
      await supabase
        .from("watch_later")
        .upsert({ ...row, user_id: userId }, { onConflict: "user_id,anime_id" });
    } catch {
      /* ignore */
    }
  }
}

export async function removeLater(animeId, userId) {
  const id = String(animeId);
  const local = lsGet(LS_LATER);
  delete local[id];
  lsSet(LS_LATER, local);
  if (userId && supabase) {
    try {
      await supabase
        .from("watch_later")
        .delete()
        .eq("user_id", userId)
        .eq("anime_id", id);
    } catch {
      /* ignore */
    }
  }
}

export async function listLater(userId) {
  if (userId && supabase) {
    try {
      const { data, error } = await supabase
        .from("watch_later")
        .select("anime_id, watch_id, title, poster, added_at")
        .eq("user_id", userId)
        .order("added_at", { ascending: false })
        .limit(100);
      if (!error && data) {
        return data.map((r) => ({ ...r, animeId: r.anime_id }));
      }
    } catch {
      /* fall through */
    }
  }
  const local = lsGet(LS_LATER);
  return Object.values(local).sort(
    (a, b) => new Date(b.added_at) - new Date(a.added_at)
  );
}

/** Is this anime in the watch-later list? (checks local copy synchronously) */
export function isLaterLocal(animeId) {
  const local = lsGet(LS_LATER);
  return Boolean(local[String(animeId)]);
}

/**
 * Build the correct watch link for a saved entry.
 *
 * Movies/TV store a route in `watch_id` (e.g. "/movies/movie/550") and use a
 * prefixed id ("movie:550" / "tv:1399"). Anime store the slug in `watch_id`
 * and a plain numeric id.
 *
 * @param {object} item  a row from listProgress/listLater
 * @returns {string} a route path
 */
export function watchHref(item) {
  if (!item) return "/";
  const id = String(item.animeId ?? item.anime_id ?? "");
  const watchId = item.watch_id || item.watchId || "";

  // Live-action movie / TV — watch_id is already a full path.
  const isMedia = id.startsWith("movie:") || id.startsWith("tv:");
  if (isMedia || watchId.startsWith("/movies/")) {
    if (watchId.startsWith("/")) return watchId;
    // Fallback: reconstruct from the prefixed id.
    const [kind, tmdb] = id.split(":");
    return `/movies/${kind}/${tmdb}`;
  }

  // Anime — rebuild the watch route from the slug.
  const ep = item.episode ? `?ep=${item.episode}` : "?ep=1";
  if (watchId) return `/watch/${watchId}${ep}`;
  return `/watch/${id}${ep}`;
}

/** True if a saved entry is a live-action movie/TV item (not anime). */
export function isMediaItem(item) {
  const id = String(item?.animeId ?? item?.anime_id ?? "");
  const watchId = item?.watch_id || item?.watchId || "";
  return id.startsWith("movie:") || id.startsWith("tv:") || watchId.startsWith("/movies/");
}

/* ------------------------- merge local -> cloud ------------------------- */

/**
 * On first login, push any guest (localStorage) data up to the cloud so the
 * user keeps their guest history. Best-effort; never throws.
 */
export async function mergeLocalToCloud(userId) {
  if (!userId || !supabase) return;

  try {
    const prog = Object.values(lsGet(LS_PROGRESS));
    if (prog.length) {
      const rows = prog.map((p) => ({
        user_id: userId,
        anime_id: String(p.animeId || p.anime_id),
        watch_id: p.watch_id || p.watchId || null,
        title: p.title || null,
        poster: p.poster || null,
        episode: Number(p.episode) || 1,
        total: p.total != null ? Number(p.total) : null,
        updated_at: p.updated_at || new Date().toISOString(),
      }));
      await supabase
        .from("watch_progress")
        .upsert(rows, { onConflict: "user_id,anime_id" });
    }

    const later = Object.values(lsGet(LS_LATER));
    if (later.length) {
      const rows = later.map((p) => ({
        user_id: userId,
        anime_id: String(p.animeId || p.anime_id),
        watch_id: p.watch_id || p.watchId || null,
        title: p.title || null,
        poster: p.poster || null,
        added_at: p.added_at || new Date().toISOString(),
      }));
      await supabase
        .from("watch_later")
        .upsert(rows, { onConflict: "user_id,anime_id" });
    }
  } catch {
    /* ignore — guest data simply stays local */
  }
}
