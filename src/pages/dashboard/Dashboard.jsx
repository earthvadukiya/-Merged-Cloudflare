import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faBookmark,
  faTrashCan,
  faClockRotateLeft,
  faRightToBracket,
  faRightFromBracket,
  faCloudArrowUp,
  faCircleExclamation,
  faFilm,
  faTv,
  faLayerGroup,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "@/src/context/AuthContext";
import {
  listProgress,
  listLater,
  removeProgress,
  removeLater,
  watchHref,
  isMediaItem,
} from "@/src/lib/watchlist";

export default function Dashboard() {
  const { user, isAuthed, displayName, loading, openAuth, signOut } = useAuth();
  const userId = user?.id || null;
  const email = user?.email || "";

  const [progress, setProgress] = useState([]);
  const [later, setLater] = useState([]);
  const [busy, setBusy] = useState(true);
  const [tab, setTab] = useState("watching"); // watching | later

  const load = useCallback(async () => {
    setBusy(true);
    const [p, l] = await Promise.all([listProgress(userId), listLater(userId)]);
    setProgress(p);
    setLater(l);
    setBusy(false);
  }, [userId]);

  useEffect(() => {
    if (loading) return;
    load();
  }, [load, loading]);

  const onRemoveProgress = async (animeId) => {
    setProgress((prev) => prev.filter((x) => String(x.animeId) !== String(animeId)));
    await removeProgress(animeId, userId);
  };
  const onRemoveLater = async (animeId) => {
    setLater((prev) => prev.filter((x) => String(x.animeId) !== String(animeId)));
    await removeLater(animeId, userId);
  };

  const totalSaved = progress.length + later.length;
  const animeCount = useMemo(
    () => [...progress, ...later].filter((i) => !isMediaItem(i)).length,
    [progress, later]
  );
  const movieCount = useMemo(
    () => [...progress, ...later].filter((i) => isMediaItem(i)).length,
    [progress, later]
  );

  const activeItems = tab === "watching" ? progress : later;
  const initial = (displayName || "G").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 pb-20">
      <Helmet>
        <title>My Dashboard | OFFanime</title>
      </Helmet>

      {/* ===================== HERO BANNER ===================== */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-[#a855f7]/25 blur-[120px]" />
          <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-[#7c3aed]/20 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.08),transparent_60%)]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br from-[#a855f7] to-[#6d28d9] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-[#a855f7]/30">
                  {initial}
                </div>
                <span
                  className={`absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full border-2 border-[#050505] flex items-center justify-center text-[10px] font-bold ${
                    isAuthed ? "bg-emerald-500" : "bg-gray-500"
                  }`}
                  title={isAuthed ? "Synced" : "Guest"}
                >
                  {isAuthed ? (
                    <FontAwesomeIcon icon={faCloudArrowUp} className="text-white text-[10px]" />
                  ) : (
                    "G"
                  )}
                </span>
              </div>

              {/* Greeting + status */}
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.25em] text-[#c084fc] font-bold mb-1">
                  {isAuthed ? "Welcome back" : "Guest mode"}
                </p>
                <h1 className="text-3xl sm:text-4xl font-black leading-tight truncate">
                  {isAuthed ? displayName : "Your Library"}
                </h1>
                <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-2 flex-wrap">
                  {isAuthed ? (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="text-emerald-400" />
                      <span className="truncate">{email}</span>
                      <span className="text-gray-600">·</span>
                      <span className="text-emerald-400">Synced across your devices</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCircleExclamation} className="text-amber-400" />
                      Saved only on this device — log in to sync everywhere.
                    </>
                  )}
                </p>
              </div>

              {/* Action */}
              <div className="shrink-0">
                {isAuthed ? (
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 h-11 px-5 rounded-xl font-semibold text-gray-200 bg-white/10 border border-white/10 hover:bg-white/15 transition"
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    Log out
                  </button>
                ) : (
                  <button
                    onClick={() => openAuth("login")}
                    className="flex items-center gap-2 h-11 px-5 rounded-xl font-bold text-white bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] shadow-lg shadow-[#a855f7]/25 transition"
                  >
                    <FontAwesomeIcon icon={faRightToBracket} />
                    Log in to sync
                  </button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
              <StatChip icon={faLayerGroup} label="Total saved" value={totalSaved} />
              <StatChip icon={faClockRotateLeft} label="Watching" value={progress.length} />
              <StatChip icon={faTv} label="Anime" value={animeCount} accent="text-sky-300" />
              <StatChip icon={faFilm} label="Movies & TV" value={movieCount} accent="text-pink-300" />
            </div>
          </div>
        </div>
      </header>

      {/* ===================== COLLECTIONS ===================== */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        {/* Tab switcher */}
        <div className="inline-flex p-1 rounded-2xl bg-white/[0.04] border border-white/10 mb-7">
          <TabButton
            active={tab === "watching"}
            onClick={() => setTab("watching")}
            icon={faClockRotateLeft}
            label="Continue Watching"
            count={progress.length}
          />
          <TabButton
            active={tab === "later"}
            onClick={() => setTab("later")}
            icon={faBookmark}
            label="Watch Later"
            count={later.length}
          />
        </div>

        {busy ? (
          <div className="py-24 flex justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-[#a855f7] border-t-transparent animate-spin" />
          </div>
        ) : activeItems.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {activeItems.map((item) => (
              <Card
                key={item.animeId}
                item={item}
                badge={
                  tab === "watching"
                    ? `EP ${item.episode || 1}${item.total ? ` / ${item.total}` : ""}`
                    : "Saved"
                }
                onRemove={() =>
                  tab === "watching"
                    ? onRemoveProgress(item.animeId)
                    : onRemoveLater(item.animeId)
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ----------------------------- sub-components ----------------------------- */

function StatChip({ icon, label, value, accent = "text-[#c084fc]" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 flex items-center gap-3">
      <span className={`h-9 w-9 rounded-xl bg-white/[0.06] flex items-center justify-center ${accent}`}>
        <FontAwesomeIcon icon={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-black leading-none">{value}</p>
        <p className="text-[11px] text-gray-500 mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
        active
          ? "bg-white text-black shadow-lg"
          : "text-gray-300 hover:text-white hover:bg-white/5"
      }`}
    >
      <FontAwesomeIcon icon={icon} className={active ? "text-[#7c3aed]" : "text-[#c084fc]"} />
      <span>{label}</span>
      <span
        className={`text-xs rounded-full px-1.5 py-0.5 ${
          active ? "bg-black/10 text-black" : "bg-white/10 text-gray-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({ tab }) {
  const isWatching = tab === "watching";
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
      <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-white/[0.05] flex items-center justify-center text-[#c084fc] text-2xl">
        <FontAwesomeIcon icon={isWatching ? faClockRotateLeft : faBookmark} />
      </div>
      <h3 className="text-lg font-bold mb-1.5">
        {isWatching ? "Nothing in progress yet" : "Your watch-later list is empty"}
      </h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
        {isWatching
          ? "Start watching an anime or movie and it'll appear here so you can pick up right where you left off."
          : "Tap the bookmark on any anime or movie — on the info page or while watching — to save it for later."}
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition"
        >
          <FontAwesomeIcon icon={faTv} />
          Browse Anime
        </Link>
        <Link
          to="/movies"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white font-semibold hover:bg-white/15 transition"
        >
          <FontAwesomeIcon icon={faFilm} />
          Browse Movies
        </Link>
      </div>
    </div>
  );
}

function Card({ item, badge, onRemove }) {
  const to = watchHref(item);
  const media = isMediaItem(item);

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] hover:border-white/25 transition">
      <Link to={to} className="block">
        <div className="relative aspect-[2/3] bg-[#13131a]">
          {item.poster ? (
            <img
              src={item.poster}
              alt={item.title || "Title"}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <FontAwesomeIcon icon={faPlay} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

          {/* type tag */}
          <span
            className={`absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wide text-white rounded px-1.5 py-0.5 flex items-center gap-1 ${
              media ? "bg-pink-600/80" : "bg-sky-600/80"
            }`}
          >
            <FontAwesomeIcon icon={media ? faFilm : faTv} className="text-[8px]" />
            {media ? "Movie" : "Anime"}
          </span>

          {/* progress / saved badge */}
          <span className="absolute top-2 right-2 text-[10px] font-bold text-white bg-[#a855f7]/85 rounded px-1.5 py-0.5">
            {badge}
          </span>

          <span className="absolute bottom-2 left-2 right-2 text-sm font-semibold text-white line-clamp-2 drop-shadow">
            {item.title || "Untitled"}
          </span>

          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <span className="h-12 w-12 rounded-full bg-[#a855f7] flex items-center justify-center text-white shadow-lg shadow-[#a855f7]/40">
              <FontAwesomeIcon icon={faPlay} />
            </span>
          </span>
        </div>
      </Link>

      <button
        onClick={onRemove}
        aria-label="Remove"
        className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-black/70 backdrop-blur text-gray-300 hover:text-white hover:bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
      >
        <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
      </button>
    </div>
  );
}
