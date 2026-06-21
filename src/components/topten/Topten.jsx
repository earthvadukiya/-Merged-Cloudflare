import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import getTopSearch from "@/src/utils/getTopSearch.utils";
import { createAnimeSlug } from "@/src/utils/slug.utils";

function Topten({ data, className = "" }) {
  const [activePeriod, setActivePeriod] = useState("today");
  const [topData, setTopData] = useState({
    today: [],
    week: [],
    month: [],
  });

  useEffect(() => {
    async function loadTop10() {
      const results = await getTopSearch();
      const safeResults = Array.isArray(results) ? results.slice(0, 10) : [];

      setTopData({
        today: data?.today?.length ? data.today : safeResults,
        week: data?.week?.length ? data.week : safeResults,
        month: data?.month?.length ? data.month : safeResults,
      });
    }

    loadTop10();
  }, [data]);

  const currentData =
    activePeriod === "today"
      ? topData.today
      : activePeriod === "week"
      ? topData.week
      : topData.month;

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-2xl text-white">Top 10</h1>

        <div className="flex bg-[#1a1a1a] rounded-xl overflow-hidden">
          {["today", "week", "month"].map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`px-4 py-2 text-sm transition ${
                activePeriod === period
                  ? "bg-white text-black font-semibold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 max-h-[620px] overflow-y-auto pr-1">
        {currentData.length === 0 ? (
          <div className="bg-[#141414] rounded-xl p-4">
            <p className="text-gray-400 text-sm">No Top 10 data found.</p>
          </div>
        ) : (
          currentData.map((item, index) => {
            const id = item.id || item.anilistId;
            const title =
              item.title || item.name || item.animeTitle || "Unknown";

            const poster =
              item.poster || item.image || item.cover || item.coverImage || "";

            const banner =
              item.banner ||
              item.bannerImage ||
              item.cover ||
              poster;

            return (
              <Link
                key={`${id}-${index}`}
                to={`/${createAnimeSlug(title, id)}`}
                className="relative overflow-hidden rounded-2xl min-h-[92px] border border-white/5 group bg-[#151515]"
              >
                <img
                  src={banner}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-35 grayscale group-hover:opacity-50 group-hover:scale-105 transition duration-500"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                <div className="relative z-10 flex items-center gap-3 p-3">
                  <div className="text-white font-black text-xl w-9 shrink-0">
                    #{index + 1}
                  </div>

                  <img
                    src={poster}
                    alt={title}
                    className="w-[58px] h-[72px] object-cover rounded-lg shadow-lg bg-white/10 shrink-0"
                  />

                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-[15px] line-clamp-2 group-hover:text-gray-200">
                      {title}
                    </h3>

                    <p className="text-xs text-gray-300 mt-1 uppercase font-semibold">
                      {item.year || "Unknown"} &nbsp; • &nbsp;{" "}
                      {item.type || "TV"} &nbsp; • &nbsp;{" "}
                      {item.episodes || "?"} EPS
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export default React.memo(Topten);
