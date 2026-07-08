/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";

/**
 * The Anime Community comment section, embedded per anime episode.
 *
 * Docs: https://theanimecommunity.com/add-to-site
 * The widget needs ONE of MAL_ID / AniList_ID plus an episode number. We load
 * its embed.js exactly once, then call window.theAnimeCommunity.reload() whenever
 * the user navigates to a different anime/episode (so it stays in sync with the
 * player without reloading the page).
 */
export default function AnimeComments({ malId, anilistId, episode, mediaType = "anime" }) {
  const loadedRef = useRef(false);

  useEffect(() => {
    // Need at least one identifier + an episode to show a comment thread.
    const hasId = malId || anilistId;
    if (!hasId) return;

    const config = {
      episodeChapterNumber: String(episode || 1),
      mediaType,
      // Match the site's dark + pink (#ffbade) theme.
      colorScheme: {
        primaryColor: "#ff7eb6",
        backgroundColor: "#0c0c12",
        dropDownTextColor: "#ffffff",
        strongTextColor: "#ffbade",
        primaryTextColor: "#ffffff",
        secondaryTextColor: "#9ca3af",
        iconColor: "#ffbade",
        accentColor: "rgba(255,186,222,0.25)",
      },
      removeBorder: "true",
    };
    if (malId) config.MAL_ID = String(malId);
    else config.AniList_ID = String(anilistId);

    window.theAnimeCommunityConfig = config;

    // First mount: inject embed.js once. Subsequent id/episode changes just
    // call reload() against the already-loaded widget.
    if (!loadedRef.current) {
      loadedRef.current = true;
      const existing = document.getElementById("anime-community-script");
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://theanimecommunity.com/embed.js";
        script.id = "anime-community-script";
        script.defer = true;
        document.body.appendChild(script);
      } else if (window.theAnimeCommunity?.reload) {
        window.theAnimeCommunity.reload();
      }
    } else if (window.theAnimeCommunity?.reload) {
      try {
        window.theAnimeCommunity.reload();
      } catch {
        /* widget not ready yet — it'll pick up the config on first load */
      }
    }
  }, [malId, anilistId, episode, mediaType]);

  if (!malId && !anilistId) return null;

  return (
    <section className="w-full min-w-0 max-w-full mt-8" id="anime-comments">
      <div className="flex items-center gap-x-2 mb-4">
        <span className="w-1 h-6 rounded bg-gradient-to-b from-[#ffbade] to-[#ff7eb6]" />
        <h2 className="text-white text-xl font-bold max-[575px]:text-lg">
          Community Comments
        </h2>
      </div>
      {/* min-w-0 + max-w-full + overflow-hidden stop the embedded comment iframe
          from forcing the whole page wider than the viewport. The inner [&_iframe]
          rule forces any injected iframe to 100% width. */}
      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl bg-[#0c0c12] ring-1 ring-white/[0.06] p-2 max-[575px]:p-0 [&_iframe]:max-w-full [&_iframe]:w-full">
        <div id="anime-community-comment-section" className="w-full min-w-0 max-w-full overflow-hidden" />
      </div>
    </section>
  );
}
