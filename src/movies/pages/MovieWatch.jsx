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
} from "@fortawesome/free-solid-svg-icons";
import website_name from "@/src/config/website";
import MoviePlayer from "../components/MoviePlayer";
import MovieRow from "../components/MovieRow";
import { buildSources, resolveHls } from "../utils/sources";
import { getDetails, getSeasonEpisodes } from "../utils/tmdb";

const ADBLOCK_KEY = "off_movies_adblock";

// Friendly labels shown on the server buttons.
const SERVER_LABELS = {
  "Server 1": "Server 1",
  "Server 2": "Server 2 (Ad-Free)",
  "Server 3": "Server 3",
};

export default function MovieWatch() {
  const { type, id } = useParams();
  const [params, setParams] = useSearchParams();

  const season = Math.max(1, parseInt(params.get("s") || "1", 10) || 1);
  const episode = Math.max(1, parseInt(params.get("e") || "1", 10) || 1);

  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // sources
  const sources = useMemo(
    () => buildSources(type, id, season, episode),
    [type, id, season, episode]
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
  const [menuOpen, setMenuOpen] = useState(false); // Server 2 provider dropdown
  const menuRef = useRef(null);
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

  // Close source menu on outside click.
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
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

  // group sources by server
  const server1 = sources.filter((s) => s.server === "Server 1");
  const server2 = sources.filter((s) => s.server === "Server 2");
  const server3 = sources.filter((s) => s.server === "Server 3");

  // Ordered list of servers that actually have sources, for the button row.
  const serverGroups = [
    { name: "Server 1", list: server1 },
    { name: "Server 2", list: server2 },
    { name: "Server 3", list: server3 },
  ].filter((g) => g.list.length > 0);

  const activeServer = activeSource?.server;

  // Selecting a server activates its first source (Server 2 keeps the chosen
  // provider so users can switch between its many providers).
  const selectServer = (group) => {
    setMenuOpen(false);
    const alreadyOn = group.list.some((s) => s.key === activeKey);
    if (alreadyOn) {
      // Re-clicking the active Server 2 button opens the provider picker.
      if (group.name === "Server 2") setMenuOpen((o) => !o);
      return;
    }
    setActiveKey(group.list[0].key);
  };

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

                {/* "Server:" label */}
                <span className="text-[13px] text-[#ffffff80] font-medium ml-1 max-[575px]:hidden">
                  Server:
                </span>

                {/* Per-server buttons */}
                {serverGroups.map((group) => {
                  const isActive = group.name === activeServer;
                  const isServer2 = group.name === "Server 2";
                  return (
                    <div
                      key={group.name}
                      className="relative"
                      ref={isServer2 ? menuRef : undefined}
                    >
                      <button
                        onClick={() => selectServer(group)}
                        className={`flex items-center gap-x-2 py-2 px-3 rounded-md text-[13px] font-semibold transition-all duration-300 ${
                          isActive
                            ? "bg-[#a855f7] text-white shadow-lg shadow-[#a855f7]/25"
                            : "bg-[#ffffff14] text-[#ffffffd0] hover:bg-[#ffffff22]"
                        }`}
                      >
                        {SERVER_LABELS[group.name] || group.name}
                        {/* Server 2 has many providers -> show its current pick + chevron */}
                        {isServer2 && isActive && (
                          <>
                            <span className="text-white/70 font-normal">
                              · {activeSource?.label}
                            </span>
                            <FontAwesomeIcon
                              icon={faChevronDown}
                              className={`text-[11px] transition-transform duration-300 ${
                                menuOpen ? "rotate-180" : ""
                              }`}
                            />
                          </>
                        )}
                      </button>

                      {/* Server 2 provider picker */}
                      {isServer2 && menuOpen && (
                        <div className="absolute right-0 mt-2 w-[220px] max-h-[60vh] overflow-y-auto bg-[#15151d] border border-[#ffffff1a] rounded-lg shadow-2xl z-50 py-2">
                          <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-[#ffffff66] font-semibold">
                            Server 2 · Providers
                          </div>
                          {group.list.map((s) => (
                            <button
                              key={s.key}
                              onClick={() => {
                                setActiveKey(s.key);
                                setMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between gap-x-2 px-3 py-2 text-left text-[13px] transition-colors duration-200 ${
                                s.key === activeKey
                                  ? "bg-[#a855f71f] text-white"
                                  : "text-[#ffffffc0] hover:bg-[#ffffff10]"
                              }`}
                            >
                              <span className="flex items-center gap-x-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    s.key === activeKey ? "bg-[#a855f7]" : "bg-[#ffffff33]"
                                  }`}
                                />
                                {s.label}
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
