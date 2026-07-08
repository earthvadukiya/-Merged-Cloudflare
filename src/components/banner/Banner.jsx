import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faClosedCaptioning,
  faMicrophone,
  faCalendar,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { createAnimeSlug } from "@/src/utils/slug.utils";
import { useLanguage } from "@/src/context/LanguageContext";
import getSafeTitle from "@/src/utils/getSafetitle";
import "./Banner.css";

function Banner({ item, index, active = false, tmdbLogo, tmdbBanner }) {
  const { language } = useLanguage();

  const title = getSafeTitle(item.title, language, item.japanese_title);

  // Prefer the high-res TMDB backdrop (resolved progressively). Until it arrives
  // we use the anime API banner so the slot is never empty, then crossfade to the
  // TMDB image for a premium, consistent hero.
  const fallbackImage =
    item.banner ||
    item.bannerImage ||
    item.cover ||
    item.image ||
    item.poster;

  const bannerImage = tmdbBanner || fallbackImage;

  // Only the first slide (the LCP element) and the currently-active slide load
  // eagerly + at high priority. Every other slide is lazy, so the browser does
  // not download 10+ full-size hero images on first paint (the LCP killer).
  const isPriority = index === 0 || active;

  return (
    <section className="spotlight w-full h-full relative overflow-hidden bg-[#050505]">
      {/* MAIN IMAGE — single download. A CSS-blurred copy behind it would mean a
          second full-res fetch, so we instead let the dark gradients handle the
          edges. This halves hero image bytes. */}
      <img
        key={bannerImage}
        src={bannerImage}
        alt={title}
        draggable="false"
        loading={isPriority ? "eager" : "lazy"}
        fetchpriority={isPriority ? "high" : "low"}
        decoding="async"
        className="banner-bg-image absolute inset-0 w-full h-full object-cover"
        style={{
          imageRendering: "auto",
          backfaceVisibility: "hidden",
          transform: "translateZ(0)",
        }}
      />

      {/* OVERLAYS */}
      <div className="absolute inset-0 bg-black/45 z-[1]" />

      {/* LEFT DARKNESS */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.82) 22%, rgba(0,0,0,0.45) 48%, rgba(0,0,0,0.58) 100%)",
        }}
      />

      {/* TOP DARKNESS */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 18%, transparent 65%, rgba(5,5,5,0.95) 100%)",
        }}
      />

      {/* BOTTOM WEBSITE BLEND */}
      <div
        className="absolute bottom-0 left-0 w-full h-[260px] z-[2]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(5,5,5,0.85) 60%, #050505 100%)",
        }}
      />

      {/* CONTENT */}
      <div className="absolute inset-0 z-[5] flex items-end">
        <div className="w-full flex justify-between items-end px-[60px] pb-[85px] max-[1400px]:px-[40px] max-[1400px]:pb-[70px] max-md:px-5 max-md:pb-16">
          {/* LEFT */}
          <div className={`max-w-[820px] ${active ? "spotlight-rise" : ""}`}>
            <p className="text-[#ffbade] font-semibold text-[20px] max-md:text-[14px]">
              #{index + 1} Spotlight
            </p>

            {/* ANIME LOGO (TMDB) — replaces the plain-text title. Logos are tiny
                PNGs so they paint fast; the active slide loads eager + high
                priority. If no logo exists for this title we gracefully fall back
                to the text title so the slot is never empty. */}
            {tmdbLogo ? (
              <img
                src={tmdbLogo}
                alt={title}
                draggable="false"
                loading={isPriority ? "eager" : "lazy"}
                fetchpriority={isPriority ? "high" : "low"}
                decoding="async"
                className="spotlight-logo mt-5 object-contain object-left h-[110px] max-w-[480px] w-auto drop-shadow-[0_6px_24px_rgba(0,0,0,0.7)] max-[1400px]:h-[92px] max-[1200px]:h-[76px] max-md:h-[58px] max-md:max-w-[72%]"
              />
            ) : (
              <h3 className="text-white leading-[1.05] text-[58px] font-extrabold mt-5 line-clamp-2 max-[1400px]:text-[46px] max-[1200px]:text-[38px] max-md:text-[30px]">
                {title}
              </h3>
            )}

            {/* INFO */}
            {item.tvInfo && (
              <div className="flex flex-wrap items-center gap-5 mt-6 max-md:hidden">
                {item.tvInfo.showType && (
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faPlay}
                      className="text-[9px] bg-white/10 text-white px-[5px] py-[4px] rounded-full"
                    />
                    <p className="text-white/80 text-[15px]">
                      {item.tvInfo.showType}
                    </p>
                  </div>
                )}

                {item.tvInfo.duration && (
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faClock}
                      className="text-white/70 text-[13px]"
                    />
                    <p className="text-white/75 text-[15px]">
                      {item.tvInfo.duration}
                    </p>
                  </div>
                )}

                {item.tvInfo.releaseDate && (
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="text-white/70 text-[13px]"
                    />
                    <p className="text-white/75 text-[15px]">
                      {item.tvInfo.releaseDate}
                    </p>
                  </div>
                )}

                {item.tvInfo.quality && (
                  <div className="bg-white/10 border border-white/10 px-3 py-1 rounded-lg text-white text-[12px] font-semibold">
                    {item.tvInfo.quality}
                  </div>
                )}

                <div className="flex items-center overflow-hidden rounded-lg border border-white/10">
                  {item.tvInfo.episodeInfo?.sub && (
                    <div className="flex items-center gap-1 bg-white/10 px-3 py-1">
                      <FontAwesomeIcon
                        icon={faClosedCaptioning}
                        className="text-[11px] text-white"
                      />
                      <p className="text-[12px] font-semibold text-white">
                        {item.tvInfo.episodeInfo.sub}
                      </p>
                    </div>
                  )}

                  {item.tvInfo.episodeInfo?.dub && (
                    <div className="flex items-center gap-1 bg-white/20 px-3 py-1">
                      <FontAwesomeIcon
                        icon={faMicrophone}
                        className="text-[11px] text-white"
                      />
                      <p className="text-[12px] font-semibold text-white">
                        {item.tvInfo.episodeInfo.dub}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DESCRIPTION */}
            <p className="text-white/70 text-[22px] leading-[1.7] mt-7 max-w-[900px] line-clamp-3 max-[1400px]:text-[18px] max-md:hidden">
              {item.description}
            </p>
          </div>

          {/* BUTTONS */}
          <div className="flex items-center gap-5 mb-5 max-md:hidden">
            <Link
              to={`/watch/${createAnimeSlug(
                item.title || item.name,
                item.id
              )}?ep=1`}
              className="h-[64px] px-10 rounded-2xl bg-white text-black text-[18px] font-semibold flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:bg-gray-200 shadow-2xl"
            >
              <FontAwesomeIcon icon={faPlay} className="text-[13px]" />
              Watch Now
            </Link>

            <Link
              to={`/${createAnimeSlug(item.title || item.name, item.id)}`}
              className="h-[64px] px-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white text-[18px] font-semibold flex items-center justify-center transition-all duration-300 hover:bg-white/20"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Banner;
