/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faClockRotateLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
import { listProgress, removeProgress, watchHref, isMediaItem } from "@/src/lib/watchlist";
import { useAuth } from "@/src/context/AuthContext";

/**
 * MovieContinueWatching — the Movies/TV "Continue Watching" rail.
 *
 * This is the LIVE-ACTION counterpart to the anime <ContinueWatching/>. It reads
 * the SHARED watchlist store but shows ONLY media items (movie:* / tv:*), so the
 * anime and movies rails stay fully separate on their own home pages. The user
 * Dashboard reads the same store and merges both — that's the only place they
 * appear together, exactly as requested.
 *
 * Cards mirror the premium anime design (16:9 backdrop, hover lift, play overlay,
 * remove button, progress bar) but in the movies-section purple accent.
 */
export default function MovieContinueWatching() {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await listProgress(userId);
        const media = (all || [])
          .filter(isMediaItem)
          .slice(0, 10)
          .map((it) => {
            const total = Number(it.total) || 0;
            const ep = Number(it.episode) || 0;
            // TV progress is a rough episode ratio; movies show a teaser sliver.
            const progress =
              total > 0 ? Math.min(100, Math.max(6, (ep / total) * 100)) : 18;
            return { ...it, progress };
          });
        if (alive) setItems(media);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const remove = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const idKey = String(item.animeId ?? item.anime_id);
    setItems((prev) => prev.filter((x) => String(x.animeId ?? x.anime_id) !== idKey));
    await removeProgress(idKey, userId);
  };

  if (loading) {
    return (
      <section>
        <Header />
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

  if (!items.length) return null;

  return (
    <section>
      <Header />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item, index) => {
          const id = String(item.animeId ?? item.anime_id ?? "");
          const isTV = id.startsWith("tv:");
          const wide = item.backdrop || item.poster;
          return (
            <Link
              key={`${id}-${index}`}
              to={watchHref(item)}
              className="group relative block animate-fadeInUp"
              style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0f0f16] border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:border-[#a855f7]/45 group-hover:shadow-[0_18px_50px_rgba(168,85,247,0.22)]">
                {wide ? (
                  <img
                    src={wide}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.08]"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2a2030] via-[#16121a] to-black" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/10 transition-opacity duration-500 group-hover:from-black/95" />
                <div className="absolute inset-0 bg-[#a855f7]/0 transition-colors duration-500 group-hover:bg-[#a855f7]/[0.07]" />

                {/* TYPE BADGE */}
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-bold tracking-wide border border-white/10">
                  {isTV ? `S${item.season || 1} · E${item.episode || 1}` : "MOVIE"}
                </span>

                {/* REMOVE */}
                <button
                  type="button"
                  aria-label="Remove from continue watching"
                  onClick={(e) => remove(e, item)}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/55 backdrop-blur-md text-white/80 flex items-center justify-center border border-white/10 opacity-0 -translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-red-500 hover:text-white"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-[12px]" />
                </button>

                {/* CENTER PLAY */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center text-white scale-90 opacity-0 transition-all duration-[400ms] ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:bg-[#a855f7] group-hover:border-[#a855f7] shadow-2xl">
                    <FontAwesomeIcon icon={faPlay} className="text-[14px] ml-0.5" />
                  </span>
                </div>

                {/* PROGRESS */}
                <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-white/15">
                  <div
                    className="h-full bg-gradient-to-r from-[#a855f7] to-[#d8b4fe] rounded-r-full transition-[width] duration-700 ease-out"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 px-0.5">
                <h3 className="text-white text-[13.5px] font-semibold leading-snug line-clamp-1 transition-colors duration-300 group-hover:text-[#c084fc]">
                  {item.title}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-gray-400 text-[12px]">
                    {isTV ? `Season ${item.season || 1}, Ep ${item.episode || 1}` : "Movie"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#a855f7]/15 text-[#c084fc]">
        <FontAwesomeIcon icon={faClockRotateLeft} className="text-[16px]" />
      </span>
      <h2 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">
        Continue Watching
      </h2>
    </div>
  );
}
