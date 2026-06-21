import { Link } from "react-router-dom";
import { createAnimeSlug } from "@/src/utils/slug.utils";

export default function Seasons({ data = [] }) {
  if (!data.length) return null;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-5">Seasons & Movies</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-5">
        {data.map((anime) => (
          <Link
            key={anime.id}
            to={`/${createAnimeSlug(anime.title, anime.id)}`}
            className="group min-w-0"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10">
              <img
                src={anime.poster || anime.image}
                alt={anime.title}
                className="w-full h-[250px] object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {anime.relationType && (
                <span className="absolute top-2 left-2 bg-black/70 text-xs px-2 py-1 rounded">
                  {String(anime.relationType).replaceAll("_", " ")}
                </span>
              )}

              <span className="absolute bottom-2 left-2 bg-black/70 text-xs px-2 py-1 rounded">
                {anime.type || "TV"}
              </span>
            </div>

            <h3 className="mt-3 font-semibold line-clamp-2 min-h-[42px]">
              {anime.title}
            </h3>

            <p className="text-xs text-gray-400 mt-1">
              {anime.year || "Unknown"} • {anime.episodes || "?"} EPS
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
