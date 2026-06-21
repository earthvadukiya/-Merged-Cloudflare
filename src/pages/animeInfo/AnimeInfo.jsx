import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import getAnimeInfo from "@/src/utils/getAnimeInfo.utils";
import getEpisodes from "@/src/utils/getEpisodes.utils";
import getRecommendations from "@/src/utils/getRecommendations.utils";
import getSeasons from "@/src/utils/getSeasons.utils";
import getJikanInfo from "@/src/utils/getJikanInfo.utils";
import getTmdbInfo from "@/src/utils/getTmdbInfo.utils";

import { createAnimeSlug, getAnimeIdFromSlug } from "@/src/utils/slug.utils";

import Hero from "./components/Hero";
import Seasons from "./components/Seasons";
import EpisodeGrid from "./components/EpisodeGrid";
import Recommendations from "./components/Recommendations";

const TABS = [
  { id: "episodes", label: "Episodes" },
  { id: "relations", label: "Relations" },
  { id: "recommendations", label: "Recommendations" },
];

function PremiumBannerAd() {
  const adRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!adRef.current) return;

      adRef.current.innerHTML = "";

      window.atOptions = {
        key: "fa18fe18755cc0b110e4155f955a4c3e",
        format: "iframe",
        height: 50,
        width: 320,
        params: {},
      };

      const script = document.createElement("script");
      script.src =
        "https://www.highperformanceformat.com/fa18fe18755cc0b110e4155f955a4c3e/invoke.js";
      script.async = true;

      adRef.current.appendChild(script);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hidden xl:block w-full max-w-[430px]">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#101010] via-[#181818] to-[#101010] p-3 shadow-[0_0_25px_rgba(255,255,255,0.03)]">
        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] via-transparent to-white/[0.03] pointer-events-none" />

        <div className="relative flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-400 font-semibold">
              Sponsored
            </span>
          </div>

          <span className="text-[9px] text-zinc-500">Support OFFANIME</span>
        </div>

        <div className="relative w-full flex justify-center">
          <div
            ref={adRef}
            className="w-[320px] h-[50px] overflow-hidden rounded-xl border border-white/5 bg-black/30"
          />
        </div>
      </div>
    </div>
  );
}

export default function AnimeInfo() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const id = useMemo(() => getAnimeIdFromSlug(routeId), [routeId]);

  const [anime, setAnime] = useState(null);
  const [jikanInfo, setJikanInfo] = useState(null);
  const [tmdbInfo, setTmdbInfo] = useState(null);
  const [tmdbLoading, setTmdbLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("episodes");
  const [tabLoading, setTabLoading] = useState(false);

  const [episodes, setEpisodes] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const [loadedTabs, setLoadedTabs] = useState({
    episodes: false,
    relations: false,
    recommendations: false,
  });

  useEffect(() => {
    if (!id) {
      setAnime(null);
      setLoading(false);
      return;
    }

    let alive = true;

    async function loadMainInfo() {
      try {
        setLoading(true);

        setAnime(null);
        setJikanInfo(null);
        setTmdbInfo(null);
        setTmdbLoading(true);

        setEpisodes([]);
        setSeasons([]);
        setRecommendations([]);

        setLoadedTabs({
          episodes: false,
          relations: false,
          recommendations: false,
        });

        setActiveTab("episodes");

        const animeRes = await getAnimeInfo(id);

        if (!alive) return;

        const animeData =
          animeRes?.data ||
          animeRes?.results ||
          animeRes?.anime ||
          animeRes ||
          null;

        setAnime(animeData);

        const malId =
          animeData?.malId ||
          animeData?.malID ||
          animeData?.mal_id ||
          animeData?.idMal ||
          animeData?.mappings?.mal ||
          animeData?.mappings?.malId ||
          animeData?.externalIds?.mal ||
          animeData?.externalIds?.malId ||
          animeData?.ids?.mal ||
          animeData?.ids?.malId ||
          null;

        if (malId) {
          getJikanInfo(malId)
            .then((jikan) => {
              if (alive && jikan) setJikanInfo(jikan);
            })
            .catch((err) => {
              console.log("Failed to load Jikan:", err.message);
            });
        }

        getTmdbInfo(id)
          .then((tmdb) => {
            if (alive) setTmdbInfo(tmdb);
          })
          .catch((err) => {
            console.log("Failed to load TMDB:", err.message);
          })
          .finally(() => {
            if (alive) setTmdbLoading(false);
          });
      } catch (error) {
        console.error("AnimeInfo main load error:", error);

        if (alive) {
          setAnime(null);
          setJikanInfo(null);
          setTmdbInfo(null);
          setTmdbLoading(false);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadMainInfo();

    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!anime || !id || !routeId) return;

    const title =
      anime.title ||
      anime.name ||
      anime.animeTitle ||
      anime.englishTitle ||
      anime.romajiTitle ||
      jikanInfo?.titleEnglish ||
      jikanInfo?.title ||
      tmdbInfo?.title ||
      "anime";

    const correctSlug = createAnimeSlug(title, id);

    if (routeId !== correctSlug) {
      navigate(`/${correctSlug}`, { replace: true });
    }
  }, [anime, jikanInfo, tmdbInfo, id, routeId, navigate]);

  useEffect(() => {
    if (!anime || !id) return;
    if (loadedTabs[activeTab]) return;

    let alive = true;

    async function loadTab() {
      try {
        setTabLoading(true);

        if (activeTab === "episodes") {
          const res = await getEpisodes(id);
          const data = Array.isArray(res)
            ? res
            : res?.results || res?.episodes || [];
          if (alive) setEpisodes(data);
        }

        if (activeTab === "relations") {
          const res = await getSeasons(id);
          const data = Array.isArray(res)
            ? res
            : res?.results || res?.seasons || [];
          if (alive) setSeasons(data);
        }

        if (activeTab === "recommendations") {
          const res = await getRecommendations(id);
          const data = Array.isArray(res)
            ? res
            : res?.results || res?.recommendations || [];
          if (alive) setRecommendations(data);
        }

        if (alive) {
          setLoadedTabs((prev) => ({
            ...prev,
            [activeTab]: true,
          }));
        }
      } catch (error) {
        console.error(`${activeTab} tab load error:`, error);

        if (alive) {
          setLoadedTabs((prev) => ({
            ...prev,
            [activeTab]: true,
          }));
        }
      } finally {
        if (alive) setTabLoading(false);
      }
    }

    loadTab();

    return () => {
      alive = false;
    };
  }, [activeTab, anime, id, loadedTabs]);

  if (loading) return <MainSkeleton />;

  if (!anime) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-3">Anime Not Found</h1>
          <p className="text-gray-400">Failed to load anime information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] text-white min-h-screen">
      <Hero
        anime={anime}
        jikanInfo={jikanInfo}
        tmdbInfo={tmdbInfo}
        tmdbLoading={tmdbLoading}
      />

      <div className="w-full px-3 sm:px-5 lg:px-6 xl:px-8 2xl:px-10 pb-16">
        <div className="w-full">
          <div className="mt-8 border-b border-white/10 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_430px] gap-6 items-end">
            <div className="flex gap-8 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-sm md:text-base font-semibold whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? "text-white border-b-2 border-white"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="pb-4 w-full flex justify-end">
              <PremiumBannerAd />
            </div>
          </div>

          <div className="mt-8 w-full">
            {tabLoading ? (
              <TabSkeleton activeTab={activeTab} />
            ) : (
              <>
                {activeTab === "episodes" && (
                  <EpisodeGrid
                    id={id}
                    anime={anime}
                    episodes={episodes}
                    tmdbInfo={tmdbInfo}
                  />
                )}

                {activeTab === "relations" && <Seasons data={seasons} />}

                {activeTab === "recommendations" && (
                  <Recommendations data={recommendations} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MainSkeleton() {
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-16">
      <div className="w-full px-3 sm:px-5 lg:px-6 xl:px-8 2xl:px-10">
        <div className="w-full">
          <div className="relative overflow-hidden rounded-3xl bg-[#111] border border-white/10 min-h-[520px]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-[#222] to-[#151515] opacity-70 animate-pulse" />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 p-8 md:p-12">
              <div className="w-[185px] h-[430px] rounded-2xl bg-white/10 animate-pulse" />

              <div className="flex-1 space-y-5">
                <div className="h-12 w-[32%] rounded-xl bg-white/10 animate-pulse" />

                <div className="flex gap-3 flex-wrap">
                  <div className="h-8 w-20 rounded-lg bg-white/10 animate-pulse" />
                  <div className="h-8 w-24 rounded-lg bg-white/10 animate-pulse" />
                  <div className="h-8 w-20 rounded-lg bg-white/10 animate-pulse" />
                  <div className="h-8 w-28 rounded-lg bg-white/10 animate-pulse" />
                </div>

                <div className="flex gap-8 flex-wrap">
                  <div className="h-10 w-24 rounded bg-white/10 animate-pulse" />
                  <div className="h-10 w-24 rounded bg-white/10 animate-pulse" />
                  <div className="h-10 w-24 rounded bg-white/10 animate-pulse" />
                  <div className="h-10 w-40 rounded bg-white/10 animate-pulse" />
                </div>

                <div className="space-y-3">
                  <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
                  <div className="h-4 w-[90%] rounded bg-white/10 animate-pulse" />
                  <div className="h-4 w-[75%] rounded bg-white/10 animate-pulse" />
                </div>

                <div className="flex gap-3 pt-3">
                  <div className="h-12 w-36 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-12 w-28 rounded-full bg-white/10 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <TabSkeleton activeTab="episodes" />
        </div>
      </div>
    </div>
  );
}

function TabSkeleton({ activeTab }) {
  if (activeTab === "episodes") {
    return (
      <div>
        <div className="h-8 w-36 rounded bg-white/10 animate-pulse mb-5" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] rounded-2xl bg-[#141414] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="h-8 w-48 rounded bg-white/10 animate-pulse mb-5" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="h-72 rounded-2xl bg-[#141414] border border-white/10 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
