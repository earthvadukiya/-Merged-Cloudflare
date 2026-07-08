import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faStar,
  faClock,
  faSpinner,
  faVolumeHigh,
  faVolumeXmark,
  faStop,
  faRotateRight,
  faFire,
  faUsers,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import website_name from "@/src/config/website";
import MovieRow from "../components/MovieRow";
import { getDetails, getSeasonEpisodes } from "../utils/tmdb";
import WatchLaterButton from "@/src/components/auth/WatchLaterButton";

export default function MovieInfo() {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  const [activeSeason, setActiveSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [epLoading, setEpLoading] = useState(false);

  // Background trailer controls
  const [trailerOn, setTrailerOn] = useState(true);
  const [muted, setMuted] = useState(true);
  const trailerStartRef = useRef(Date.now());

  useEffect(() => {
    setTrailerOn(true);
    setMuted(true);
    trailerStartRef.current = Date.now();
  }, [type, id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(false);
        const d = await getDetails(type, id);
        if (!alive) return;
        setInfo(d);
        if (d.type === "tv" && d.seasons?.length) {
          setActiveSeason(d.seasons[0].season_number);
        }
      } catch {
        if (alive) setErr(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [type, id]);

  // Load episodes for the active season (TV only)
  useEffect(() => {
    if (info?.type !== "tv") return;
    let alive = true;
    (async () => {
      try {
        setEpLoading(true);
        const eps = await getSeasonEpisodes(id, activeSeason);
        if (alive) setEpisodes(eps);
      } finally {
        if (alive) setEpLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [info?.type, id, activeSeason]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="text-4xl text-[#a855f7] animate-spin" />
      </div>
    );
  }

  if (err || !info) {
    return (
      <div className="w-full min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center gap-y-4 px-4 text-center">
        <p className="text-lg">Couldn&apos;t load this title.</p>
        <Link to="/movies" className="text-[#a855f7] hover:underline">Back to Movies</Link>
      </div>
    );
  }

  const isTV = info.type === "tv";
  const watchPath = isTV
    ? `/movies/watch/tv/${id}?s=${activeSeason}&e=1`
    : `/movies/watch/movie/${id}`;

  const hasTrailer = !!info.trailerKey;
  const showTrailer = hasTrailer && trailerOn;
  const trailerSrc = info.trailerKey
    ? `https://www.youtube.com/embed/${info.trailerKey}?autoplay=1&mute=${
        muted ? 1 : 0
      }&controls=0&loop=1&playlist=${info.trailerKey}&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&disablekb=1`
    : "";

  const restartTrailer = () => {
    setTrailerOn(true);
    setMuted(true);
    trailerStartRef.current = Date.now();
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0a0f] text-white">
      <Helmet>
        <title>{`${info.title} - ${website_name}`}</title>
      </Helmet>

      {/* Hero with background trailer (Netflix-style cinematic banner) */}
      <div className="relative w-full overflow-hidden min-h-[78vh] max-[758px]:min-h-[68vh] max-[575px]:min-h-[72vh] flex items-end">
        {info.backdrop && (
          <img
            src={info.backdrop}
            alt={info.title}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        )}

        {showTrailer && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <iframe
              key={`${info.trailerKey}-${muted ? "m" : "u"}`}
              src={trailerSrc}
              title={`${info.title} trailer`}
              allow="autoplay; encrypted-media"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full pointer-events-none"
              style={{ border: 0 }}
              tabIndex={-1}
            />
          </div>
        )}

        {hasTrailer && (
          <div className="absolute top-[88px] right-6 z-20 flex items-center gap-2 max-[575px]:top-[72px] max-[575px]:right-3">
            {trailerOn ? (
              <>
                <button
                  onClick={() => setMuted((m) => !m)}
                  title={muted ? "Unmute trailer" : "Mute trailer"}
                  className="w-10 h-10 rounded-full bg-black/55 hover:bg-black/75 border border-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all"
                >
                  <FontAwesomeIcon icon={muted ? faVolumeXmark : faVolumeHigh} />
                </button>
                <button
                  onClick={() => setTrailerOn(false)}
                  title="Stop trailer"
                  className="w-10 h-10 rounded-full bg-black/55 hover:bg-black/75 border border-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all"
                >
                  <FontAwesomeIcon icon={faStop} />
                </button>
              </>
            ) : (
              <button
                onClick={restartTrailer}
                title="Play trailer"
                className="flex items-center gap-x-2 h-10 px-4 rounded-full bg-black/55 hover:bg-black/75 border border-white/20 backdrop-blur-md text-white text-[13px] font-medium transition-all"
              >
                <FontAwesomeIcon icon={faRotateRight} /> Trailer
              </button>
            )}
          </div>
        )}

        {/* Netflix-style gradients: strong fade from the dark left edge + a
            bottom fade so the content sits over a readable dark area. */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />

        {/* Content anchored to the lower-left third (Netflix layout) */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 pb-14 pt-[120px] max-[575px]:px-4 max-[575px]:pb-10">
          <div className="max-w-[640px] min-w-0">
            {/* Title / Logo */}
            {info.logo ? (
              <img
                src={info.logo}
                alt={info.title}
                className="max-h-[150px] max-w-[80%] mb-4 object-contain object-left drop-shadow-2xl max-[575px]:max-h-[90px]"
              />
            ) : (
              <h1 className="text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.05] mb-4 drop-shadow-2xl">
                {info.title}
              </h1>
            )}

            {info.tagline && (
              <p className="text-[#a855f7] italic text-[15px] mb-4 max-[575px]:text-[13px]">
                &ldquo;{info.tagline}&rdquo;
              </p>
            )}

            {/* Metadata row (Netflix style: rating match, year, type, runtime) */}
            <div className="flex items-center gap-x-3 gap-y-2 mb-5 flex-wrap text-[14px] max-[575px]:text-[13px]">
              {info.rating && (
                <span className="text-[#4ade80] font-semibold flex items-center gap-x-1">
                  <FontAwesomeIcon icon={faStar} className="text-[12px]" />
                  {info.rating} Rating
                </span>
              )}
              {info.year && <span className="text-[#ffffffcc]">{info.year}</span>}
              <span className="border border-white/40 text-[#ffffffcc] text-[11px] font-medium px-1.5 py-0.5 rounded uppercase">
                {isTV ? "TV" : info.status === "Released" ? "HD" : info.status || "Movie"}
              </span>
              {info.runtime && (
                <span className="text-[#ffffffcc] flex items-center gap-x-1">
                  <FontAwesomeIcon icon={faClock} className="text-[12px] text-[#ffffff99]" />
                  {Math.floor(info.runtime / 60)}h {info.runtime % 60}m
                </span>
              )}
              {isTV && info.numberOfSeasons && (
                <span className="text-[#ffffffcc]">
                  {info.numberOfSeasons} Season{info.numberOfSeasons > 1 ? "s" : ""}
                </span>
              )}
              {info.voteCount > 0 && (
                <span className="text-[#ffffff99] flex items-center gap-x-1">
                  <FontAwesomeIcon icon={faUsers} className="text-[11px]" />
                  {info.voteCount >= 1000 ? `${(info.voteCount / 1000).toFixed(1)}k` : info.voteCount} votes
                </span>
              )}
            </div>

            {/* Synopsis */}
            <p className="text-[#ffffffdd] text-[15px] leading-relaxed mb-6 line-clamp-3 max-w-[560px] max-[575px]:text-sm">
              {info.overview}
            </p>

            {/* Buttons (Watch Now only — no My List) */}
            <div className="flex items-center gap-x-3 mb-7 flex-wrap gap-y-3">
              <button
                onClick={() => navigate(watchPath)}
                className="group flex items-center gap-x-2.5 bg-white hover:bg-white/90 text-black font-semibold py-3 px-8 rounded-md shadow-lg hover:scale-[1.03] active:scale-95 transition-all duration-300 max-[575px]:px-6"
              >
                <FontAwesomeIcon icon={faPlay} className="transition-transform group-hover:scale-110" /> Watch Now
              </button>
              <WatchLaterButton
                mediaId={`${isTV ? "tv" : "movie"}:${id}`}
                watchId={`/movies/${type}/${id}`}
                title={info.title}
                poster={info.poster || info.backdrop}
                variant="solid"
              />

              {info.rating && (
                <span
                  className="flex items-center gap-x-2 bg-white/15 backdrop-blur-md border border-white/15 text-white font-medium py-3 px-5 rounded-md"
                  title="Audience status"
                >
                  <FontAwesomeIcon
                    icon={Number(info.rating) >= 7 ? faFire : faChartLine}
                    className={Number(info.rating) >= 7 ? "text-[#f97316]" : "text-[#38bdf8]"}
                  />
                  {Number(info.rating) >= 8 ? "Must Watch" : Number(info.rating) >= 7 ? "Trending" : Number(info.rating) >= 6 ? "Popular" : "New"}
                </span>
              )}
            </div>

            {/* Netflix-style info lines */}
            <div className="space-y-1.5 text-[13px] max-[575px]:text-[12px]">
              {info.cast?.length > 0 && (
                <p className="text-[#ffffff80]">
                  <span className="text-[#ffffff80]">Starring: </span>
                  <span className="text-[#ffffffe0]">
                    {info.cast.slice(0, 3).map((c) => c.name).join(", ")}
                  </span>
                </p>
              )}
              {info.genres?.length > 0 && (
                <p className="text-[#ffffff80]">
                  <span className="text-[#ffffff80]">Genres: </span>
                  <span className="text-[#ffffffe0]">
                    {info.genres.map((g) => g.name).join(", ")}
                  </span>
                </p>
              )}
              {info.status && (
                <p className="text-[#ffffff80]">
                  <span className="text-[#ffffff80]">This {isTV ? "show" : "movie"} is: </span>
                  <span className="text-[#ffffffe0]">{info.status}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8 max-[575px]:px-4 flex flex-col gap-y-12">
        {/* TV: Seasons + Episodes */}
        {isTV && info.seasons?.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h2 className="font-semibold text-2xl">Episodes</h2>
              <select
                value={activeSeason}
                onChange={(e) => setActiveSeason(Number(e.target.value))}
                className="bg-[#15151d] border border-[#ffffff1a] rounded-md py-2 px-3 text-sm outline-none"
              >
                {info.seasons.map((s) => (
                  <option key={s.season_number} value={s.season_number}>
                    Season {s.season_number}
                  </option>
                ))}
              </select>
            </div>

            {epLoading ? (
              <div className="flex justify-center py-10">
                <FontAwesomeIcon icon={faSpinner} className="text-2xl text-[#a855f7] animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 max-[1024px]:grid-cols-1 gap-4">
                {episodes.map((ep) => (
                  <Link
                    key={ep.id}
                    to={`/movies/watch/tv/${id}?s=${activeSeason}&e=${ep.episodeNumber}`}
                    className="flex gap-x-4 p-3 rounded-lg bg-[#ffffff08] hover:bg-[#ffffff12] transition-colors group"
                  >
                    <div className="relative w-[160px] flex-shrink-0 aspect-video rounded-md overflow-hidden bg-[#222]">
                      {ep.still && (
                        <img src={ep.still} alt={ep.name} className="w-full h-full object-cover" loading="lazy" />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <FontAwesomeIcon icon={faPlay} className="text-2xl text-white" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {ep.episodeNumber}. {ep.name || `Episode ${ep.episodeNumber}`}
                      </p>
                      <p className="text-[12px] text-[#ffffff80] mt-1">
                        {ep.airDate || ""}{ep.rating ? ` · ★ ${ep.rating}` : ""}
                      </p>
                      <p className="text-[12px] text-[#ffffff66] mt-1 line-clamp-2">{ep.overview}</p>
                    </div>
                  </Link>
                ))}
                {!episodes.length && (
                  <p className="text-[#ffffff80]">No episodes found for this season.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cast */}
        {info.cast?.length > 0 && (
          <div>
            <h2 className="font-semibold text-2xl mb-5">Cast</h2>
            <div className="flex gap-x-3 overflow-x-auto pb-3 select-none">
              {info.cast.map((c) => (
                <div key={c.id} className="w-[72px] flex-shrink-0 text-center group">
                  <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-[#222] mx-auto mb-1.5 ring-2 ring-transparent group-hover:ring-[#a855f7]/60 transition-all duration-300">
                    {c.profile ? (
                      <img
                        src={c.profile}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#ffffff40] text-[10px]">N/A</div>
                    )}
                  </div>
                  <p className="text-[11px] font-medium line-clamp-1">{c.name}</p>
                  <p className="text-[10px] text-[#ffffff80] line-clamp-1">{c.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {info.recommendations?.length > 0 && (
          <MovieRow label="More like this" data={info.recommendations} limit={12} />
        )}
      </div>
    </div>
  );
}
