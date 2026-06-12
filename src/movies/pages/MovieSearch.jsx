import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import website_name from "@/src/config/website";
import MovieCard from "../components/MovieCard";
import { searchMulti } from "../utils/tmdb";

export default function MovieSearch() {
  const [params] = useSearchParams();
  const query = (params.get("q") || params.get("keyword") || "").trim();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const seen = useRef(new Set());

  const run = useCallback(async (q, pageToLoad) => {
    try {
      const res = await searchMulti(q, pageToLoad);
      const list = Array.isArray(res) ? res : res?.results || res || [];
      const fresh = list.filter((it) => {
        const k = `${it.type}-${it.id}`;
        if (seen.current.has(k)) return false;
        seen.current.add(k);
        return true;
      });
      setItems((prev) => (pageToLoad === 1 ? fresh : [...prev, ...fresh]));
      setHasMore(list.length > 0 && pageToLoad < 15);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    seen.current = new Set();
    setItems([]);
    setPage(1);
    setHasMore(false);
    if (!query) {
      setLoading(false);
      return;
    }
    setLoading(true);
    run(query, 1);
  }, [query, run]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    run(query, next);
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0a0f] text-white pt-[90px] max-[575px]:pt-[80px]">
      <Helmet>
        <title>{`${query ? `"${query}" — ` : ""}Search Movies & TV - ${website_name}`}</title>
      </Helmet>

      <div className="max-w-[1600px] mx-auto px-6 py-5 max-[575px]:px-3">
        <h1 className="font-semibold text-2xl mb-6 max-[575px]:text-xl tracking-wide flex items-center gap-x-3">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[#a855f7]" />
          {query ? (
            <>
              Search results for <span className="text-[#a855f7]">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "Search Movies & TV"
          )}
        </h1>

        {!query ? (
          <p className="text-[#ffffff80] py-10">Type something in the search bar to find movies and TV shows.</p>
        ) : loading ? (
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
              <p className="text-[#ffffff80] py-10 text-center">
                No movies or TV shows found for &ldquo;{query}&rdquo;.
              </p>
            )}

            {hasMore && items.length > 0 && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-x-2 py-2.5 px-6 rounded-md bg-[#a855f7] hover:bg-[#9333ea] text-white font-medium text-sm transition-all duration-300 disabled:opacity-60"
                >
                  {loadingMore && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
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
