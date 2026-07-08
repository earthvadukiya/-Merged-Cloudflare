import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faClockRotateLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
import { createAnimeSlug } from "@/src/utils/slug.utils";
import { HOME_API } from "@/src/config/api";

const API_URL = HOME_API;

const ContinueWatching = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const stored = JSON.parse(localStorage.getItem("continueWatching")) || [];

        // De-duplicate by anime id (keep the newest entry per title) so we only
        // ever show the latest episode of each anime, then cap at 10.
        const seen = new Set();
        const sorted = stored
          .slice()
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
          .filter((item) => {
            const key = String(item.id);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .slice(0, 10);

        const enriched = await Promise.all(
          sorted.map(async (item) => {
            const progress = item.duration
              ? Math.min(100, Math.max(0, (item.currentTime / item.duration) * 100))
              : Number(item.progress) || 0;

            // Try to upgrade the thumbnail to the wide TMDB episode still
            // (matches the spotlight/banner TMDB look). Fall back to poster.
            let episodeImage = item.episodeImage || "";
            if (!episodeImage) {
              try {
                const res = await fetch(`${API_URL}/tmdb/${item.id}`);
                const json = await res.json();
                const eps = json?.data?.episodes || [];
                const found = eps.find(
                  (ep) => Number(ep.episodeNumber) === Number(item.episode)
                );
                episodeImage = found?.image || "";
              } catch {
                /* keep poster fallback */
              }
            }

            return {
              ...item,
              progress,
              episodeImage,
              slug:
                item.slug ||
                item.animeSlug ||
                (item.title ? createAnimeSlug(item.title, item.id) : item.id),
            };
          })
        );

        if (alive) setData(enriched);
      } catch (err) {
        console.error("ContinueWatching load failed:", err);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const removeItem = (e, target) => {
    e.preventDefault();
    e.stopPropagation();
    setData((prev) => {
      const next = prev.filter((x) => String(x.id) !== String(target.id));
      try {
        localStorage.setItem("continueWatching", JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  if (loading) {
    return (
      <section className="mt-10">
        <SectionHeader />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video rounded-2xl bg-white/[0.06] overflow-hidden relative"
            >
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!data.length) return null;

  return (
    <section className="mt-10">
      <SectionHeader />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {data.map((item, index) => (
          <Link
            key={`${item.id}-${item.episode}-${index}`}
            to={`/watch/${item.slug}?ep=${item.episode}`}
            className="group relative block animate-fadeInUp"
            style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
          >
            {/* THUMBNAIL */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0f0f12] border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:border-[#ffbade]/40 group-hover:shadow-[0_18px_50px_rgba(255,186,222,0.18)]">
              {item.episodeImage || item.poster ? (
                <img
                  src={item.episodeImage || item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.08]"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#26262e] via-[#16161a] to-black flex items-center justify-center">
                  <span className="text-gray-500 text-sm font-bold tracking-wide">
                    EP {item.episode}
                  </span>
                </div>
              )}

              {/* DARKEN GRADIENT */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/10 transition-opacity duration-500 group-hover:from-black/95" />
              {/* HOVER TINT */}
              <div className="absolute inset-0 bg-[#ffbade]/0 transition-colors duration-500 group-hover:bg-[#ffbade]/[0.06]" />

              {/* EPISODE BADGE */}
              <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-bold tracking-wide border border-white/10">
                EP {item.episode}
              </span>

              {/* REMOVE BUTTON */}
              <button
                type="button"
                aria-label="Remove from continue watching"
                onClick={(e) => removeItem(e, item)}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/55 backdrop-blur-md text-white/80 flex items-center justify-center border border-white/10 opacity-0 -translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-red-500 hover:text-white"
              >
                <FontAwesomeIcon icon={faXmark} className="text-[12px]" />
              </button>

              {/* CENTER PLAY */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center text-white scale-90 opacity-0 transition-all duration-400 ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:bg-white group-hover:text-black shadow-2xl">
                  <FontAwesomeIcon icon={faPlay} className="text-[14px] ml-0.5" />
                </span>
              </div>

              {/* PROGRESS BAR */}
              <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-white/15">
                <div
                  className="h-full bg-gradient-to-r from-[#ffbade] to-[#ff7eb6] rounded-r-full transition-[width] duration-700 ease-out"
                  style={{ width: `${item.progress > 0 ? item.progress : 6}%` }}
                />
              </div>
            </div>

            {/* TITLE + META */}
            <div className="mt-3 px-0.5">
              <h3 className="text-white text-[13.5px] font-semibold leading-snug line-clamp-1 transition-colors duration-300 group-hover:text-[#ffbade]">
                {item.title}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-gray-400 text-[12px]">Episode {item.episode}</span>
                {item.progress > 0 && (
                  <span className="text-[#ffbade]/80 text-[11px] font-medium">
                    • {Math.round(item.progress)}%
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

function SectionHeader() {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#ffbade]/15 text-[#ffbade]">
        <FontAwesomeIcon icon={faClockRotateLeft} className="text-[16px]" />
      </span>
      <h2 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">
        Continue Watching
      </h2>
    </div>
  );
}

export default ContinueWatching;
