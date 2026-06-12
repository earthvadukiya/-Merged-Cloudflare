/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faCircleInfo, faStar } from "@fortawesome/free-solid-svg-icons";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

export default function MovieSpotlight({ items = [] }) {
  const slides = items.slice(0, 10).filter((s) => s.backdrop || s.poster);
  if (!slides.length) return null;

  return (
    <div className="relative w-full">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        className="w-full h-[clamp(300px,52vw,620px)] max-[575px]:h-[68vw]"
      >
        {slides.map((s, i) => (
          <SwiperSlide key={`${s.type}-${s.id}`}>
            <div className="relative w-full h-full">
              <img
                src={s.backdrop || s.poster}
                alt={s.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />

              <div className="absolute inset-0 flex items-center">
                <div className="max-w-[1600px] mx-auto w-full px-8 max-[575px]:px-4">
                  <div className="max-w-[560px]">
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
    </div>
  );
}
