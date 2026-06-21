import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import getSearch from "@/src/utils/getSearch.utils";
import { createAnimeSlug } from "@/src/utils/slug.utils";

export default function Search() {
  const params = useParams();
  const [searchParams] = useSearchParams();

  const keyword =
    params.keyword ||
    searchParams.get("keyword") ||
    searchParams.get("q") ||
    searchParams.get("query") ||
    "";

  const [anime, setAnime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const results = await getSearch(keyword, 1);
      setAnime(results);

      setLoading(false);
    }

    load();
  }, [keyword]);

  return (
    <div className="min-h-screen bg-[#080808] text-white px-6 pt-28 pb-20">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Search Results: {keyword}
        </h1>

        {loading && (
          <p className="text-gray-400">Loading...</p>
        )}

        {!loading && anime.length === 0 && (
          <p className="text-gray-400">No anime found.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-5">
          {anime.map((item) => {
            const id = item.id || item.anilistId;
            const title =
              item.title ||
              item.name ||
              item.animeTitle ||
              "Unknown";

            const poster =
              item.poster ||
              item.image ||
              item.coverImage ||
              item.cover ||
              "";

            return (
              <Link key={id} to={`/${createAnimeSlug(title, id)}`} className="group">
                <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10">
                  <img
                    src={poster}
                    alt={title}
                    className="w-full h-[260px] object-cover group-hover:scale-105 transition duration-300"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  <span className="absolute bottom-2 left-2 bg-black/70 text-xs px-2 py-1 rounded">
                    {item.type || "TV"}
                  </span>
                </div>

                <h3 className="mt-3 font-semibold line-clamp-1">
                  {title}
                </h3>

                <p className="text-xs text-gray-400 mt-1">
                  {item.year || "Unknown"} • {item.episodes || "?"} EPS
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
