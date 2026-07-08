import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faShieldHalved,
  faCircleExclamation,
  faAngleLeft,
  faAngleRight,
  faClosedCaptioning,
  faSpinner,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import website_name from "@/src/config/website";
import MoviePlayer from "../components/MoviePlayer";
import MovieRow from "../components/MovieRow";
import { buildSources, resolveHls } from "../utils/sources";
import { getDetails, getSeasonEpisodes } from "../utils/tmdb";
import WatchLaterButton from "@/src/components/auth/WatchLaterButton";
import { saveProgress } from "@/src/lib/watchlist";
import { useAuth } from "@/src/context/AuthContext";

const ADBLOCK_KEY = "off_movies_adblock";

// Friendly labels shown on the server buttons.
const SERVER_LABELS = {
  "Server 1": "Server 1",
  "Server 2": "Server 2 (Ad-Free)",
  "Server 3": "Server 3",
  "Server 4": "Server 4",
  "Server 5": "Server 5",
  "Server 6": "Server 6",
  "Server 7": "Server 7",
  "Server 8": "Server 8",
  "Server 9": "Server 9",
  "Server 10": "Server 10",
};

export default function MovieWatch() {
  const { type, id } = useParams();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();

  const season = Math.max(1, parseInt(params.get("s") || "1", 10) || 1);
  const episode = Math.max(1, parseInt(params.get("e") || "1", 10) || 1);

  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // sources — `info.imdbId` (resolved from TMDB) is needed by some providers.
  const sources = useMemo(
    () => buildSources(type, id, season, episode, info?.imdbId || ""),
    [type, id, season, episode, info?.imdbId]
  );
  const [activeKey, setActiveKey] = useState(sources[0]?.key);
  const activeSource = useMemo(
    () => sources.find((s) => s.key === activeKey) || sources[0],
    [sources, activeKey]
  );

  // hls resolution
  const [streamUrl, setStreamUrl] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [resolving, setResolving] = useState(false);
  const [sourceErr, setSourceErr] = useState("");

  // ui state
  const [serverMenuOpen, setServerMenuOpen] = useState(false); // themed server selector
  const serverMenuRef = useRef(null);
  const [adblock, setAdblock] = useState(
    () => (localStorage.getItem(ADBLOCK_KEY) || "on") === "on"
  );

  // TV episodes
  const [episodes, setEpisodes] = useState([]);

  // When season/episode changes, reset to the first source again.
  useEffect(() => {
    setActiveKey(sources[0]?.key);
  }, [sources]);

  // Load media details (title, recommendations, episode sidebar).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const d = await getDetails(type, id);
        if (!alive) return;
        setInfo(d);
        if (d.type === "tv") {
          const eps = await getSeasonEpisodes(id, season);
          if (alive) setEpisodes(eps);
        }
      } catch {
        /* keep page usable even if metadata fails */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [type, id, season]);

  // Save to "Continue Watching" once the title's metadata is known.
  //
  // Live-action providers are external iframes / HLS where a precise playback
  // currentTime isn't reliably readable, so (like every iframe-based player on
  // the site) we record progress at the navigation level: opening a movie /
  // episode to watch marks it as "in progress". We write through the shared
  // watchlist lib using a MEDIA-prefixed id ("movie:550" / "tv:1399") and a
  // /movies/... watch_id. That keeps movies in their OWN store on the Movies
  // home page while the Dashboard (which reads the same store) merges them with
  // anime automatically.
  useEffect(() => {
    if (!info?.title) return;
    const tv = type === "tv";
    const watchId = `/movies/watch/${type}/${id}${
      tv ? `?s=${season}&e=${episode}` : ""
    }`;
    saveProgress(
      {
        animeId: `${tv ? "tv" : "movie"}:${id}`,
        watchId,
        title: info.title,
        poster: info.poster || info.backdrop || null,
        backdrop: info.backdrop || null,
        episode: tv ? episode : 1,
        season: tv ? season : null,
        mediaType: tv ? "tv" : "movie",
        total: tv ? episodes.length || null : null,
      },
      user?.id || null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info?.title, type, id, season, episode, episodes.length]);

  // Resolve the active source (HLS needs a network call; iframe does not).
  useEffect(() => {
    let alive = true;
    setSourceErr("");
    setStreamUrl(null);
    setSubtitles([]);

    if (!activeSource) return;
    if (activeSource.type === "iframe") return;

    (async () => {
      try {
        setResolving(true);
        const { streamUrl: url, subtitles: subs } = await resolveHls(activeSource.api);
        if (!alive) return;
        setStreamUrl(url);
        setSubtitles(subs);
      } catch (e) {
        if (alive) setSourceErr(e?.message || "This source is unavailable. Try another server.");
      } finally {
        if (alive) setResolving(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeSource?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close the server menu on outside click or Escape.
  useEffect(() => {
    const onClick = (e) => {
      if (serverMenuRef.current && !serverMenuRef.current.contains(e.target))
        setServerMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setServerMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggleAdblock = () => {
    setAdblock((prev) => {
      const next = !prev;
      localStorage.setItem(ADBLOCK_KEY, next ? "on" : "off");
      return next;
    });
  };

  const goEpisode = (ep) => {
    const p = new URLSearchParams(params);
    p.set("s", String(season));
    p.set("e", String(ep));
    setParams(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isTV = type === "tv";
  const totalEps = episodes.length;
  const title = info?.title || "Loading…";
  const pageTitle = isTV ? `${title} — S${season} E${episode}` : title;

  // Link to the universal Download page with this title's context pre-filled.
  const downloadHref = useMemo(() => {
    const p = new URLSearchParams({
      title: info?.title || "",
      kind: "movie",
      type: isTV ? "tv" : "movie",
      tmdb: String(id || ""),
      season: String(season),
      episode: String(episode),
      back: `/movies/watch/${type}/${id}${isTV ? `?s=${season}&e=${episode}` : ""}`,
    });
    if (info?.imdbId) p.set("imdb", info.imdbId);
    return `/download?${p.toString()}`;
  }, [info?.title, info?.imdbId, id, type, isTV, season, episode]);

  // group sources by server (dynamic — supports any number of servers)
  const serverGroups = useMemo(() => {
    const order = [];
    const map = new Map();
    for (const s of sources) {
      if (!map.has(s.server)) {
        map.set(s.server, []);
        order.push(s.server);
      }
      map.get(s.server).push(s);
    }
    return order.map((name) => ({ name, list: map.get(name) }));
  }, [sources]);

  const activeServer = activeSource?.server;

  // Only Server 1 (videasy) and Server 3 (vidapi) are external iframes that
  // can show ads — the Ad-Block toggle is relevant for those.
  const activeIsIframe = activeSource?.type === "iframe";

  return (
    <div className="w-full min-h-screen bg-[#0a0a0f] text-white pt-[70px] max-[575px]:pt-[60px]">
      <Helmet>
        <title>{`Watch ${pageTitle} - ${website_name}`}</title>
      </Helmet>

      <div className="max-w-[1600px] mx-auto px-4 py-5 max-[575px]:px-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-x-2 text-[13px] text-[#ffffff80] mb-3 flex-wrap">
          <Link to="/movies" className="hover:text-white">Movies &amp; TV</Link>
          <span>/</span>
          <Link to={`/movies/${type}/${id}`} className="hover:text-white line-clamp-1">{title}</Link>
          {isTV && (
            <>
              <span>/</span>
              <span className="text-white">S{season} · E{episode}</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-4 max-[1100px]:grid-cols-1">
          {/* ============ Player column ============ */}
          <div className="min-w-0">
            {/* Player toolbar */}
            <div className="flex items-center justify-between gap-x-3 mb-2 flex-wrap">
              <h1 className="text-lg font-semibold line-clamp-1 max-[575px]:text-base">
                {pageTitle}
              </h1>

              <div className="flex items-center gap-x-2 gap-y-2 flex-wrap justify-end">
                {/* Watch Later toggle (syncs to account when logged in) */}
                <WatchLaterButton
                  mediaId={`${isTV ? "tv" : "movie"}:${id}`}
                  watchId={`/movies/${type}/${id}`}
                  title={info?.title || title}
                  poster={info?.poster || info?.backdrop}
                  className="!py-2 !px-3 !text-[13px] !rounded-md"
                  variant="solid"
                />

                {/* Download button -> universal download page */}
                <Link
                  to={downloadHref}
                  title="Download this title from external sources"
                  className="flex items-center gap-x-2 py-2 px-3 rounded-md text-[13px] font-semibold bg-[#ffffff14] text-[#ffffffd0] hover:bg-[#ffffff22] transition-all duration-300"
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Download
                </Link>

                {/* Ad-Block toggle (green when ON) */}
                <button
                  onClick={toggleAdblock}
                  title={
                    adblock
                      ? "Ad-Block is ON — external players (Server 1/3) run sandboxed to block pop-ups & redirects. If a server won't play, turn this OFF."
                      : "Ad-Block is OFF — external players run unrestricted (more compatible, may show ads)."
                  }
                  className={`flex items-center gap-x-2 py-2 px-3 rounded-md text-[13px] font-semibold transition-all duration-300 ${
                    adblock
                      ? "bg-[#22c55e] text-white shadow-lg shadow-[#22c55e]/25"
                      : "bg-[#ffffff14] text-[#ffffffb0] hover:bg-[#ffffff22]"
                  }`}
                >
                  <FontAwesomeIcon icon={faShieldHalved} />
                  Ad-Block: {adblock ? "ON" : "OFF"}
                </button>

                {/* Themed server dropdown (purple accent matches movies theme) */}
                <div className="relative ml-1" ref={serverMenuRef}>
                  <button
                    type="button"
                    onClick={() => setServerMenuOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={serverMenuOpen}
                    className={`flex items-center gap-x-2.5 py-2 pl-2.5 pr-3 rounded-md text-[13px] font-semibold transition-all duration-300 min-w-[150px] ${
                      serverMenuOpen
                        ? "bg-[#a855f7]/15 text-white ring-1 ring-[#a855f7]/50"
                        : "bg-[#ffffff14] text-[#ffffffd0] hover:bg-[#ffffff22]"
                    }`}
                  >
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br from-[#a855f7] to-[#c084fc] text-white text-[10px]">
                      <FontAwesomeIcon icon={faClosedCaptioning} />
                    </span>
                    <span className="flex flex-col items-start leading-none min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-[#c084fc]/80">
                        Server
                      </span>
                      <span className="truncate font-semibold">
                        {SERVER_LABELS[activeServer] || activeServer || "Select"}
                        {activeServer === "Server 2" && activeSource?.label && (
                          <span className="text-white/60 font-normal">
                            {" "}· {activeSource.label}
                          </span>
                        )}
                      </span>
                    </span>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`ml-auto text-[11px] text-[#c084fc] transition-transform duration-300 ${
                        serverMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown panel */}
                  <div
                    className={`absolute right-0 z-50 mt-2 w-[240px] origin-top-right overflow-hidden rounded-xl border border-[#a855f7]/25 bg-[#13101b]/95 shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-200 ${
                      serverMenuOpen
                        ? "scale-100 opacity-100 pointer-events-auto"
                        : "pointer-events-none scale-95 opacity-0"
                    }`}
                    role="listbox"
                  >
                    <div className="border-b border-white/[0.06] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#c084fc]/70">
                      Choose a server
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto py-1.5 [scrollbar-width:thin]">
                      {serverGroups.map((group) => {
                        const isActive = group.name === activeServer;
                        const isServer2 = group.name === "Server 2";
                        return (
                          <div key={group.name}>
                            <button
                              onClick={() => {
                                if (isServer2) {
                                  if (!group.list.some((s) => s.key === activeKey)) {
                                    setActiveKey(group.list[0].key);
                                  }
                                } else {
                                  setActiveKey(group.list[0].key);
                                  setServerMenuOpen(false);
                                }
                              }}
                              className={`flex w-full items-center justify-between gap-x-2 px-3 py-2.5 text-left text-[13px] transition-colors duration-150 ${
                                isActive
                                  ? "bg-[#a855f7]/15 text-white"
                                  : "text-[#ffffffc0] hover:bg-white/[0.06] hover:text-white"
                              }`}
                            >
                              <span className="flex items-center gap-x-2.5 min-w-0">
                                <span
                                  className={`h-2 w-2 flex-shrink-0 rounded-full ${
                                    isActive
                                      ? "bg-[#a855f7] shadow-[0_0_6px_#a855f7]"
                                      : "bg-white/25"
                                  }`}
                                />
                                <span className="truncate font-medium">
                                  {SERVER_LABELS[group.name] || group.name}
                                </span>
                              </span>
                              {isActive ? (
                                <FontAwesomeIcon
                                  icon={faChevronDown}
                                  className="flex-shrink-0 text-[10px] text-[#c084fc]"
                                />
                              ) : (
                                <span className="text-[10px] text-[#ffffff55]">
                                  {group.list.length > 1 ? `${group.list.length}` : ""}
                                </span>
                              )}
                            </button>

                            {/* Server 2 provider sub-list (only when it is the active server) */}
                            {isServer2 && isActive && (
                              <div className="bg-black/30 py-1">
                                {group.list.map((s) => (
                                  <button
                                    key={s.key}
                                    onClick={() => {
                                      setActiveKey(s.key);
                                      setServerMenuOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between gap-x-2 py-1.5 pl-8 pr-3 text-left text-[12px] transition-colors duration-150 ${
                                      s.key === activeKey
                                        ? "text-white"
                                        : "text-[#ffffff99] hover:text-white"
                                    }`}
                                  >
                                    <span className="flex items-center gap-x-2 min-w-0">
                                      <span
                                        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                                          s.key === activeKey
                                            ? "bg-[#c084fc]"
                                            : "bg-white/20"
                                        }`}
                                      />
                                      <span className="truncate">{s.label}</span>
                                    </span>
                                    {s.cc && (
                                      <span className="flex items-center gap-x-1 text-[10px] text-[#ffffff80]">
                                        <FontAwesomeIcon icon={faClosedCaptioning} />
                                        CC
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contextual hint under the toolbar */}
            <p className="text-[12px] text-[#ffffff66] mb-2 -mt-1 flex items-center gap-x-1.5 flex-wrap">
              {activeServer === "Server 2" ? (
                <>
                  <FontAwesomeIcon icon={faShieldHalved} className="text-[#86efac]" />
                  <span className="text-[#86efac]">Server 2 plays ad-free</span>
                  <span>in our own player — pick a provider above if one fails.</span>
                </>
              ) : activeIsIframe ? (
                <span>
                  External player ({activeServer}). If it doesn&apos;t load, toggle{" "}
                  <span className="text-[#86efac] font-medium">Ad-Block</span> or try another
                  server. For a fully ad-free stream, use{" "}
                  <span className="text-[#a855f7] font-medium">Server 2</span>.
                </span>
              ) : null}
            </p>

            {/* Player surface */}
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-[#ffffff14]">
              {resolving && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 gap-y-3">
                  <FontAwesomeIcon icon={faSpinner} className="text-3xl text-[#a855f7] animate-spin" />
                  <p className="text-sm text-[#ffffffb0]">Loading {activeSource?.label}…</p>
                </div>
              )}

              {sourceErr && !resolving ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-y-3 px-6 text-center">
                  <FontAwesomeIcon icon={faCircleExclamation} className="text-3xl text-[#ff6b6b]" />
                  <p className="text-sm text-[#ffffffd0] max-w-md">{sourceErr}</p>
                  <p className="text-[13px] text-[#ffffff80]">
                    Try another server using the <span className="text-[#a855f7] font-medium">server buttons</span> above.
                  </p>
                </div>
              ) : (
                <MoviePlayer
                  source={activeSource}
                  streamUrl={streamUrl}
                  subtitles={subtitles}
                  poster={info?.backdrop || info?.poster}
                  adblock={adblock}
                  onError={(e) =>
                    setSourceErr(e?.message || "Playback failed. Try another source.")
                  }
                />
              )}
            </div>

            {/* Episode prev/next (TV) */}
            {isTV && totalEps > 0 && (
              <div className="flex items-center justify-between mt-3">
                <button
                  disabled={episode <= 1}
                  onClick={() => goEpisode(episode - 1)}
                  className="flex items-center gap-x-2 py-2 px-3 rounded-md text-[13px] bg-[#ffffff14] hover:bg-[#ffffff22] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <FontAwesomeIcon icon={faAngleLeft} /> Prev
                </button>
                <span className="text-[13px] text-[#ffffff80]">
                  Episode {episode} of {totalEps}
                </span>
                <button
                  disabled={episode >= totalEps}
                  onClick={() => goEpisode(episode + 1)}
                  className="flex items-center gap-x-2 py-2 px-3 rounded-md text-[13px] bg-[#ffffff14] hover:bg-[#ffffff22] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next <FontAwesomeIcon icon={faAngleRight} />
                </button>
              </div>
            )}

            {/* Movie meta (below player) */}
            {info && (
              <div className="mt-5 flex items-start gap-x-4">
                {info.poster && (
                  <img
                    src={info.poster}
                    alt={info.title}
                    className="w-[90px] rounded-md flex-shrink-0 max-[575px]:w-[70px]"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0">
                  <Link
                    to={`/movies/${type}/${id}`}
                    className="text-xl font-semibold hover:text-[#a855f7] transition-colors max-[575px]:text-lg"
                  >
                    {info.title}
                  </Link>
                  <div className="flex items-center gap-x-3 mt-1 text-[13px] text-[#ffffff90] flex-wrap">
                    {info.year && <span>{info.year}</span>}
                    {info.rating && <span>★ {info.rating}</span>}
                    <span className="uppercase text-[#a855f7] font-medium">{isTV ? "TV" : "Movie"}</span>
                  </div>
                  <p className="text-[13px] text-[#ffffff99] mt-2 line-clamp-3">
                    {info.overview}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ============ Episode sidebar (TV) ============ */}
          {isTV && (
            <aside className="min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-base">Season {season}</h2>
                {info?.seasons?.length > 1 && (
                  <select
                    value={season}
                    onChange={(e) => {
                      const p = new URLSearchParams(params);
                      p.set("s", e.target.value);
                      p.set("e", "1");
                      setParams(p);
                    }}
                    className="bg-[#15151d] border border-[#ffffff1a] rounded-md py-1.5 px-2 text-[13px] outline-none"
                  >
                    {info.seasons.map((s) => (
                      <option key={s.season_number} value={s.season_number}>
                        Season {s.season_number}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-y-2 max-h-[640px] overflow-y-auto pr-1 max-[1100px]:max-h-none">
                {episodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => goEpisode(ep.episodeNumber)}
                    className={`flex gap-x-3 p-2 rounded-md text-left transition-colors duration-200 ${
                      ep.episodeNumber === episode
                        ? "bg-[#a855f71f] border border-[#a855f74d]"
                        : "bg-[#ffffff08] hover:bg-[#ffffff12] border border-transparent"
                    }`}
                  >
                    <div className="relative w-[110px] flex-shrink-0 aspect-video rounded overflow-hidden bg-[#222]">
                      {ep.still && (
                        <img src={ep.still} alt={ep.name} className="w-full h-full object-cover" loading="lazy" />
                      )}
                      <span className="absolute bottom-1 left-1 bg-black/70 text-[10px] px-1.5 py-0.5 rounded">
                        E{ep.episodeNumber}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium line-clamp-1">{ep.name || `Episode ${ep.episodeNumber}`}</p>
                      <p className="text-[11px] text-[#ffffff80] mt-0.5">
                        {ep.airDate || ""}{ep.rating ? ` · ★ ${ep.rating}` : ""}
                      </p>
                      <p className="text-[11px] text-[#ffffff66] mt-1 line-clamp-2">{ep.overview}</p>
                    </div>
                  </button>
                ))}
                {!episodes.length && !loading && (
                  <p className="text-[13px] text-[#ffffff80]">No episodes found for this season.</p>
                )}
              </div>
            </aside>
          )}
        </div>

        {/* Recommendations */}
        {info?.recommendations?.length > 0 && (
          <div className="mt-10">
            <MovieRow label="You may also like" data={info.recommendations} limit={12} />
          </div>
        )}
      </div>
    </div>
  );
}
