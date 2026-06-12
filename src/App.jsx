import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import Loader from "./components/Loader";
import { HomeInfoProvider } from "./context/HomeInfoContext";

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
import DiscordPopup from "./components/DiscordPopup";

// Movies / TV section (isolated module — does not touch the anime site)
import MoviesHome from "./movies/pages/MoviesHome";
import MovieInfo from "./movies/pages/MovieInfo";
import MovieWatch from "./movies/pages/MovieWatch";
import MovieCategory from "./movies/pages/MovieCategory";
import MovieSearch from "./movies/pages/MovieSearch";

import { azRoute, categoryRoutes } from "./utils/category.utils";
import "./App.css";

function App() {
  const location = useLocation();
  const [appLoading, setAppLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
      setTimeout(() => setShowLoader(false), 800);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isSplashScreen = location.pathname === "/";

  return (
    <HelmetProvider>
      <HomeInfoProvider>
        <div
          className={`app-container ${
            isSplashScreen ? "" : "px-4 lg:px-10"
          } flex flex-col min-h-screen`}
        >
          <main className="content max-w-[2048px] mx-auto w-full flex-grow flex flex-col">
            {!isSplashScreen && <Navbar />}

            <div className="flex-grow">
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

                <Route path="/random" element={<RandomAnimeRedirect />} />

                <Route path="/az-list/:letter?" element={<AtoZ />} />

                <Route path="/terms-of-service" element={<Terms />} />
                <Route path="/dmca" element={<DMCA />} />
                <Route path="/contact" element={<Contact />} />

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
                <Route path="/movies" element={<MoviesHome />} />
                <Route path="/movies/trending" element={<MovieCategory category="trending" />} />
                <Route path="/movies/category/:cat" element={<MovieCategory />} />
                <Route path="/movies/search" element={<MovieSearch />} />
                <Route path="/movies/watch/:type/:id" element={<MovieWatch />} />
                <Route path="/movies/:type/:id" element={<MovieInfo />} />

                <Route path="/producer/:id" element={<Producer />} />

                <Route
                  path="/404-not-found-page"
                  element={<Error error="404" />}
                />

                <Route path="/error-page" element={<Error />} />

                <Route path="/:id" element={<AnimeInfo />} />

                <Route path="*" element={<Error error="404" />} />
              </Routes>
            </div>

            {!isSplashScreen && <Footer />}
          </main>

          <Analytics />
          <SpeedInsights />
          <DiscordPopup />

          {showLoader && <Loader fadeOut={!appLoading} />}
        </div>
      </HomeInfoProvider>
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
