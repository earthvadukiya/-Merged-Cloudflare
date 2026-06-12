/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import MovieCard from "./MovieCard";

/**
 * MovieRow — a single horizontal row of movie cards that slides left/right.
 *
 * - Smooth native scrolling.
 * - Mouse drag-to-scroll with text/image selection disabled while dragging
 *   (issues #7 / #8). A 5px drag threshold lets a quick click still open the
 *   card while a real drag pans the row instead of selecting text/images.
 * - Hover arrow buttons (desktop) for accessible navigation.
 */
export default function MovieRow({ label, data = [], viewAllPath, limit, className = "" }) {
  const items = limit ? data.slice(0, limit) : data;
  const trackRef = useRef(null);

  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const [dragging, setDragging] = useState(false);

  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

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
  }, [updateArrows, items.length]);

  const scrollByPage = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  };

  const onMouseDown = (e) => {
    const el = trackRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.pageX, startScroll: el.scrollLeft, moved: false };
    el.style.scrollBehavior = "auto";
  };

  const onMouseMove = (e) => {
    if (!drag.current.active) return;
    const el = trackRef.current;
    if (!el) return;
    const delta = e.pageX - drag.current.startX;
    if (Math.abs(delta) > 5 && !drag.current.moved) {
      drag.current.moved = true;
      setDragging(true);
    }
    if (drag.current.moved) {
      e.preventDefault();
      el.scrollLeft = drag.current.startScroll - delta;
    }
  };

  const endDrag = () => {
    const el = trackRef.current;
    if (el) el.style.scrollBehavior = "";
    drag.current.active = false;
    if (drag.current.moved) {
      setTimeout(() => setDragging(false), 0);
    } else {
      setDragging(false);
    }
  };

  // Prevent a drag from triggering a card navigation underneath.
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

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
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onClickCapture={onClickCapture}
          className={`movie-row-track flex gap-x-3 overflow-x-auto pb-2 max-[478px]:gap-x-2 ${
            dragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
          style={{
            // No scroll-snap: the row follows the mouse 1:1 while dragging so
            // it pans freely/smoothly instead of jumping one card at a time.
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
