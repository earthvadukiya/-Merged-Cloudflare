import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API =
  import.meta.env.VITE_API_URL || "https://anime-details-api.vercel.app/api";

function getDateLabel(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);

  const value = date.toISOString().split("T")[0];

  return {
    date,
    value,
    label:
      offset === 0
        ? "Today"
        : offset === 1
        ? "Tomorrow"
        : "Day After Tomorrow",
    dayName: date.toLocaleDateString("en-US", { weekday: "long" }),
    shortDate: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  };
}

export default function SchedulePage() {
  const days = useMemo(
    () => [getDateLabel(0), getDateLabel(1), getDateLabel(2)],
    []
  );

  const [activeDay, setActiveDay] = useState(days[0]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSchedule() {
      setLoading(true);

      try {
        const res = await fetch(
          `${API}/schedule?date=${encodeURIComponent(activeDay.value)}`
        );

        const json = await res.json();
        setSchedule(Array.isArray(json?.results) ? json.results : []);
      } catch (err) {
        console.log("Schedule load failed:", err);
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [activeDay.value]);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12">
      <div className="max-w-[1450px] mx-auto px-4">
        <div className="mb-7">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
            Anime Schedule
          </h1>

          <p className="text-white/40 mt-2 text-sm sm:text-base">
            Upcoming anime episodes, updated from AniList schedule.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
          {days.map((day) => {
            const active = activeDay.value === day.value;

            return (
              <button
                key={day.value}
                onClick={() => setActiveDay(day)}
                className={`rounded-2xl px-5 py-5 border text-left transition-all duration-300 ${
                  active
                    ? "bg-white text-black border-white"
                    : "bg-white/[0.03] text-white border-white/10 hover:bg-white/[0.06]"
                }`}
              >
                <div className="font-black text-2xl">{day.label}</div>

                <div
                  className={`mt-1 text-sm ${
                    active ? "text-black/60" : "text-white/40"
                  }`}
                >
                  {day.dayName} • {day.shortDate}
                </div>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-white/40">
            Loading schedule...
          </div>
        ) : schedule.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <h2 className="text-2xl font-black">No schedule data</h2>
            <p className="text-white/40 mt-2">No anime airing found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedule.map((item, index) => {
              const id = item.anilistId || item.id;
              const title = item.title || item.name || "Anime";
              const image = item.banner || item.image || item.poster || "";
              const poster = item.poster || item.image || image;

              return (
                <Link
                  key={`${id}-${item.episode}-${index}`}
                  to={`/${id}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] min-h-[115px] flex items-center"
                >
                  {image && (
                    <img
                      src={image}
                      alt={title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:scale-105 transition duration-500"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/50" />

                  <div className="relative z-10 pl-4">
                    <img
                      src={poster}
                      alt={title}
                      loading="lazy"
                      className="w-[64px] h-[84px] object-cover rounded-xl border border-white/10 bg-white/5"
                    />
                  </div>

                  <div className="relative z-10 flex-1 px-4 min-w-0">
                    <h2 className="text-lg sm:text-2xl font-black line-clamp-1">
                      {title}
                    </h2>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80">
                        Episode {item.episode || "?"}
                      </span>

                      <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80">
                        {item.type || "TV"}
                      </span>

                      <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/80 md:hidden">
                        {item.time || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 pr-4 hidden md:block">
                    <div className="rounded-xl bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 text-sm font-bold">
                      {item.time || "N/A"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
