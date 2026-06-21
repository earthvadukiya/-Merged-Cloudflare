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
import { HOME_API } from "../../config/api";

const API_URL = HOME_API;

// Small in-memory cache so navigating away & back doesn't refetch logos.
const LOGO_CACHE = new Map();

async function fetchLogo(anime, signal) {
  if (LOGO_CACHE.has(anime.id)) return LOGO_CACHE.get(anime.id);
  // The site's /tmdb/:id endpoint resolves anilist-id -> tmdb logo. We read only
  // the logo field. Logos are tiny PNGs served from image.tmdb.org so they paint
  // fast once the URL is known.
  try {
    const res = await fetch(`${API_URL}/tmdb/${anime.id}`, { signal });
    const json = await res.json();
    const logo = json?.data?.logo || "";
    LOGO_CACHE.set(anime.id, logo);
    return logo;
  } catch {
    LOGO_CACHE.set(anime.id, "");
    return "";
  }
}

const Spotlight = ({ spotlights = [] }) => {
  const [tmdbLogos, setTmdbLogos] = useState({});
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

  // Fetch logos PROGRESSIVELY instead of waiting for all 12 at once.
  //   * The first 2 logos are fetched immediately (visible slide + the next one).
  //   * The rest are fired right after, each committed to state the moment it
  //     lands (setState per-logo) so logos appear one by one rather than
  //     all-or-nothing after the slowest request.
  useEffect(() => {
    if (!spotlights.length) return;
    const controller = new AbortController();
    let alive = true;

    const firstId = spotlights[0]?.id;
    const commit = (id, logo) => {
      if (!alive || !logo) return;
      // Preload the first slide's logo at high priority so it paints with the hero.
      if (id === firstId) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = logo;
        link.fetchPriority = "high";
        document.head.appendChild(link);
      }
      setTmdbLogos((prev) => (prev[id] === logo ? prev : { ...prev, [id]: logo }));
    };

    const run = async () => {
      const list = spotlights.slice(0, 12);
      // 1) Priority: first two slides, in parallel, committed immediately.
      await Promise.all(
        list.slice(0, 2).map(async (a) => commit(a.id, await fetchLogo(a, controller.signal)))
      );
      // 2) Rest: fire all, commit each as it resolves (no waiting for slowest).
      list.slice(2).forEach(async (a) => {
        const logo = await fetchLogo(a, controller.signal);
        commit(a.id, logo);
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
