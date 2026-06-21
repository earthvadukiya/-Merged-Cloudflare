import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import website_name from "@/src/config/website";
import MovieSpotlight from "../components/MovieSpotlight";
import MovieRow from "../components/MovieRow";
import {
  getTrending,
  getSpotlight,
  getSpotlightLogo,
  getPopularMovies,
  getNowPlaying,
  getPopularTV,
  getTopRatedMovies,
  getTopRatedTV,
} from "../utils/tmdb";

// One lightweight skeleton placeholder for a row that hasn't loaded yet, so the
// page has stable layout (no jump) while data streams in progressively.
function RowSkeleton({ label }) {
  return (
    <div className="w-full">
      <div className="h-7 w-44 bg-white/5 rounded mb-4 max-[575px]:h-6 max-[575px]:w-32" />
      <div className="flex gap-x-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={`${label}-${i}`}
            className="shrink-0 w-[150px] max-[575px]:w-[110px] aspect-[2/3] bg-white/5 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export default function MoviesHome() {
  const [reloadKey, setReloadKey] = useState(0);

  // Each section is tracked independently with its own loading flag so the page
  // renders progressively: the spotlight + each row appears the instant ITS data
  // lands, instead of the old behaviour where the whole page waited for the
  // single slowest TMDB call (the cause of the 35-50s mobile load).
  const [spotlight, setSpotlight] = useState([]);
  const [rows, setRows] = useState({
    trending: { data: [], done: false },
    popularMovies: { data: [], done: false },
    nowPlaying: { data: [], done: false },
    popularTV: { data: [], done: false },
    topMovies: { data: [], done: false },
    topTV: { data: [], done: false },
  });
  const [failed, setFailed] = useState(false);

  // Mirror spotlight into a ref so the final "did anything load?" check can read
  // it synchronously without extra re-renders.
  const spotlightRef = useRef([]);
  spotlightRef.current = spotlight;

  useEffect(() => {
    let alive = true;
    setFailed(false);
    setSpotlight([]);
    setRows({
      trending: { data: [], done: false },
      popularMovies: { data: [], done: false },
      nowPlaying: { data: [], done: false },
      popularTV: { data: [], done: false },
      topMovies: { data: [], done: false },
      topTV: { data: [], done: false },
    });

    const setRow = (key, data) =>
      alive && setRows((prev) => ({ ...prev, [key]: { data: data || [], done: true } }));

    // Fire every section independently. None of them block another, so whichever
    // returns first paints first. Spotlight + Trending are above the fold.
    const tasks = [
      // Spotlight: render base items immediately, then stream in logos one-by-one.
      (async () => {
        try {
          const base = await getSpotlight(8);
          if (!alive) return;
          setSpotlight(base);
          base.forEach(async (item, i) => {
            const logo = await getSpotlightLogo(item);
            if (!alive || !logo) return;
            setSpotlight((prev) => {
              const next = [...prev];
              if (next[i]) next[i] = { ...next[i], logo };
              return next;
            });
          });
        } catch {
          /* spotlight just stays empty; rows can still render */
        }
      })(),
      getTrending("week").then((d) => setRow("trending", d)).catch(() => setRow("trending", [])),
      getPopularMovies().then((d) => setRow("popularMovies", d)).catch(() => setRow("popularMovies", [])),
      getNowPlaying().then((d) => setRow("nowPlaying", d)).catch(() => setRow("nowPlaying", [])),
      getPopularTV().then((d) => setRow("popularTV", d)).catch(() => setRow("popularTV", [])),
      getTopRatedMovies().then((d) => setRow("topMovies", d)).catch(() => setRow("topMovies", [])),
      getTopRatedTV().then((d) => setRow("topTV", d)).catch(() => setRow("topTV", [])),
    ];

    // Only show the hard-error screen if literally nothing loaded.
    Promise.allSettled(tasks).then(() => {
      if (!alive) return;
      setRows((prev) => {
        const anyData =
          spotlightRef.current.length > 0 ||
          Object.values(prev).some((r) => r.data.length > 0);
        setFailed(!anyData);
        return prev;
      });
    });

    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const rowConfig = [
    { key: "trending", label: "Trending Now", path: "/movies/trending" },
    { key: "popularMovies", label: "Popular Movies", path: "/movies/category/popular-movies" },
    { key: "nowPlaying", label: "Now Playing", path: "/movies/category/now-playing" },
    { key: "popularTV", label: "Popular TV Shows", path: "/movies/category/popular-tv" },
    { key: "topMovies", label: "Top Rated Movies", path: "/movies/category/top-movies" },
    { key: "topTV", label: "Top Rated TV Shows", path: "/movies/category/top-tv" },
  ];

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

      {/* Spotlight: shows a sized placeholder until base data lands, then paints. */}
      {spotlight.length > 0 ? (
        <MovieSpotlight items={spotlight} />
      ) : (
        <div className="w-full h-[clamp(340px,56vw,640px)] max-[575px]:h-[72vw] bg-gradient-to-b from-white/[0.04] to-transparent animate-pulse" />
      )}

      <div className="max-w-[1600px] mx-auto px-6 py-8 max-[575px]:px-3 flex flex-col gap-y-12">
        {rowConfig.map(({ key, label, path }) =>
          rows[key].done ? (
            rows[key].data.length > 0 && (
              <MovieRow key={key} label={label} data={rows[key].data} viewAllPath={path} />
            )
          ) : (
            <RowSkeleton key={key} label={label} />
          )
        )}
      </div>
    </div>
  );
}
