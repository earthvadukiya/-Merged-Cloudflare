/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import MovieCard from "./MovieCard";
import useMomentumScroll from "../hooks/useMomentumScroll";

/**
 * MovieRow — a single horizontal row of movie cards that slides left/right.
 *
 * - Smooth, inertial drag-to-scroll: the row keeps gliding after you let go
 *   (momentum) instead of stopping dead, and chevron paging is eased with a
 *   cubic curve. See `useMomentumScroll`.
 * - A 5px drag threshold lets a quick click still open the card while a real
 *   drag pans the row instead of selecting text/images.
 * - Hover arrow buttons (desktop) for accessible navigation.
 */
export default function MovieRow({ label, data = [], viewAllPath, limit, className = "" }) {
  const items = limit ? data.slice(0, limit) : data;

  const { trackRef, dragging, handlers, scrollByPage } = useMomentumScroll();

  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, [trackRef]);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, items.length, trackRef]);

  if (!items.length) return null;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-semibold text-2xl text-white max-[478px]:text-[18px] capitalize tracking-wide">
          {label}
        </h1>
        {viewAllPath && (
          <Link
            to={viewAllPath}
            className="flex items-center gap-x-1 py-1 px-2 -mr-2 rounded-md text-[13px] font-medium text-[#ffffff80] hover:text-white transition-all duration-300 group"
          >
            View all
            <FaChevronRight className="text-[10px] transform transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      <div className="relative group/row">
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label="Scroll left"
          className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-black/70 hover:bg-[#a855f7] border border-white/15 text-white shadow-lg transition-all duration-300 ${
            canLeft ? "opacity-0 group-hover/row:opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <FaChevronLeft />
        </button>

        <div
          ref={trackRef}
          {...handlers}
          className={`movie-row-track flex gap-x-3 overflow-x-auto pb-2 max-[478px]:gap-x-2 ${
            dragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
          style={{
            WebkitOverflowScrolling: "touch",
            userSelect: dragging ? "none" : "auto",
          }}
        >
          {items.map((item, index) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex-shrink-0 w-[clamp(130px,15vw,180px)] max-[478px]:w-[40vw]"
            >
              <MovieCard item={item} priority={index < 6} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label="Scroll right"
          className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-black/70 hover:bg-[#a855f7] border border-white/15 text-white shadow-lg transition-all duration-300 ${
            canRight ? "opacity-0 group-hover/row:opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}
