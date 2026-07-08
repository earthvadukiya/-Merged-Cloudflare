/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faStar } from "@fortawesome/free-solid-svg-icons";
import useMomentumScroll from "../hooks/useMomentumScroll";

/**
 * Netflix-style "Top 10 Today" rail for the live-action Movies/TV section.
 *
 * Each item shows a giant outlined rank number (1-10) sitting BEHIND the poster
 * card — the card overlaps the right edge of the number to create depth, exactly
 * like the reference. Purple accent matches the rest of the Movies section.
 *
 * Horizontally scrollable with drag + chevron buttons. Uses transform/opacity
 * only so the hover animations stay GPU-cheap and don't hurt scroll speed.
 */
export default function MovieTop10({ items = [] }) {
  const top10 = items.slice(0, 10);

  // Smooth, inertial drag + eased paging (shared with MovieRow).
  const { trackRef, dragging, handlers, scrollByPage } = useMomentumScroll();

  if (top10.length === 0) return null;

  return (
    <section className="w-full" id="movies-top-10">
      {/* Header — "TOP 10 / CONTENT TODAY" matching the reference */}
      <div className="flex items-center justify-between mb-5 max-[575px]:mb-3">
        <div className="flex items-center gap-x-4">
          <h2
            className="font-black leading-none tracking-tight text-transparent text-[44px] max-[575px]:text-[32px]"
            style={{ WebkitTextStroke: "2px rgba(255,255,255,0.55)" }}
          >
            TOP 10
          </h2>
          <div className="border-l-2 border-white/30 pl-4 leading-tight">
            <p className="text-white font-bold uppercase text-[15px] max-[575px]:text-[12px] tracking-wide">
              Content
            </p>
            <p className="text-white font-bold uppercase text-[15px] max-[575px]:text-[12px] tracking-wide">
              Today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-x-2 max-[575px]:hidden">
          <button
            onClick={() => scrollByPage(-1)}
            aria-label="Scroll left"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#a855f7] text-white flex items-center justify-center transition-colors duration-300"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
          </button>
          <button
            onClick={() => scrollByPage(1)}
            aria-label="Scroll right"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#a855f7] text-white flex items-center justify-center transition-colors duration-300"
          >
            <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
          </button>
        </div>
      </div>

      {/* Scroller */}
      <div
        ref={trackRef}
        {...handlers}
        className={`flex items-end gap-x-2 max-[575px]:gap-x-1 overflow-x-auto pb-2 select-none top10-scroller ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {top10.map((item, idx) => {
          const rank = idx + 1;
          const infoPath = `/movies/${item.type}/${item.id}`;
          return (
            <div
              key={`${item.type}-${item.id}`}
              className="group relative shrink-0 flex items-end"
            >
              {/* Giant outlined rank number sitting BEHIND the card */}
              <span
                className="font-black leading-none select-none pointer-events-none text-transparent text-[150px] max-[575px]:text-[96px] -mr-[42px] max-[575px]:-mr-[28px] translate-y-[6px] transition-all duration-500 group-hover:text-white/[0.06]"
                style={{ WebkitTextStroke: "2px rgba(255,255,255,0.30)" }}
                aria-hidden="true"
              >
                {rank}
              </span>

              {/* Poster card overlapping the number */}
              <Link
                to={infoPath}
                draggable={false}
                className="relative z-10 block w-[150px] max-[575px]:w-[110px] rounded-xl overflow-hidden bg-[#1a1a22] ring-1 ring-white/[0.06] shadow-lg transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:ring-[#a855f7]/50 group-hover:shadow-[0_18px_45px_rgba(168,85,247,0.28)]"
              >
                <div className="relative w-full pb-[150%]">
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt={item.title}
                      loading={idx < 4 ? "eager" : "lazy"}
                      decoding="async"
                      fetchpriority={idx < 4 ? "high" : "low"}
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.07]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#ffffff40] text-xs">
                      No image
                    </div>
                  )}

                  {/* darken + title reveal on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-x-0 bottom-0 p-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <p className="text-white text-[12px] font-semibold line-clamp-2 leading-snug">
                      {item.title}
                    </p>
                    {item.rating && (
                      <span className="mt-1 inline-flex items-center gap-x-1 text-[11px] text-[#fbbf24] font-semibold">
                        <FontAwesomeIcon icon={faStar} className="text-[9px]" />
                        {item.rating}
                      </span>
                    )}
                  </div>

                  {/* type badge */}
                  <span className="absolute top-2 right-2 bg-[#a855f7] text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white">
                    {item.type === "tv" ? "TV" : "Movie"}
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
