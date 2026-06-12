import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import website_name from "@/src/config/website";
import MovieSpotlight from "../components/MovieSpotlight";
import MovieRow from "../components/MovieRow";
import {
  getTrending,
  attachLogos,
  getPopularMovies,
  getNowPlaying,
  getPopularTV,
  getTopRatedMovies,
  getTopRatedTV,
} from "../utils/tmdb";

const EMPTY = {
  spotlight: [],
  trending: [],
  popularMovies: [],
  nowPlaying: [],
  popularTV: [],
  topMovies: [],
  topTV: [],
};

/**
 * MoviesHome — PROGRESSIVE loading.
 *
 * The old version waited for ~15 TMDB requests (incl. 8 spotlight-logo calls)
 * to ALL settle before showing anything — instant on PC but 35-40s on mobile
 * where latency + connection limits stack up. Now:
 *   1. The page shell renders immediately.
 *   2. Trending loads first → spotlight + first row appear fast.
 *   3. Every other row loads independently and pops in when ready.
 *   4. Spotlight logos are fetched in the BACKGROUND (non-blocking) so they
 *      never delay first paint.
 */
export default function MoviesHome() {
  const [data, setData] = useState(EMPTY);
  const [reloadKey, setReloadKey] = useState(0);
  // Track whether the very first (trending) request finished, so we can show a
  // small spinner only until the hero is ready instead of a full blank screen.
  const [heroReady, setHeroReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(EMPTY);
    setHeroReady(false);
    setFailed(false);

    const set = (key, value) =>
      alive && setData((d) => ({ ...d, [key]: value || [] }));

    // 1) Trending first — drives the hero + the first row. Fastest path to paint.
    getTrending("week")
      .then((trending) => {
        if (!alive) return;
        set("trending", trending);
        set("spotlight", trending.slice(0, 8)); // show hero immediately (no logos yet)
        setHeroReady(true);
        // 2) Fetch the 8 spotlight logos in the BACKGROUND and merge them in.
        attachLogos(trending.slice(0, 8)).then((withLogos) => set("spotlight", withLogos));
      })
      .catch(() => {
        if (alive) setHeroReady(true); // don't block the page on a hero failure
      });

    // 3) Every other row loads on its own — each appears the moment it arrives.
    getPopularMovies().then((r) => set("popularMovies", r)).catch(() => {});
    getNowPlaying().then((r) => set("nowPlaying", r)).catch(() => {});
    getPopularTV().then((r) => set("popularTV", r)).catch(() => {});
    getTopRatedMovies().then((r) => set("topMovies", r)).catch(() => {});
    getTopRatedTV().then((r) => set("topTV", r)).catch(() => {});

    // Safety: if nothing at all loads within 14s, show the retry screen.
    const t = setTimeout(() => {
      if (!alive) return;
      setData((d) => {
        const any = Object.values(d).some((arr) => arr.length > 0);
        if (!any) setFailed(true);
        return d;
      });
    }, 14000);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [reloadKey]);

  if (failed) {
    return (
      <div className="w-full min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-center px-6">
        <p className="text-white text-lg font-semibold mb-2">Couldn&apos;t load Movies &amp; TV</p>
        <p className="text-[#ffffff99] text-sm mb-6 max-w-sm">
          The movie database didn&apos;t respond. Check your connection and try again.
        </p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0a0a0f] text-white">
      <Helmet>
        <title>{`Movies & TV - ${website_name}`}</title>
      </Helmet>

      {data.spotlight.length > 0 ? (
        <MovieSpotlight items={data.spotlight} />
      ) : (
        // Lightweight hero placeholder so the page never looks broken/blank.
        <div className="w-full h-[clamp(300px,52vw,620px)] max-[575px]:h-[68vw] bg-gradient-to-b from-[#15151d] to-[#0a0a0f] flex items-center justify-center">
          {!heroReady && (
            <FontAwesomeIcon icon={faSpinner} className="text-3xl text-[#a855f7] animate-spin" />
          )}
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-6 py-8 max-[575px]:px-3 flex flex-col gap-y-12">
        <MovieRow label="Trending Now" data={data.trending} viewAllPath="/movies/trending" />
        <MovieRow label="Popular Movies" data={data.popularMovies} viewAllPath="/movies/category/popular-movies" />
        <MovieRow label="Now Playing" data={data.nowPlaying} viewAllPath="/movies/category/now-playing" />
        <MovieRow label="Popular TV Shows" data={data.popularTV} viewAllPath="/movies/category/popular-tv" />
        <MovieRow label="Top Rated Movies" data={data.topMovies} viewAllPath="/movies/category/top-movies" />
        <MovieRow label="Top Rated TV Shows" data={data.topTV} viewAllPath="/movies/category/top-tv" />
      </div>
    </div>
  );
}
