/* eslint-disable react/prop-types */
import Hls from "hls.js";
import Artplayer from "artplayer";
import { useEffect, useRef } from "react";
import website_name from "@/src/config/website";

Artplayer.LOG_VERSION = false;
Artplayer.CONTEXTMENU = false;

/**
 * Resolve the sandbox attribute string for an iframe source.
 *
 *   adblock OFF            -> undefined (no sandbox, max compatibility)
 *   source.sandbox "none"  -> undefined (player refuses any sandbox)
 *   source.sandbox "loose" -> megaplay-style: keep popup tokens present but
 *                             withhold unrestricted top-navigation
 *   source.sandbox "safe"  -> blocks pop-ups / redirects, keeps the player
 *                             playable (default for most providers)
 */
function getSandbox(source, adblock) {
  if (!adblock) return undefined;
  const mode = source?.sandbox || "safe";
  if (mode === "none") return undefined;
  if (mode === "loose") {
    return "allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation";
  }
  // "safe": player runs (scripts + same-origin), but pop-ups, top-navigation
  // and modals are withheld — which is what kills most ad scripts.
  return "allow-scripts allow-same-origin allow-presentation allow-forms";
}

/**
 * MoviePlayer — dedicated player for the Movies / TV section.
 *   - source.type === "hls":   native ArtPlayer + hls.js (ad-free).
 *   - source.type === "iframe": external player (Server 1 = videasy,
 *                               Server 3 = vidapi).
 *
 * Ad-Block toggle (`adblock` prop):
 *   - ON  -> external iframes get a `sandbox` attribute that blocks pop-ups,
 *           auto-redirects and top-navigation (kills most ads).
 *   - OFF -> iframe runs unrestricted (most compatible). Some external players
 *           (notably Server 1 / videasy) detect sandbox restrictions and refuse
 *           to play — turning Ad-Block OFF lets those load.
 *   Either way, Server 2 (ezvidapi/HLS) plays ad-free in our own ArtPlayer.
 */
export default function MoviePlayer({
  source,
  streamUrl,
  subtitles = [],
  poster,
  adblock = true,
  onError,
}) {
  const containerRef = useRef(null);
  const artRef = useRef(null);

  useEffect(() => {
    if (!source || source.type !== "hls" || !streamUrl) return;
    if (!containerRef.current) return;

    const playM3u8 = (video, url, art) => {
      if (Hls.isSupported()) {
        if (art.hls) art.hls.destroy();
        const hls = new Hls({ maxBufferLength: 30 });
        hls.loadSource(url);
        hls.attachMedia(video);
        art.hls = hls;
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data?.fatal) onError?.(new Error("Playback error on this source"));
        });
        art.on("destroy", () => hls.destroy());
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else {
        onError?.(new Error("HLS not supported in this browser"));
      }
    };

    const art = new Artplayer({
      container: containerRef.current,
      url: streamUrl,
      type: "m3u8",
      poster: poster || "",
      volume: 0.8,
      autoplay: false,
      pip: true,
      autoSize: false,
      autoMini: true,
      setting: true,
      playbackRate: true,
      fullscreen: true,
      fullscreenWeb: true,
      miniProgressBar: true,
      backdrop: true,
      theme: "#a855f7",
      moreVideoAttr: { crossOrigin: "anonymous", playsInline: true },
      subtitle:
        subtitles?.length > 0
          ? {
              url: subtitles[0].url,
              type: subtitles[0].url.endsWith(".vtt") ? "vtt" : "srt",
              encoding: "utf-8",
              escape: false,
              style: { color: "#fff", fontSize: "20px" },
            }
          : undefined,
      settings:
        subtitles?.length > 1
          ? [
              {
                width: 250,
                html: "Subtitle",
                selector: subtitles.map((s, i) => ({
                  html: s.label,
                  url: s.url,
                  default: i === 0,
                })),
                onSelect: function (item) {
                  art.subtitle.switch(item.url, { name: item.html });
                  return item.html;
                },
              },
            ]
          : [],
      customType: { m3u8: playM3u8 },
    });

    art.on("ready", () => {
      art.title = `${website_name} Movies`;
    });
    artRef.current = art;

    return () => {
      try {
        if (art && art.destroy) art.destroy(false);
      } catch {
        /* noop */
      }
      artRef.current = null;
    };
  }, [source?.key, streamUrl, poster]); // eslint-disable-line react-hooks/exhaustive-deps

  if (source?.type === "iframe") {
    // When Ad-Block is ON, sandbox the iframe to block pop-ups / redirects.
    // We still allow scripts + same-origin so the player itself can run, but we
    // withhold `allow-popups`, `allow-top-navigation` and `allow-modals`, which
    // is what most ad scripts rely on. When OFF, no sandbox (max compatibility).
    const sandbox = getSandbox(source, adblock);
    return (
      <div className="relative w-full h-full bg-black">
        <iframe
          key={`${source.key}-${adblock ? "ab" : "raw"}`}
          src={source.url}
          title={source.label}
          className="w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          sandbox={sandbox}
          referrerPolicy="origin"
          style={{ border: 0 }}
        />
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full bg-black movie-art-player" />;
}
