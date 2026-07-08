import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClosedCaptioning,
  faMicrophone,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { FaChevronRight } from "react-icons/fa";
import { useLanguage } from "@/src/context/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import getSafeTitle from "@/src/utils/getSafetitle";
import "./CategoryCard.css";
import { createAnimeSlug } from "@/src/utils/slug.utils";

const PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='420' viewBox='0 0 300 420'%3E%3Crect width='300' height='420' fill='%23111827'/%3E%3C/svg%3E";

function getImage(item = {}) {
  return (
    item.poster ||
    item.image ||
    item.img ||
    item.cover ||
    item.coverImage?.extraLarge ||
    item.coverImage?.large ||
    item.coverImage ||
    PLACEHOLDER
  );
}

const AnimeCard = React.memo(
  ({ item, navigate, path, language, isFirstRow = false, priority = false }) => {
    const [imgSrc, setImgSrc] = useState(() => getImage(item));

    const title = getSafeTitle(item.title, language, item.japanese_title);
    const slug = createAnimeSlug(item.title || item.name || "anime", item.id);

    const target =
      path === "top-upcoming" ? `/${slug}` : `/watch/${slug}`;

    return (
      <div
        className={`flex flex-col group/card ${
          !isFirstRow
            ? "transition-transform duration-500 ease-out hover:-translate-y-1.5"
            : "category-card-container"
        }`}
        style={{ height: "fit-content" }}
      >
        <div className="w-full h-auto pb-[140%] relative inline-block overflow-hidden rounded-xl shadow-lg group bg-[#111827] transition-all duration-500 ease-out group-hover/card:shadow-[0_18px_45px_rgba(255,186,222,0.18)] ring-1 ring-white/[0.04] group-hover/card:ring-[#ffbade]/30">
          <div
            className="inline-block bg-gray-900 absolute left-0 top-0 w-full h-full group hover:cursor-pointer"
            onClick={() => navigate(target)}
          >
            <img
              src={imgSrc}
              alt={title}
              className="block w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.08]"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "low"}
              onError={() => {
                if (imgSrc !== PLACEHOLDER) {
                  setImgSrc(PLACEHOLDER);
                }
              }}
            />

            {/* Smooth darkening + subtle pink wash on hover. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[#ffbade]/0 group-hover:bg-[#ffbade]/[0.06] transition-colors duration-500" />

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-[58px] h-[58px] max-[450px]:w-12 max-[450px]:h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center text-white scale-75 opacity-0 transition-all duration-[450ms] ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:bg-white group-hover:text-black shadow-2xl">
                <FontAwesomeIcon
                  icon={faPlay}
                  className="text-[20px] ml-0.5 max-[450px]:text-[15px]"
                />
              </span>
            </div>
          </div>

          {(item.tvInfo?.rating === "18+" || item?.adultContent === true) && (
            <div className="text-white px-2 py-0.5 rounded-lg bg-red-600 absolute top-3 left-3 flex items-center justify-center text-[12px] font-bold">
              18+
            </div>
          )}

          <div
            className={`absolute bottom-0 left-0 right-0 ${
              isFirstRow ? "p-3 pb-2" : "p-2"
            } bg-gradient-to-t from-black/80 via-black/50 to-transparent`}
          >
            <div
              className={`flex items-center justify-start w-full ${
                isFirstRow
                  ? "space-x-1.5"
                  : "space-x-1 max-[478px]:space-x-0.5"
              } z-[100] flex-wrap gap-y-1.5`}
            >
              {item.tvInfo?.sub && (
                <div
                  className={`flex space-x-0.5 justify-center items-center bg-[#2a2a2a] rounded-[2px] ${
                    isFirstRow ? "px-2 py-1" : "px-1.5 py-0.5 max-[478px]:px-1"
                  } text-white`}
                >
                  <FontAwesomeIcon
                    icon={faClosedCaptioning}
                    className={isFirstRow ? "text-[11px]" : "text-[10px]"}
                  />
                  <p
                    className={`${
                      isFirstRow ? "text-[11px]" : "text-[10px]"
                    } font-medium`}
                  >
                    {item.tvInfo.sub}
                  </p>
                </div>
              )}

              {item.tvInfo?.dub && (
                <div
                  className={`flex space-x-0.5 justify-center items-center bg-[#2a2a2a] rounded-[2px] ${
                    isFirstRow ? "px-2 py-1" : "px-1.5 py-0.5 max-[478px]:px-1"
                  } text-white`}
                >
                  <FontAwesomeIcon
                    icon={faMicrophone}
                    className={isFirstRow ? "text-[11px]" : "text-[10px]"}
                  />
                  <p
                    className={`${
                      isFirstRow ? "text-[11px]" : "text-[10px]"
                    } font-medium`}
                  >
                    {item.tvInfo.dub}
                  </p>
                </div>
              )}

              {item.tvInfo?.showType && (
                <div
                  className={`bg-[#2a2a2a] text-white rounded-[2px] ${
                    isFirstRow
                      ? "px-2 py-1 text-[11px]"
                      : "px-1.5 py-0.5 text-[10px] max-[478px]:hidden"
                  } font-medium`}
                >
                  {item.tvInfo.showType.split(" ").shift()}
                </div>
              )}

              {item.releaseDate && (
                <div
                  className={`bg-[#2a2a2a] text-white rounded-[2px] ${
                    isFirstRow
                      ? "px-2 py-1 text-[11px]"
                      : "px-1.5 py-0.5 text-[10px]"
                  } font-medium`}
                >
                  {item.releaseDate}
                </div>
              )}

              {!item.tvInfo?.showType && item.type && (
                <div
                  className={`bg-[#2a2a2a] text-white rounded-[2px] ${
                    isFirstRow
                      ? "px-2 py-1 text-[11px]"
                      : "px-1.5 py-0.5 text-[10px]"
                  } font-medium`}
                >
                  {item.type}
                </div>
              )}

              {(item.tvInfo?.duration || item.duration) && (
                <div
                  className={`bg-[#2a2a2a] text-white rounded-[2px] ${
                    isFirstRow
                      ? "px-2 py-1 text-[11px]"
                      : "px-1.5 py-0.5 text-[10px] max-[478px]:hidden"
                  } font-medium`}
                >
                  {item.tvInfo?.duration === "m" ||
                  item.tvInfo?.duration === "?" ||
                  item.duration === "m" ||
                  item.duration === "?"
                    ? "N/A"
                    : item.tvInfo?.duration || item.duration || "N/A"}
                </div>
              )}
            </div>
          </div>
        </div>

        <Link
          to={`/${slug}`}
          className="text-white font-semibold mt-3 item-title hover:cursor-pointer line-clamp-1 transition-colors duration-300 group-hover/card:text-[#ffbade]"
        >
          {title}
        </Link>

        {isFirstRow && item.description && (
          <div className="line-clamp-3 text-[13px] font-light text-gray-400 mt-3 max-[1200px]:hidden">
            {item.description}
          </div>
        )}
      </div>
    );
  }
);

AnimeCard.displayName = "AnimeCard";

const CategoryCard = React.memo(
  ({
    label,
    data = [],
    showViewMore = true,
    className = "",
    categoryPage = false,
    cardStyle,
    path = "",
    limit,
    gridClass,
  }) => {
    const { language } = useLanguage();
    const navigate = useNavigate();

    const displayData = useMemo(() => {
      const safeData = Array.isArray(data) ? data : [];
      return limit ? safeData.slice(0, limit) : safeData;
    }, [data, limit]);

    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth > 758);

    useEffect(() => {
      let timer;

      const handleResize = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          setIsDesktop(window.innerWidth > 758);
        }, 150);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    const itemsToRender = useMemo(() => {
      if (categoryPage && isDesktop && displayData.length > 4) {
        return {
          firstRow: displayData.slice(0, 4),
          remainingItems: displayData.slice(4),
        };
      }

      return {
        firstRow: [],
        remainingItems: displayData,
      };
    }, [categoryPage, isDesktop, displayData]);

    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-semibold text-2xl text-white max-[478px]:text-[18px] capitalize tracking-wide">
            {label}
          </h1>

          {showViewMore && path && (
            <Link
              to={`/${path}`}
              className="flex items-center gap-x-1 py-1 px-2 -mr-2 rounded-md text-[13px] font-medium text-[#ffffff80] hover:text-white transition-all duration-300 group"
            >
              View all
              <FaChevronRight className="text-[10px] transform transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        {categoryPage && itemsToRender.firstRow.length > 0 && (
          <div className="grid grid-cols-4 gap-x-3 gap-y-8 transition-all duration-300 ease-in-out mt-2 max-[758px]:hidden">
            {itemsToRender.firstRow.map((item, index) => (
              <AnimeCard
                key={item.id || item.anilistId || item.malId || index}
                item={item}
                navigate={navigate}
                path={path}
                language={language}
                isFirstRow={true}
                priority={index < 2}
              />
            ))}
          </div>
        )}

        <div
          className={`grid ${
            gridClass ||
            cardStyle ||
            "grid-cols-5 max-[1400px]:grid-cols-4 max-[758px]:grid-cols-3 max-[478px]:grid-cols-3"
          } gap-x-3 gap-y-8 mt-2 transition-all duration-300 ease-in-out max-[478px]:gap-x-2`}
        >
          {itemsToRender.remainingItems.map((item, index) => (
            <AnimeCard
              key={item.id || item.anilistId || item.malId || index}
              item={item}
              navigate={navigate}
              path={path}
              language={language}
              priority={index < 2}
            />
          ))}
        </div>
      </div>
    );
  }
);

CategoryCard.displayName = "CategoryCard";

export default CategoryCard;
