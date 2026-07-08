import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import "./Spotlight.css";
import Banner from "../banner/Banner";
import getTmdbBanner from "../../utils/getTmdbBanner.utils";

// Resolve a TMDB banner + logo for one spotlight item (cached internally).
async function fetchBannerData(anime, signal) {
  try {
    return await getTmdbBanner(anime.id, signal);
  } catch {
    return { banner: "", logo: "", tmdbId: null };
  }
}

const Spotlight = ({ spotlights = [] }) => {
  const [tmdbLogos, setTmdbLogos] = useState({});
  const [tmdbBanners, setTmdbBanners] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);

  // Preload ONLY the first hero image as the LCP element — the browser starts
  // fetching it before React even mounts the swiper. Massive LCP win on mobile.
  useEffect(() => {
    const first = spotlights?.[0];
    const img =
      first?.banner || first?.bannerImage || first?.cover || first?.image || first?.poster;
    if (!img) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = img;
    link.fetchPriority = "high";
    document.head.appendChild(link);
    return () => {
      try { document.head.removeChild(link); } catch { /* noop */ }
    };
  }, [spotlights]);

  // Fetch TMDB banners + logos PROGRESSIVELY instead of waiting for all 12 at
  // once. First 2 fetched immediately (visible + next), rest fired right after,
  // each committed the moment it lands so banners upgrade one by one.
  useEffect(() => {
    if (!spotlights.length) return;
    const controller = new AbortController();
    let alive = true;

    const firstId = spotlights[0]?.id;
    const preload = (href, priority = "high") => {
      if (!href) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      link.fetchPriority = priority;
      document.head.appendChild(link);
    };

    const commit = (id, { banner, logo } = {}) => {
      if (!alive) return;
      if (banner) {
        if (id === firstId) preload(banner, "high");
        setTmdbBanners((prev) =>
          prev[id] === banner ? prev : { ...prev, [id]: banner }
        );
      }
      if (logo) {
        if (id === firstId) preload(logo, "high");
        setTmdbLogos((prev) => (prev[id] === logo ? prev : { ...prev, [id]: logo }));
      }
    };

    const run = async () => {
      const list = spotlights.slice(0, 12);
      await Promise.all(
        list
          .slice(0, 2)
          .map(async (a) => commit(a.id, await fetchBannerData(a, controller.signal)))
      );
      list.slice(2).forEach(async (a) => {
        const data = await fetchBannerData(a, controller.signal);
        commit(a.id, data);
      });
    };

    run();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [spotlights]);

  // Rapid-tap guard: Swiper's fade effect can deadlock if you fire slideNext /
  // slidePrev while a transition is still running (the new "click" is dropped and
  // the swiper stays mid-transition). We drive navigation manually and ignore
  // taps that arrive during an in-flight transition, then resume autoplay.
  const navigatingRef = useRef(false);

  const go = (dir) => {
    const sw = swiperRef.current;
    if (!sw || navigatingRef.current) return;
    navigatingRef.current = true;
    if (dir === "next") sw.slideNext();
    else sw.slidePrev();
    // Restart autoplay timer after a manual interaction.
    sw.autoplay?.start();
  };

  return (
    <section className="relative w-screen h-[660px] max-[1400px]:h-[610px] max-[1024px]:h-[540px] max-md:h-[460px] -mt-16 left-1/2 -translate-x-1/2 overflow-hidden">
      {spotlights.length > 0 ? (
        <Swiper
          onSwiper={(sw) => (swiperRef.current = sw)}
          spaceBetween={0}
          slidesPerView={1}
          loop
          allowTouchMove
          grabCursor
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={800}
          pagination={{ clickable: true }}
          autoplay={{
            delay: 6500,
            disableOnInteraction: false,
          }}
          onSlideChange={(s) => setActiveIndex(s.realIndex)}
          // Released as soon as the transition finishes so the very next tap works.
          onTransitionEnd={() => {
            navigatingRef.current = false;
          }}
          modules={[Navigation, Autoplay, Pagination, EffectFade]}
          className="spotlight-swiper h-full w-full overflow-hidden relative"
        >
          <div className="absolute right-[38px] top-[145px] flex items-center gap-3 z-[30] max-md:hidden">
            <button
              type="button"
              aria-label="Previous spotlight"
              className="spotlight-prev"
              onClick={() => go("prev")}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next spotlight"
              className="spotlight-next"
              onClick={() => go("next")}
            >
              ›
            </button>
          </div>

          {spotlights.map((item, index) => (
            <SwiperSlide className="relative h-full" key={item.id || index}>
              <Banner
                item={item}
                index={index}
                tmdbLogo={tmdbLogos[item.id]}
                tmdbBanner={tmdbBanners[item.id]}
                active={index === activeIndex}
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
