import { useState, memo } from "react";
import { Link } from "react-router-dom";
import SmartImage from "@/src/components/ui/SmartImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faXmark,
  faTv,
  faSignal,
  faCalendarDays,
  faClock,
  faForwardStep,
} from "@fortawesome/free-solid-svg-icons";
import { createAnimeSlug } from "@/src/utils/slug.utils";
import WatchLaterButton from "@/src/components/auth/WatchLaterButton";

function Hero({ anime, jikanInfo, tmdbInfo, tmdbLoading, tmdbBanner }) {
  const [expanded, setExpanded] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const title =
    jikanInfo?.titleEnglish ||
    jikanInfo?.title ||
    anime?.title ||
    anime?.name ||
    anime?.animeTitle ||
    "Unknown Anime";

  const animeId = anime?.id || anime?.anilistId;
  const slug = createAnimeSlug(title, animeId);

  const poster =
    anime?.poster ||
    anime?.image ||
    jikanInfo?.poster ||
    jikanInfo?.image ||
    "";

  // Prefer the high-res TMDB backdrop resolved by AnimeInfo; fall back to the
  // anime API banner / poster so the hero is never empty.
  const banner =
    tmdbBanner ||
    anime?.bannerImage ||
    anime?.banner ||
    anime?.coverImage?.extraLarge ||
    anime?.coverImage?.large ||
    anime?.cover ||
    anime?.image ||
    poster;

  const logo = tmdbInfo?.logo || null;

  const description =
    jikanInfo?.synopsis ||
    anime?.description ||
    anime?.animeDesc ||
    "No description available.";

  const cleanDescription = String(description)
    .replace(/<[^>]+>/g, "")
    .replace(/\[Written by MAL Rewrite\]/gi, "")
    .trim();

  const genres = jikanInfo?.genres?.length
    ? jikanInfo.genres
    : anime?.genres || [];

  const trailerUrl = getTrailerUrl(jikanInfo?.trailer || anime?.trailer);

  const type = jikanInfo?.type || anime?.type || anime?.format || "TV";
  const rawStatus = jikanInfo?.status || anime?.status || "Unknown";
  const status = cleanStatus(rawStatus);
  const isAiring = isCurrentlyAiring(rawStatus);

  const year = jikanInfo?.year || anime?.year || anime?.seasonYear || "N/A";
  const duration = cleanDuration(jikanInfo?.duration || anime?.duration);
  const rating = jikanInfo?.rating || anime?.rating || null;

  const totalEpisodes = cleanEpisodeCount(
    jikanInfo?.episodes ||
      anime?.episodes ||
      anime?.totalEpisodes ||
      tmdbInfo?.totalReturned
  );

  const nextEpisode = isAiring ? getNextEpisode(anime, jikanInfo) : null;

  const metaItems = [
    { icon: faTv, value: type },
    { icon: faSignal, value: status },
    { icon: faCalendarDays, value: year },
    { icon: faClock, value: duration },
    { icon: null, value: rating },
  ].filter((item) => item.value && item.value !== "N/A");

  const inlineInfoItems = [
    { label: "Episodes", value: totalEpisodes, icon: faTv },
    { label: "Status", value: status, icon: faSignal },
    { label: "Duration", value: duration, icon: faClock },
    ...(nextEpisode
      ? [{ label: "Next EP", value: nextEpisode, icon: faForwardStep, wide: true }]
      : []),
  ];

  return (
    <>
      <section className="relative w-full overflow-hidden bg-[#050505] min-h-[780px] lg:min-h-[840px]">
        <div className="absolute inset-0">
          {banner && (
            <img
              key={banner}
              src={banner}
              alt={title}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-center scale-[1.02] brightness-[0.42] contrast-[1.05] saturate-[0.88] select-none pointer-events-none animate-heroFade"
            />
          )}

          <div className="absolute inset-0 bg-black/46" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/96 via-[#050505]/52 to-black/18" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/8 to-[#050505]" />
          <div className="absolute inset-y-0 left-0 w-[28%] bg-gradient-to-r from-[#050505] via-[#050505]/88 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-[10%] bg-gradient-to-l from-[#050505]/85 to-transparent" />
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 pt-[120px]">
          <div className="grid grid-cols-1 lg:grid-cols-[215px_minmax(0,1fr)] xl:grid-cols-[235px_minmax(0,1fr)] gap-7 xl:gap-10 items-start">
            <div className="relative mx-auto lg:mx-0">
              <div className="relative w-[185px] sm:w-[200px] xl:w-[215px] h-[450px] sm:h-[470px] xl:h-[510px] rounded-[22px] overflow-hidden border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.85)] bg-black/40 group/poster">
                {poster && (
                  <SmartImage
                    src={poster}
                    alt={title}
                    eager
                    className="w-full h-full"
                    imgClassName="object-center transition-transform duration-700 ease-out group-hover/poster:scale-[1.04]"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              </div>
            </div>

            <div className="pt-1 w-full max-w-[1100px]">
              {tmdbLoading ? (
                <div className="h-[78px]" />
              ) : logo ? (
                <img
                  src={logo}
                  alt={title}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="max-w-[220px] sm:max-w-[280px] xl:max-w-[330px] max-h-[72px] sm:max-h-[88px] xl:max-h-[100px] object-contain object-left drop-shadow-[0_10px_30px_rgba(0,0,0,0.95)]"
                />
              ) : (
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-black leading-[0.95] text-white drop-shadow-[0_5px_30px_rgba(0,0,0,0.9)]">
                  {title}
                </h1>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {metaItems.map((item, index) => (
                  <MetaPill
                    key={`${item.value}-${index}`}
                    icon={item.icon}
                    value={item.value}
                  />
                ))}
              </div>

              {genres.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {genres.slice(0, 6).map((genre) => {
                    const genreName =
                      typeof genre === "string" ? genre : genre?.name;
                    if (!genreName) return null;

                    return (
                      <Link
                        key={genreName}
                        to={`/genre/${genreName
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                        className="px-3 py-1 rounded-full bg-black/35 border border-white/10 text-xs text-white hover:bg-white hover:text-black transition"
                      >
                        {genreName}
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="mt-7 flex flex-wrap items-start gap-x-8 gap-y-4">
                {inlineInfoItems.map((item) => (
                  <InlineInfo key={item.label} {...item} />
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/watch/${slug}?ep=1`}
                  className="inline-flex items-center gap-3 rounded-full bg-white text-black px-7 py-3 text-sm font-black hover:bg-gray-200 transition-all"
                >
                  <FontAwesomeIcon icon={faPlay} />
                  Watch Now
                </Link>

                {trailerUrl && (
                  <button
                    onClick={() => setTrailerOpen(true)}
                    className="rounded-full bg-black/40 border border-white/10 text-white px-7 py-3 text-sm font-bold hover:bg-white/10 transition-all"
                  >
                    Trailer
                  </button>
                )}

                {animeId && (
                  <WatchLaterButton
                    mediaId={animeId}
                    watchId={slug}
                    title={title}
                    poster={poster}
                    variant="pill"
                  />
                )}
              </div>

              <div
                className={`mt-7 text-gray-200 text-[15px] md:text-[16px] leading-[1.85] max-w-[980px] overflow-hidden transition-all duration-500 ${
                  expanded ? "max-h-[420px]" : "max-h-[118px]"
                }`}
              >
                <p className="drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)]">
                  {cleanDescription}
                </p>
              </div>

              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="mt-5 text-xs uppercase tracking-[0.18em] text-gray-300 hover:text-white transition font-bold"
              >
                {expanded ? "Show Less" : "Show More"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {trailerOpen && trailerUrl && (
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center px-4">
          <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
            <button
              onClick={() => setTrailerOpen(false)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/70 text-white hover:bg-white hover:text-black transition"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>

            <iframe
              src={trailerUrl}
              title={`${title} Trailer`}
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}

function MetaPill({ icon, value }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-gray-100 hover:bg-white/10 hover:border-white/25 transition">
      {icon && (
        <FontAwesomeIcon icon={icon} className="text-[11px] text-gray-300" />
      )}
      <span className="line-clamp-1">{value}</span>
    </div>
  );
}

function InlineInfo({ label, value, icon, wide = false }) {
  return (
    <div className={`${wide ? "min-w-[180px] max-w-[260px]" : "min-w-[110px]"} text-white`}>
      <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-gray-400">
        {icon && <FontAwesomeIcon icon={icon} className="text-[11px]" />}
        {label}
      </p>
      <p className="mt-1 text-[15px] sm:text-[16px] font-black leading-[1.35] text-white break-words whitespace-normal">
        {value || "N/A"}
      </p>
    </div>
  );
}

function getTrailerUrl(trailer) {
  if (!trailer) return null;
  if (trailer.embedUrl) return trailer.embedUrl;
  if (trailer.youtube_id) return `https://www.youtube.com/embed/${trailer.youtube_id}`;
  if (trailer.id && trailer.site?.toLowerCase?.() === "youtube") {
    return `https://www.youtube.com/embed/${trailer.id}`;
  }

  if (trailer.url) {
    const match = trailer.url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}`;
  }

  return null;
}

function isCurrentlyAiring(value = "") {
  const lower = String(value).replaceAll("_", " ").toLowerCase();

  if (
    lower.includes("finished") ||
    lower.includes("completed") ||
    lower.includes("ended")
  ) {
    return false;
  }

  return (
    lower.includes("releasing") ||
    lower.includes("currently airing") ||
    lower === "airing" ||
    lower.includes("airing")
  );
}

function cleanStatus(value = "") {
  const text = String(value).replaceAll("_", " ").trim();
  if (!text) return "Unknown";

  const lower = text.toLowerCase();

  // Check finished/completed FIRST.
  // Jikan returns "Finished Airing", which was wrongly becoming "Airing" before.
  if (
    lower.includes("finished") ||
    lower.includes("completed") ||
    lower.includes("ended")
  ) {
    return "Completed";
  }

  if (
    lower.includes("currently airing") ||
    lower.includes("releasing") ||
    lower === "airing" ||
    lower.includes("airing")
  ) {
    return "Airing";
  }

  if (lower.includes("not yet") || lower.includes("upcoming")) return "Upcoming";

  return text
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function cleanDuration(value) {
  if (!value) return "N/A";
  const text = String(value);
  if (/min/i.test(text)) return text.replace("per ep", "").trim();
  const num = Number(text);
  if (Number.isFinite(num)) return `${num} min`;
  return text;
}

function cleanEpisodeCount(value) {
  if (!value || value === "?" || value === "Unknown") return "N/A";
  return value;
}

function getNextEpisode(anime, jikanInfo) {
  const structuredNext =
    anime?.nextAiringEpisode ||
    anime?.nextEpisode ||
    jikanInfo?.nextAiringEpisode;

  if (structuredNext?.airingAt) {
    const date = new Date(Number(structuredNext.airingAt) * 1000);

    if (!Number.isNaN(date.getTime()) && date.getTime() > Date.now()) {
      const day = date.toLocaleDateString("en-IN", { weekday: "short" });
      const time = date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      return structuredNext?.episode
        ? `EP ${structuredNext.episode} • ${day} ${time}`
        : `${day} • ${time}`;
    }
  }

  const broadcastText =
    jikanInfo?.broadcast?.string ||
    anime?.broadcast?.string ||
    anime?.broadcast ||
    "";

  if (broadcastText) return formatBroadcastText(broadcastText);

  return null;
}

function formatBroadcastText(value = "") {
  const text = String(value).replace(/\s+/g, " ").trim();
  if (!text) return null;

  const noTimezone = text.replace(/\s*\(.*?\)\s*$/, "").trim();
  const match = noTimezone.match(/^([A-Za-z]+)s?\s+at\s+(.+)$/i);

  if (match) {
    const day = match[1].slice(0, 3);
    return `${day} • ${match[2].trim()}`;
  }

  return noTimezone
    .replace(/^Every\s+/i, "")
    .replace(/^Unknown\s*/i, "")
    .trim();
}

export default memo(Hero);
