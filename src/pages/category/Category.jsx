import { useEffect, useState } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import getCategoryInfo from "@/src/utils/getCategoryInfo.utils";
import { createAnimeSlug } from "@/src/utils/slug.utils";

const ITEMS_PER_PAGE = 24;

function formatGenreName(value = "") {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Category({ path, label }) {
  const { genre } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") || 1);

  const [anime, setAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

  const isGenrePage = path === "genre";

  const title = isGenrePage
    ? formatGenreName(genre || "")
    : label || path?.split("-").join(" ") || "Anime";

  useEffect(() => {
    let alive = true;

    async function loadCategory() {
      setLoading(true);

      try {
        const data = await getCategoryInfo(path, page, genre);

        if (!alive) return;

        const results = data?.results || data?.data || data?.animes || [];
        const pageInfo = data?.paginationInfo || {};

        setAnime(Array.isArray(results) ? results : []);

        setPagination({
          total: pageInfo.total || 0,
          currentPage: pageInfo.currentPage || page,
          lastPage:
            pageInfo.lastPage ||
            Math.max(page, pageInfo.hasNextPage ? page + 1 : page),
          hasNextPage:
            pageInfo.hasNextPage === true ||
            page < pageInfo.lastPage ||
            results.length >= ITEMS_PER_PAGE,
        });
      } catch (err) {
        console.error("Category load failed:", err);

        if (!alive) return;

        setAnime([]);
        setPagination(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadCategory();

    return () => {
      alive = false;
    };
  }, [path, page, genre]);

  function changePage(nextPage) {
    if (nextPage < 1) return;

    setSearchParams({ page: String(nextPage) });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const canGoNext =
    pagination?.hasNextPage === true || anime.length >= ITEMS_PER_PAGE;

  return (
    <div className="min-h-screen bg-[#080808] text-white px-6 pt-28 pb-20">
      <div className="max-w-[1500px] mx-auto">
        <h1 className="text-3xl font-bold capitalize mb-8">{title}</h1>

        {loading && <p className="text-gray-400">Loading...</p>}

        {!loading && anime.length === 0 && (
          <p className="text-gray-400">No results found for: {title}</p>
        )}

        {!loading && anime.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-5">
              {anime.map((item, index) => {
                const id = item.id || item.anilistId;

                const animeTitle =
                  item.title || item.name || item.animeTitle || "Unknown";

                const poster =
                  item.poster ||
                  item.image ||
                  item.cover ||
                  item.coverImage ||
                  "";

                return (
                  <Link
                    key={`${id}-${index}`}
                    to={`/${createAnimeSlug(animeTitle, id)}`}
                    className="group"
                  >
                    <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10">
                      {poster ? (
                        <img
                          src={poster}
                          alt={animeTitle}
                          loading="lazy"
                          className="w-full h-[280px] object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-[280px] bg-white/5 flex items-center justify-center text-gray-500">
                          No Image
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      <span className="absolute bottom-2 left-2 bg-black/70 text-xs px-2 py-1 rounded uppercase">
                        {item.type || "TV"}
                      </span>
                    </div>

                    <h3 className="mt-3 font-semibold line-clamp-1">
                      {animeTitle}
                    </h3>

                    <p className="text-xs text-gray-400 mt-1">
                      {item.year || "Unknown"} • {item.episodes || "?"} EPS
                    </p>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-3 mt-14">
              <button
                onClick={() => changePage(page - 1)}
                disabled={page <= 1}
                className={`px-5 py-3 rounded-full border font-bold transition ${
                  page <= 1
                    ? "opacity-40 cursor-not-allowed border-white/10"
                    : "border-white/20 hover:bg-white hover:text-black"
                }`}
              >
                ← Prev
              </button>

              <button className="w-12 h-12 rounded-full bg-white text-black font-black">
                {page}
              </button>

              <button
                onClick={() => changePage(page + 1)}
                disabled={!canGoNext}
                className={`px-5 py-3 rounded-full border font-bold transition ${
                  !canGoNext
                    ? "opacity-40 cursor-not-allowed border-white/10"
                    : "border-white/20 hover:bg-white hover:text-black"
                }`}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
