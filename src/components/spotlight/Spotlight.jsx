import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import "./Spotlight.css";
import Banner from "../banner/Banner";

const API_URL = import.meta.env.VITE_API_URL;

const Spotlight = ({ spotlights = [] }) => {
  const [tmdbLogos, setTmdbLogos] = useState({});

  useEffect(() => {
    if (!spotlights.length) return;

    let alive = true;

    async function loadLogos() {
      const logos = {};

      await Promise.all(
        spotlights.slice(0, 12).map(async (anime) => {
          try {
            const res = await fetch(`${API_URL}/tmdb/${anime.id}`);
            const json = await res.json();

            if (json?.data?.logo) {
              logos[anime.id] = json.data.logo;
            }
          } catch {
            // ignore logo errors
          }
        })
      );

      if (alive) setTmdbLogos(logos);
    }

    loadLogos();

    return () => {
      alive = false;
    };
  }, [spotlights]);

  return (
    <section className="relative w-screen h-[660px] max-[1400px]:h-[610px] max-[1024px]:h-[540px] max-md:h-[460px] -mt-16 left-1/2 -translate-x-1/2 overflow-hidden">
      {spotlights.length > 0 ? (
        <Swiper
          spaceBetween={0}
          slidesPerView={1}
          loop
          allowTouchMove
          grabCursor
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={1200}
          navigation={{
            nextEl: ".spotlight-next",
            prevEl: ".spotlight-prev",
          }}
          pagination={{ clickable: true }}
          autoplay={{
            delay: 6500,
            disableOnInteraction: false,
          }}
          modules={[Navigation, Autoplay, Pagination, EffectFade]}
          className="spotlight-swiper h-full w-full overflow-hidden relative"
        >
          <div className="absolute right-[38px] top-[145px] flex items-center gap-3 z-[30] max-md:hidden">
            <button className="spotlight-prev">‹</button>
            <button className="spotlight-next">›</button>
          </div>

          {spotlights.map((item, index) => (
            <SwiperSlide className="relative h-full" key={item.id || index}>
              <Banner
                item={item}
                index={index}
                tmdbLogo={tmdbLogos[item.id]}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="h-full flex items-center justify-center text-white">
          No spotlights to show.
        </div>
      )}
    </section>
  );
};

export default Spotlight;
