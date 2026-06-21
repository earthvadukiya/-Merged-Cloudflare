import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faRandom,
  faMagnifyingGlass,
  faFilm,
} from "@fortawesome/free-solid-svg-icons";

import getSearch from "@/src/utils/getSearch.utils";
import { createAnimeSlug } from "@/src/utils/slug.utils";
import { searchMulti } from "@/src/movies/utils/tmdb";
import Sidebar from "../sidebar/Sidebar";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const searchTimerRef = useRef(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isSplashScreen = location.pathname === "/";
  // Context-aware search: on /movies* we search movies (TMDB); elsewhere anime.
  const isMoviesContext = location.pathname.startsWith("/movies");

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 40);
          ticking = false;
        });

        ticking = true;
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }

    const closeOnEsc = (e) => {
      if (e.key === "Escape") {
        closeSearch();
      }
    };

    window.addEventListener("keydown", closeOnEsc);

    return () => window.removeEventListener("keydown", closeOnEsc);
  }, [searchOpen]);

  useEffect(() => {
    const keyword = search.trim();

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (keyword.length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);

    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = isMoviesContext
          ? await searchMulti(keyword)
          : await getSearch(keyword);

        setSuggestions(
          Array.isArray(results)
            ? results.slice(0, 10)
            : []
        );
      } catch (error) {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 650);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [search, isMoviesContext]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearch("");
    setSuggestions([]);
    setSearching(false);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
  };

  const goToSearchPage = () => {
    const value = search.trim();

    if (!value) return;

    closeSearch();

    if (isMoviesContext) {
      navigate(`/movies/search?q=${encodeURIComponent(value)}`);
    } else {
      navigate(`/search?keyword=${encodeURIComponent(value)}`);
    }
  };

  const openResult = (item) => {
    closeSearch();

    if (isMoviesContext) {
      const id = item?.id;
      const mtype = item?.type === "tv" ? "tv" : "movie";
      if (!id) return;
      navigate(`/movies/${mtype}/${id}`);
      return;
    }

    const id = item?.anilistId || item?.id;
    const title =
      item?.title ||
      item?.name ||
      item?.animeTitle ||
      "anime";
    if (!id) return;
    navigate(`/${createAnimeSlug(title, id)}`);
  };

  if (isSplashScreen) return null;

  return (
    <>
      <nav className="fixed top-4 left-0 w-full z-[9999] pointer-events-none">
        <div className="max-w-[980px] mx-auto px-4 pointer-events-auto">
          <div
            className={`h-[48px] rounded-full border flex items-center justify-between px-4 will-change-transform transform-gpu transition-[background-color,border-color,box-shadow,backdrop-filter,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              scrolled
                ? "bg-black/88 border-white/16 shadow-[0_18px_80px_rgba(139,92,246,0.16)] backdrop-blur-2xl translate-y-[2px] scale-[1.012]"
                : "bg-black/72 border-white/10 shadow-[0_10px_60px_rgba(0,0,0,0.62)] backdrop-blur-xl translate-y-0 scale-100"
            }`}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-300 hover:text-white transition lg:hidden"
              >
                <FontAwesomeIcon icon={faBars} />
              </button>

              <Link
                to="/home"
                className="text-white text-[23px] font-black tracking-tight leading-none transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
              >
                OFF
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-7 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
              <Link
                to="/home"
                className="hover:text-white transition"
              >
                Home
              </Link>

              <Link
                to="/recently-updated"
                className="hover:text-white transition"
              >
                Latest
              </Link>

              <Link
                to="/schedule"
                className="hover:text-white transition"
              >
                Schedule
              </Link>

              <Link
                to="/movies"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white font-semibold bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] shadow-lg shadow-[#a855f7]/20 transition"
              >
                <FontAwesomeIcon icon={faFilm} className="text-[13px]" />
                Movies
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/movies"
                className="md:hidden flex items-center justify-center gap-2 px-3 h-8 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] transition"
                aria-label="Movies"
              >
                <FontAwesomeIcon icon={faFilm} className="text-[13px]" />
                <span className="max-[420px]:hidden">Movies</span>
              </Link>

              <button
                onClick={() => setSearchOpen(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </button>

              <Link
                to="/random"
                className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/15 transition"
              >
                <FontAwesomeIcon icon={faRandom} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {searchOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl overflow-y-auto">
          <div className="min-h-screen px-4 pt-32 pb-16">
            <div className="max-w-[760px] mx-auto">
              <div className="h-[64px] rounded-2xl bg-[#090909]/95 border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.8)] flex items-center px-5">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="text-gray-500 mr-4 text-lg"
                />

                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      goToSearchPage();
                    }
                  }}
                  placeholder={isMoviesContext ? "Search movies & TV..." : "Search anime..."}
                  className="w-full bg-transparent outline-none text-white text-xl"
                />

                <button
                  onClick={closeSearch}
                  className="ml-3 px-3 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 text-xs font-bold"
                >
                  ESC
                </button>
              </div>

              <div className="mt-8 space-y-2">
                {searching && (
                  <div className="text-center text-gray-500 py-10">
                    Searching...
                  </div>
                )}

                {!searching &&
                  suggestions.map((item) => {
                    const id = item.anilistId || item.id;

                    const title =
                      item.title ||
                      item.name ||
                      (isMoviesContext ? "Title" : "Anime");

                    const poster =
                      item.poster ||
                      item.image;

                    const banner =
                      item.backdrop ||
                      item.banner ||
                      item.bannerImage ||
                      item.image ||
                      poster;

                    let meta;
                    if (isMoviesContext) {
                      const kind = item.type === "tv" ? "TV" : "Movie";
                      const yr = item.year || "\u2014";
                      const rating = item.rating ? ` \u2022 \u2605 ${item.rating}` : "";
                      meta = `${kind} \u2022 ${yr}${rating}`;
                    } else {
                      const t = item.type || item.format || "TV";
                      const yr = item.year || item.seasonYear || "?";
                      const eps = item.episodes || item.totalEpisodes || "?";
                      meta = `${t} \u2022 ${yr} \u2022 ${eps} eps`;
                    }

                    return (
                      <button
                        key={`${item.type || ""}-${id}`}
                        onClick={() => openResult(item)}
                        className="relative w-full h-[92px] overflow-hidden rounded-xl border border-white/10 bg-[#111] text-left hover:border-white/25 transition group"
                      >
                        {banner && (
                          <img
                            src={banner}
                            alt={title}
                            className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-45 transition"
                          />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />

                        <div className="relative z-10 h-full flex items-center gap-4 px-4">
                          {poster && (
                            <img
                              src={poster}
                              alt={title}
                              className="w-[52px] h-[70px] rounded-lg object-cover"
                            />
                          )}

                          <div className="min-w-0">
                            <p className="text-white font-bold text-base line-clamp-1">
                              {title}
                            </p>

                            <p className="text-gray-400 text-sm mt-1">{meta}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                {!searching &&
                  search.trim().length >= 3 &&
                  suggestions.length === 0 && (
                    <div className="text-center text-gray-500 py-10">
                      No results found
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
}

export default Navbar;
