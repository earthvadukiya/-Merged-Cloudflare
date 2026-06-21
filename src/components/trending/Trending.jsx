import { useLanguage } from "@/src/context/LanguageContext";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClosedCaptioning,
  faMicrophone,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import getSafeTitle from "@/src/utils/getSafetitle";
import { createAnimeSlug } from "@/src/utils/slug.utils";

const Trending = ({ trending = [], className }) => {
  const { language } = useLanguage();

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faFire} className="text-white/90" />
        <h2 className="text-xl font-semibold text-white">Trending Now</h2>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3 max-h-[620px] overflow-y-auto pr-1">
        {trending.length === 0 ? (
          <div className="bg-[#141414] rounded-xl p-4">
            <p className="text-gray-400 text-sm">No trending data found.</p>
          </div>
        ) : (
          trending.slice(0, 10).map((item, index) => {
            const title = getSafeTitle(
              item.title,
              language,
              item.japanese_title
            );

            const poster =
              item.poster || item.image || item.cover || "";

            const banner =
              item.banner ||
              item.bannerImage ||
              item.cover ||
              poster;

            return (
              <Link
                key={`${item.id}-${index}`}
                to={`/${createAnimeSlug(item.title, item.id)}`}
                onClick={() =>
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }
                className="relative overflow-hidden rounded-2xl min-h-[92px] border border-white/5 group bg-[#151515]"
              >
                {/* Background Banner */}
                <img
                  src={banner}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-35 grayscale group-hover:opacity-50 group-hover:scale-105 transition duration-500"
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Content */}
                <div className="relative z-10 flex items-center gap-3 p-3">
                  {/* Rank */}
                  <div className="text-white font-black text-xl w-9 shrink-0">
                    #{index + 1}
                  </div>

                  {/* Poster */}
                  <img
                    src={poster}
                    alt={title}
                    className="w-[58px] h-[72px] object-cover rounded-lg shadow-lg bg-white/10 shrink-0"
                  />

                  {/* Info */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="text-white font-bold text-[14px] line-clamp-2 group-hover:text-gray-200">
                      {title}
                    </h3>

                    {/* Meta */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.tvInfo?.sub && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded text-gray-300">
                          <FontAwesomeIcon
                            icon={faClosedCaptioning}
                            className="text-[10px]"
                          />
                          <span className="text-[10px]">
                            {item.tvInfo.sub}
                          </span>
                        </div>
                      )}

                      {item.tvInfo?.dub && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded text-gray-300">
                          <FontAwesomeIcon
                            icon={faMicrophone}
                            className="text-[10px]"
                          />
                          <span className="text-[10px]">
                            {item.tvInfo.dub}
                          </span>
                        </div>
                      )}

                      {item.tvInfo?.showType && (
                        <span className="text-xs text-gray-400">
                          {item.tvInfo.showType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Trending;
