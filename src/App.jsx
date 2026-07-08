import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import Loader from "./components/Loader";
import { HomeInfoProvider } from "./context/HomeInfoContext";
import { AuthProvider } from "./context/AuthContext";
import AuthModal from "./components/auth/AuthModal";
import Dashboard from "./pages/dashboard/Dashboard";

import Home from "./pages/Home/Home";
import AnimeInfo from "./pages/animeInfo/AnimeInfo";
import SchedulePage from "./pages/schedule/SchedulePage";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Error from "./components/error/Error";
import Category from "./pages/category/Category";
import AtoZ from "./pages/a2z/AtoZ";
import Search from "./pages/search/Search";
import Watch from "./pages/watch/Watch";
import Producer from "./components/producer/Producer";
import SplashScreen from "./components/splashscreen/SplashScreen";
import Terms from "./pages/terms/Terms";
import DMCA from "./pages/dmca/DMCA";
import Contact from "./pages/contact/Contact";
import Download from "./pages/download/Download";
import DiscordPopup from "./components/DiscordPopup";
import ErrorBoundary from "./components/ErrorBoundary";

// Movies / TV section (isolated module — does not touch the anime site).
// Lazy-loaded so the entire Movies/TV code is split into a separate chunk
// and never ships in the initial anime-homepage bundle (mobile perf win).
const MoviesHome = lazy(() => import("./movies/pages/MoviesHome"));
const MovieInfo = lazy(() => import("./movies/pages/MovieInfo"));
const MovieWatch = lazy(() => import("./movies/pages/MovieWatch"));
const MovieCategory = lazy(() => import("./movies/pages/MovieCategory"));
const MovieSearch = lazy(() => import("./movies/pages/MovieSearch"));

// Lightweight Suspense wrapper shown while a lazy Movies chunk downloads.
function MoviesFallback({ children }) {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#a855f7] border-t-transparent animate-spin" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

import { azRoute, categoryRoutes } from "./utils/category.utils";
import "./App.css";

function App() {
  const location = useLocation();
  const [appLoading, setAppLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Shorter intro: the old 1400ms forced delay added ~1.4s of dead time before
    // any content showed. 600ms keeps the brief brand flash without padding the
    // perceived load time.
    const timer = setTimeout(() => {
      setAppLoading(false);
      setTimeout(() => setShowLoader(false), 350);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isSplashScreen = location.pathname === "/";

  return (
    <HelmetProvider>
      <AuthProvider>
      <HomeInfoProvider>
        <div
          className={`app-container ${
            isSplashScreen ? "" : "px-4 lg:px-10"
          } flex flex-col min-h-screen`}
        >
          <main className="content max-w-[2048px] mx-auto w-full flex-grow flex flex-col">
            {!isSplashScreen && <Navbar />}

            <div className="flex-grow">
              {/* Keyed on the path so a crash on one page never permanently
                  blanks the SPA — navigating away resets the boundary. */}
              <ErrorBoundary key={location.pathname}>
              <Routes>
                <Route path="/" element={<SplashScreen />} />
                <Route path="/home" element={<Home />} />

                <Route path="/schedule" element={<SchedulePage />} />

                <Route
                  path="/recently-updated"
                  element={
                    <Category path="recently-added" label="Recently Updated" />
                  }
                />

                <Route
                  path="/top-airing"
                  element={<Category path="top-airing" label="Top Airing" />}
                />

                <Route
                  path="/most-favorite"
                  element={
                    <Category path="most-favorite" label="Most Favorite" />
                  }
                />

                <Route
                  path="/latest-completed"
                  element={
                    <Category
                      path="latest-completed"
                      label="Latest Completed"
                    />
                  }
                />

                <Route
                  path="/completed"
                  element={
                    <Category
                      path="latest-completed"
                      label="Latest Completed"
                    />
                  }
                />

                <Route
                  path="/genre/:genre"
                  element={<Category path="genre" label="Genre" />}
                />

                <Route path="/search" element={<Search />} />
                <Route path="/search/:keyword" element={<Search />} />

                <Route path="/watch/:id" element={<Watch />} />

                <Route path="/download" element={<Download />} />

                <Route path="/random" element={<RandomAnimeRedirect />} />

                <Route path="/az-list/:letter?" element={<AtoZ />} />

                <Route path="/terms-of-service" element={<Terms />} />
                <Route path="/dmca" element={<DMCA />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* "movies" is excluded here so the /movies path is owned by
                    the Movies/TV section below (not the anime movies category). */}
                {categoryRoutes
                  .filter((path) => path !== "movies")
                  .map((path) => (
                    <Route
                      key={path}
                      path={`/${path}`}
                      element={
                        <Category path={path} label={path.split("-").join(" ")} />
                      }
                    />
                  ))}

                {azRoute.map((path) => (
                  <Route
                    key={path}
                    path={`/${path}`}
                    element={<AtoZ path={path} />}
                  />
                ))}

                {/* ===== Movies / TV section (registered before /:id catch-all) ===== */}
                <Route path="/movies" element={<MoviesFallback><MoviesHome /></MoviesFallback>} />
                <Route path="/movies/trending" element={<MoviesFallback><MovieCategory category="trending" /></MoviesFallback>} />
                <Route path="/movies/category/:cat" element={<MoviesFallback><MovieCategory /></MoviesFallback>} />
                <Route path="/movies/search" element={<MoviesFallback><MovieSearch /></MoviesFallback>} />
                <Route path="/movies/watch/:type/:id" element={<MoviesFallback><MovieWatch /></MoviesFallback>} />
                <Route path="/movies/:type/:id" element={<MoviesFallback><MovieInfo /></MoviesFallback>} />

                <Route path="/producer/:id" element={<Producer />} />

                <Route
                  path="/404-not-found-page"
                  element={<Error error="404" />}
                />

                <Route path="/error-page" element={<Error />} />

                <Route path="/:id" element={<AnimeInfo />} />

                <Route path="*" element={<Error error="404" />} />
              </Routes>
              </ErrorBoundary>
            </div>

            {!isSplashScreen && <Footer />}
          </main>

          <Analytics />
          <SpeedInsights />
          <DiscordPopup />
          <AuthModal />

          {showLoader && <Loader fadeOut={!appLoading} />}
        </div>
      </HomeInfoProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

function RandomAnimeRedirect() {
  const randomIds = [
    21, 269, 20, 1735, 11061, 16498, 1535, 1575, 5114, 30276, 31964, 38000,
    11757, 9253, 164, 20583, 9989, 9919, 13601,
  ];

  const randomId = randomIds[Math.floor(Math.random() * randomIds.length)];

  return <Navigate to={`/${randomId}`} replace />;
}

export default App;
