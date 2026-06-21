/* eslint-disable react/prop-types */
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade, Navigation } from "swiper/modules";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faCircleInfo,
  faStar,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import "./MovieSpotlight.css";

export default function MovieSpotlight({ items = [] }) {
  const slides = items.slice(0, 10).filter((s) => s.backdrop || s.poster);
  const swiperRef = useRef(null);
  const navigatingRef = useRef(false);

  if (!slides.length) return null;

  // Rapid-tap guard — same pattern as the anime spotlight. Ignore taps that
  // arrive while a fade transition is still running so the arrows never freeze.
  const go = (dir) => {
    const sw = swiperRef.current;
    if (!sw || navigatingRef.current) return;
    navigatingRef.current = true;
    if (dir === "next") sw.slideNext();
    else sw.slidePrev();
    sw.autoplay?.start();
  };

  return (
    <div className="relative w-full movie-spotlight">
      <Swiper
        onSwiper={(sw) => (swiperRef.current = sw)}
        onTransitionEnd={() => {
          navigatingRef.current = false;
        }}
        modules={[Autoplay, Pagination, EffectFade, Navigation]}
        effect="fade"
        speed={800}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        className="w-full h-[clamp(340px,56vw,640px)] max-[575px]:h-[72vw]"
      >
        {slides.map((s, i) => (
          <SwiperSlide key={`${s.type}-${s.id}`}>
            <div className="relative w-full h-full">
              <img
                src={s.backdrop || s.poster}
                alt={s.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
                fetchpriority={i === 0 ? "high" : "low"}
                decoding="async"
              />
              {/* Full-bleed gradients so the artwork fills the whole width with no
                  empty side bars; content sits in a left-aligned column. */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />

              <div className="absolute inset-0 flex items-center">
                {/* Full width — only inner padding, no max-width wrapper, so the
                    hero spans edge to edge like the anime spotlight. */}
                <div className="w-full px-12 max-[768px]:px-6 max-[575px]:px-4">
                  <div className="max-w-[600px]">
                    <p className="text-[#a855f7] font-semibold text-sm uppercase tracking-[0.2em] mb-3">
                      #{i + 1} Spotlight
                    </p>
                    {s.logo ? (
                      <img
                        src={s.logo}
                        alt={s.title}
                        className="max-h-[clamp(70px,9vw,150px)] max-w-[min(90%,460px)] object-contain object-left mb-4 drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
                        loading={i === 0 ? "eager" : "lazy"}
                      />
                    ) : (
                      <h1 className="text-white font-bold text-[clamp(28px,4vw,52px)] leading-tight line-clamp-2 mb-4">
                        {s.title}
                      </h1>
                    )}
                    <div className="flex items-center gap-x-4 mb-4 text-[13px] text-[#ffffffcc] flex-wrap">
                      <span className="uppercase bg-[#a855f7] text-white font-bold px-2 py-0.5 rounded text-[11px]">
                        {s.type === "tv" ? "TV" : "Movie"}
                      </span>
                      {s.year && <span>{s.year}</span>}
                      {s.rating && (
                        <span className="flex items-center gap-x-1">
                          <FontAwesomeIcon icon={faStar} className="text-[#fbbf24]" />
                          {s.rating}
                        </span>
                      )}
                    </div>
                    <p className="text-[#ffffffb0] text-sm line-clamp-3 mb-6 max-[575px]:hidden">
                      {s.overview}
                    </p>
                    <div className="flex items-center gap-x-3 max-[575px]:gap-x-2">
                      <Link
                        to={`/movies/watch/${s.type}/${s.id}`}
                        className="flex items-center gap-x-2 bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold py-2.5 px-6 rounded-full transition-all duration-300 max-[575px]:px-4 max-[575px]:py-2 max-[575px]:text-sm active:scale-95"
                      >
                        <FontAwesomeIcon icon={faPlay} /> Watch Now
                      </Link>
                      <Link
                        to={`/movies/${s.type}/${s.id}`}
                        className="flex items-center gap-x-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-6 rounded-full backdrop-blur-sm transition-all duration-300 max-[575px]:px-4 max-[575px]:py-2 max-[575px]:text-sm active:scale-95"
                      >
                        <FontAwesomeIcon icon={faCircleInfo} /> Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* NAV BUTTONS — moved to the RIGHT side, vertically centred (just above the
          middle), so they never overlap the left-aligned title/description text. */}
      <div className="hidden md:flex flex-col gap-y-3 absolute right-8 top-[44%] -translate-y-1/2 z-30">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => go("prev")}
          className="movie-spotlight-nav"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => go("next")}
          className="movie-spotlight-nav"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
}
