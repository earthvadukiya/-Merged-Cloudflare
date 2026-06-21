import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import website_name from "@/src/config/website";
import MovieCard from "../components/MovieCard";
import {
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlaying,
  getPopularTV,
  getTopRatedTV,
  getAiringTodayTV,
} from "../utils/tmdb";

const CATEGORY_MAP = {
  trending: { title: "Trending", fetch: (p) => getTrending("week", p) },
  "popular-movies": { title: "Popular Movies", fetch: getPopularMovies },
  "top-movies": { title: "Top Rated Movies", fetch: getTopRatedMovies },
  "now-playing": { title: "Now Playing", fetch: getNowPlaying },
  "popular-tv": { title: "Popular TV Shows", fetch: getPopularTV },
  "top-tv": { title: "Top Rated TV Shows", fetch: getTopRatedTV },
  "airing-tv": { title: "Airing Today", fetch: getAiringTodayTV },
};

export default function MovieCategory({ category }) {
  const params = useParams();
  const cat = category || params.cat;
  const config = CATEGORY_MAP[cat] || CATEGORY_MAP.trending;

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const seen = useRef(new Set());

  // reset when category changes
  useEffect(() => {
    seen.current = new Set();
    setItems([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  }, [cat]);

  const load = useCallback(
    async (pageToLoad) => {
      try {
        const fn = config.fetch;
        const res = await fn(pageToLoad);
        const list = Array.isArray(res) ? res : res?.results || res || [];
        const fresh = list.filter((it) => {
          const k = `${it.type}-${it.id}`;
          if (seen.current.has(k)) return false;
          seen.current.add(k);
          return true;
        });
        setItems((prev) => [...prev, ...fresh]);
        setHasMore(list.length > 0 && pageToLoad < 20);
      } catch {
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [config]
  );

  // initial / category change load
  useEffect(() => {
    load(1);
  }, [load]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    load(next);
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0a0f] text-white pt-[90px] max-[575px]:pt-[80px]">
      <Helmet>
        <title>{`${config.title} - Movies & TV - ${website_name}`}</title>
      </Helmet>

      <div className="max-w-[1600px] mx-auto px-6 py-5 max-[575px]:px-3">
        <h1 className="font-semibold text-3xl mb-6 max-[575px]:text-2xl capitalize tracking-wide">
          {config.title}
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FontAwesomeIcon icon={faSpinner} className="text-3xl text-[#a855f7] animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-6 max-[1400px]:grid-cols-5 max-[1024px]:grid-cols-4 max-[758px]:grid-cols-3 max-[478px]:grid-cols-3 gap-x-3 gap-y-8 max-[478px]:gap-x-2">
              {items.map((item, index) => (
                <MovieCard
                  key={`${item.type}-${item.id}-${index}`}
                  item={item}
                  priority={index < 6}
                />
              ))}
            </div>

            {!items.length && (
              <p className="text-[#ffffff80] py-10 text-center">No titles found.</p>
            )}

            {hasMore && items.length > 0 && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-x-2 py-2.5 px-6 rounded-md bg-[#a855f7] hover:bg-[#9333ea] text-white font-medium text-sm transition-all duration-300 disabled:opacity-60"
                >
                  {loadingMore && (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  )}
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
