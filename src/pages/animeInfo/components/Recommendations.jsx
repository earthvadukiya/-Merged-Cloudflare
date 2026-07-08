import { Link } from "react-router-dom";
import SmartImage from "@/src/components/ui/SmartImage";
import { createAnimeSlug } from "@/src/utils/slug.utils";

export default function Recommendations({ data = [] }) {
  if (!data.length) return null;

  return (
    <div className="mt-10 mb-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">Recommended for You</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-5">
        {data.map((anime) => (
          <Link
            key={anime.id}
            to={`/${createAnimeSlug(anime.title, anime.id)}`}
            className="group min-w-0"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 transition-all duration-500 ease-out group-hover:border-[#ffbade]/30 group-hover:shadow-[0_14px_40px_rgba(255,186,222,0.15)] group-hover:-translate-y-1">
              <SmartImage
                src={anime.poster || anime.image}
                alt={anime.title}
                className="w-full h-[265px]"
                imgClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              <span className="absolute bottom-2 left-2 bg-black/70 text-xs px-2 py-1 rounded-md">
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
