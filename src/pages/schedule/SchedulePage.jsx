import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faClock,
  faChevronDown,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";

import { HOME_API } from "@/src/config/api";
import { createAnimeSlug } from "@/src/utils/slug.utils";
import website_name from "@/src/config/website";

const API = HOME_API;

// How many cards to reveal per "Load More" click.
const PAGE_SIZE = 8;

function getDateInfo(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return {
    offset,
    value: date.toISOString().split("T")[0],
    label:
      offset === 0
        ? "Today"
        : offset === 1
        ? "Tomorrow"
        : date.toLocaleDateString("en-US", { weekday: "long" }),
    dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
    dayNum: date.getDate(),
    month: date.toLocaleDateString("en-US", { month: "short" }),
  };
}

function SkeletonRow() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] h-[112px] flex items-center gap-4 px-4 animate-pulse">
      <div className="w-[70px] h-[92px] rounded-xl bg-white/[0.06]" />
      <div className="flex-1 space-y-3">
        <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
        <div className="h-3 w-1/3 rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}

export default function SchedulePage() {
  // A full week of selectable days instead of the old 3-day window.
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => getDateInfo(i)),
    []
  );

  const [activeValue, setActiveValue] = useState(days[0].value);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const activeDay = days.find((d) => d.value === activeValue) || days[0];

  const GMTOffset = useMemo(() => {
    const off = new Date().getTimezoneOffset();
    const sign = off <= 0 ? "+" : "-";
    const hh = String(Math.floor(Math.abs(off) / 60)).padStart(2, "0");
    const mm = String(Math.abs(off) % 60).padStart(2, "0");
    return `GMT ${sign}${hh}:${mm}`;
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadSchedule() {
      setLoading(true);
      setVisible(PAGE_SIZE); // reset paging whenever the day changes
      try {
        const res = await fetch(
          `${API}/schedule?date=${encodeURIComponent(activeValue)}`
        );
        const json = await res.json();
        if (!alive) return;
        setSchedule(Array.isArray(json?.results) ? json.results : []);
      } catch (err) {
        console.log("Schedule load failed:", err);
        if (alive) setSchedule([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadSchedule();
    return () => {
      alive = false;
    };
  }, [activeValue]);

  const shown = schedule.slice(0, visible);
  const hasMore = visible < schedule.length;

  return (
    <div className="min-h-screen bg-[#070709] text-white pt-24 pb-16">
      <Helmet>
        <title>{`Anime Schedule - ${website_name}`}</title>
      </Helmet>

      {/* Ambient pink glow header backdrop */}
      <div className="relative">
        <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[680px] h-[340px] bg-[#ff7eb6]/10 blur-[120px] rounded-full" />

        <div className="max-w-[1450px] mx-auto px-4 relative">
          {/* Header */}
          <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
            <div>
              <span className="inline-flex items-center gap-2 text-[#ffbade] text-xs font-bold uppercase tracking-[0.2em] mb-3">
                <FontAwesomeIcon icon={faCalendarDays} />
                Weekly Airing
              </span>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-white to-[#ffbade] bg-clip-text text-transparent">
                Anime Schedule
              </h1>
              <p className="text-white/40 mt-3 text-sm sm:text-base max-w-xl">
                Track every upcoming episode for the week ahead — pulled live
                from the AniList airing schedule.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 leading-[34px] px-4 rounded-full bg-white/[0.06] border border-white/10 text-white/70 text-[13px] font-medium">
              <FontAwesomeIcon icon={faClock} className="text-[#ffbade]" />
              {GMTOffset}
            </span>
          </div>

          {/* Day selector — a scrollable week strip */}
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 mb-8 snap-x">
            {days.map((day) => {
              const active = activeValue === day.value;
              return (
                <button
                  key={day.value}
                  onClick={() => setActiveValue(day.value)}
                  className={`snap-start shrink-0 min-w-[88px] rounded-2xl px-4 py-3 border text-center transition-all duration-300 ease-out ${
                    active
                      ? "bg-gradient-to-b from-[#ffbade] to-[#ff7eb6] text-black border-transparent shadow-[0_10px_30px_rgba(255,126,182,0.3)] -translate-y-0.5"
                      : "bg-white/[0.03] text-white border-white/[0.08] hover:bg-white/[0.07] hover:-translate-y-0.5"
                  }`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                    {day.dayName}
                  </div>
                  <div className="text-2xl font-black leading-tight mt-0.5">
                    {day.dayNum}
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 font-medium ${
                      active ? "text-black/60" : "text-white/40"
                    }`}
                  >
                    {day.label === "Today" || day.label === "Tomorrow"
                      ? day.label
                      : day.month}
                  </div>
                </button>
              );
            })}
          </div>

          {/* List */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : schedule.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-14 text-center">
              <FontAwesomeIcon
                icon={faCalendarDays}
                className="text-4xl text-white/15 mb-4"
              />
              <h2 className="text-2xl font-black">No episodes scheduled</h2>
              <p className="text-white/40 mt-2">
                Nothing is airing on {activeDay.label.toLowerCase()}. Try another
                day.
              </p>
            </div>
          ) : (
            <>
              <p className="text-white/40 text-sm mb-4">
                Showing{" "}
                <span className="text-white font-semibold">{shown.length}</span>{" "}
                of{" "}
                <span className="text-white font-semibold">
                  {schedule.length}
                </span>{" "}
                episodes airing {activeDay.label.toLowerCase()}
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {shown.map((item, index) => {
                  const id = item.anilistId || item.id;
                  const title = item.title || item.name || "Anime";
                  const banner = item.banner || item.image || item.poster || "";
                  const poster = item.poster || item.image || banner;
                  const ep = item.episode || item.episode_no || "?";

                  return (
                    <Link
                      key={`${id}-${ep}-${index}`}
                      to={`/${createAnimeSlug(title, id)}`}
                      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] min-h-[112px] flex items-center transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#ffbade]/30 hover:shadow-[0_16px_40px_rgba(255,126,182,0.16)]"
                    >
                      {banner && (
                        <img
                          src={banner}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-700"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-[#070709]/92 to-[#070709]/55" />

                      <div className="relative z-10 pl-4 py-3">
                        <img
                          src={poster}
                          alt={title}
                          loading="lazy"
                          decoding="async"
                          className="w-[70px] h-[92px] object-cover rounded-xl border border-white/10 bg-white/5 group-hover:border-[#ffbade]/40 transition-colors duration-300"
                        />
                      </div>

                      <div className="relative z-10 flex-1 px-4 min-w-0">
                        <h2 className="text-base sm:text-xl font-bold line-clamp-1 group-hover:text-[#ffbade] transition-colors duration-300">
                          {title}
                        </h2>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffbade]/10 text-[#ffbade] text-xs font-semibold">
                            <FontAwesomeIcon
                              icon={faClock}
                              className="text-[10px]"
                            />
                            {item.time || "N/A"}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-white/[0.07] text-xs text-white/70 font-medium">
                            {item.type || "TV"}
                          </span>
                        </div>
                      </div>

                      <div className="relative z-10 pr-4">
                        <div className="flex items-center gap-2 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 px-3.5 py-2 text-sm font-bold group-hover:bg-[#ffbade] group-hover:text-black group-hover:border-[#ffbade] transition-all duration-300">
                          <FontAwesomeIcon
                            icon={faPlay}
                            className="text-[10px]"
                          />
                          EP {ep}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="group inline-flex items-center gap-2.5 rounded-full bg-white/[0.05] hover:bg-[#ffbade] border border-white/10 hover:border-[#ffbade] text-white hover:text-black font-bold px-7 py-3.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(255,126,182,0.25)]"
                  >
                    Load More
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className="text-xs transition-transform duration-300 group-hover:translate-y-0.5"
                    />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
