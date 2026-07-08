import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import { createAnimeSlug } from "@/src/utils/slug.utils";
import SmartImage from "@/src/components/ui/SmartImage";

const RANGE_SIZE = 100;

export default function EpisodeGrid({ id, anime, episodes = [], tmdbInfo }) {
  const [selectedRange, setSelectedRange] = useState(0);

  const animeTitle = anime?.title || anime?.name || anime?.animeTitle || "anime";
  const animeSlug = createAnimeSlug(animeTitle, id);

  const tmdbEpisodesMap = useMemo(() => {
    const map = {};
    const list = tmdbInfo?.episodes || [];

    list.forEach((ep) => {
      const epNo = Number(ep.episodeNumber || ep.episode_number || ep.number);
      if (!epNo) return;
      map[epNo] = ep;
    });

    return map;
  }, [tmdbInfo]);

  const getEpNumber = (ep, index) => {
    return Number(
      ep.number || ep.episode || ep.episodeId || ep.episodeNumber || index + 1
    );
  };

  const sortedEpisodes = useMemo(() => {
    return [...episodes].sort((a, b) => {
      const aNo = Number(a.number || a.episode || a.episodeId || a.episodeNumber || 0);
      const bNo = Number(b.number || b.episode || b.episodeId || b.episodeNumber || 0);
      return aNo - bNo;
    });
  }, [episodes]);

  const ranges = useMemo(() => {
    if (!sortedEpisodes.length) return [];

    const maxEp = Math.max(
      ...sortedEpisodes.map((ep, index) => getEpNumber(ep, index))
    );

    if (!maxEp || maxEp < 1) return [];

    const result = [];
    for (let start = 1; start <= maxEp; start += RANGE_SIZE) {
      const end = Math.min(start + RANGE_SIZE - 1, maxEp);
      result.push({
        start,
        end,
        label: `${start}-${end}`,
      });
    }

    return result;
  }, [sortedEpisodes]);

  const visibleEpisodes = useMemo(() => {
    const range = ranges[selectedRange];
    if (!range) return sortedEpisodes;

    return sortedEpisodes.filter((ep, index) => {
      const epNo = getEpNumber(ep, index);
      return epNo >= range.start && epNo <= range.end;
    });
  }, [sortedEpisodes, ranges, selectedRange]);

  if (!episodes.length) {
    return (
      <div className="py-14 text-center text-gray-500">
        No episodes found.
      </div>
    );
  }

  return (
    <div className="mt-6 w-full">
      {ranges.length > 1 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500 font-black">
              Episode Range
            </span>

            <span className="text-white text-sm font-bold">
              {ranges[selectedRange]?.label}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {ranges.map((range, index) => (
              <button
                key={range.label}
                onClick={() => setSelectedRange(index)}
                className={`shrink-0 px-5 py-3 rounded-xl border text-sm font-bold transition ${
                  selectedRange === index
                    ? "bg-white text-black border-white"
                    : "bg-[#111] text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-2xl font-black mb-5">Episodes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {visibleEpisodes.map((ep, index) => {
          const epNo = getEpNumber(ep, index);
          const tmdbEp = tmdbEpisodesMap[epNo];

          const realTitle =
            tmdbEp?.title ||
            tmdbEp?.name ||
            ep.title ||
            ep.name ||
            ep.episodeTitle ||
            ep.japaneseTitle ||
            "";

          const epTitle =
            realTitle && !String(realTitle).toLowerCase().startsWith("episode")
              ? realTitle
              : `Episode ${epNo}`;

          const image =
            tmdbEp?.image ||
            tmdbEp?.still ||
            ep.thumbnail ||
            ep.snapshot ||
            ep.preview ||
            ep.still ||
            ep.image ||
            ep.img ||
            "";

          return (
            <Link
              key={ep.id || ep.session || `${id}-${epNo}`}
              to={`/watch/${animeSlug}?ep=${epNo}`}
              className="group relative h-[118px] overflow-hidden rounded-2xl bg-[#0f0f10] border border-white/10 hover:border-white/25 transition"
            >
              <div className="relative z-10 h-full flex items-center gap-4 p-3">
                <div className="relative w-[132px] h-[80px] shrink-0 overflow-hidden rounded-xl bg-white/5">
                  {image ? (
                    <SmartImage
                      src={image}
                      alt={epTitle}
                      className="w-full h-full"
                      imgClassName="group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-white/10 via-white/5 to-black flex items-center justify-center">
                      <span className="text-xs text-gray-400 font-bold">
                        EP {epNo}
                      </span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 pr-8">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400 mb-1">
                    Episode {epNo}
                  </p>
                  <h3 className="text-white font-bold text-[14px] leading-snug line-clamp-2">
                    {epTitle}
                  </h3>
                </div>

                <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-white/10 group-hover:bg-white group-hover:text-black text-white flex items-center justify-center transition">
                  <FontAwesomeIcon icon={faPlay} className="text-xs ml-[2px]" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
