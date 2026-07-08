import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faCheck } from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "@/src/context/AuthContext";
import { addLater, removeLater, isLaterLocal } from "@/src/lib/watchlist";

/**
 * Reusable "Watch Later" toggle button.
 *
 * Works for BOTH anime and live-action movies/TV. The watch_later table keys
 * rows by a generic `anime_id` TEXT column, so we just pass a unique id:
 *   - anime  -> the AniList id (e.g. "21")
 *   - movie  -> "movie:<tmdbId>" (e.g. "movie:550")
 *   - tv     -> "tv:<tmdbId>"    (e.g. "tv:1399")
 *
 * `watchId` is stored so the dashboard can link straight back to the player:
 *   - anime  -> the anime slug         ("/watch/<slug>?ep=1" is rebuilt)
 *   - movie  -> the full movie route   ("/movies/movie/550")
 *
 * Props:
 *   mediaId   {string}  unique id (already prefixed for movies/tv)
 *   watchId   {string}  slug (anime) or full path (movie)
 *   title     {string}
 *   poster    {string}
 *   variant   {"pill"|"solid"|"icon"}  visual style
 *   className {string}  extra classes
 *   labelSaved / labelDefault  override text
 */
export default function WatchLaterButton({
  mediaId,
  watchId,
  title,
  poster,
  variant = "pill",
  className = "",
  labelDefault = "Watch Later",
  labelSaved = "Saved",
  showLabel = true,
}) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (mediaId == null) return;
    setSaved(isLaterLocal(mediaId));
  }, [mediaId]);

  const toggle = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (mediaId == null) return;

    if (saved) {
      setSaved(false);
      await removeLater(mediaId, userId);
    } else {
      setSaved(true);
      await addLater({ animeId: mediaId, watchId, title, poster }, userId);
    }
  };

  // ---- styling presets -------------------------------------------------
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 select-none";

  let styles = "";
  if (variant === "pill") {
    styles = saved
      ? "rounded-full px-6 py-3 text-sm bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/50 hover:bg-[#a855f7]/30"
      : "rounded-full px-6 py-3 text-sm bg-black/40 border border-white/15 text-white hover:bg-white/10";
  } else if (variant === "solid") {
    styles = saved
      ? "rounded-md px-6 py-3 bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/50 hover:bg-[#a855f7]/30"
      : "rounded-md px-6 py-3 bg-white/15 backdrop-blur-md border border-white/15 text-white hover:bg-white/25";
  } else if (variant === "icon") {
    styles = saved
      ? "h-11 w-11 rounded-full bg-[#a855f7]/30 text-[#c084fc] border border-[#a855f7]/50"
      : "h-11 w-11 rounded-full bg-black/55 text-white border border-white/20 hover:bg-black/75 backdrop-blur-md";
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={saved ? "Remove from Watch Later" : "Add to Watch Later"}
      aria-pressed={saved}
      className={`${base} ${styles} ${className}`}
    >
      <FontAwesomeIcon icon={saved ? faCheck : faBookmark} />
      {variant !== "icon" && showLabel && (
        <span>{saved ? labelSaved : labelDefault}</span>
      )}
    </button>
  );
}
