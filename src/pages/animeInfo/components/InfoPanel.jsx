import {
  faCalendarDays,
  faClock,
  faClosedCaptioning,
  faSignal,
  faTv,
  faForward,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function InfoPanel({ anime, episodes = [] }) {
  const info = anime?.animeInfo || {};

  const status = info.Status || anime?.status;
  const year = info.Aired || anime?.year;
  const season =
    info.Premiered ||
    (anime?.season && anime?.year ? `${anime.season} ${anime.year}` : null);
  const type = info.Type || anime?.type;
  const duration =
    info.Duration || (anime?.duration ? `${anime.duration} min` : null);
  const totalEpisodes =
    episodes?.length ||
    info.Episodes ||
    anime?.episodes ||
    anime?.totalEpisodes ||
    null;

  const nextEpisode = getNextEpisodeInfo(anime);
  const studios = info.Studios || anime?.studios || [];

  const data = [
    { label: "Episodes", value: totalEpisodes, icon: faClosedCaptioning },
    { label: "Status", value: status, icon: faSignal },
    { label: "Type", value: type, icon: faTv },
    { label: "Duration", value: duration, icon: faClock },
    { label: "Season", value: season || year, icon: faCalendarDays },
  ].filter((item) => item.value);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        {data.map((item) => (
          <div key={item.label} className="min-w-[120px]">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <FontAwesomeIcon icon={item.icon} className="text-xs" />
              <p className="text-[10px] uppercase tracking-[0.16em]">
                {item.label}
              </p>
            </div>
            <p className="font-black text-sm text-white break-words">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {nextEpisode && (
        <div className="mt-5">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <FontAwesomeIcon icon={faForward} className="text-xs" />
            <p className="text-[10px] uppercase tracking-[0.16em]">
              Next Episode
            </p>
          </div>
          <p className="text-sm font-black text-white">{nextEpisode}</p>
        </div>
      )}

      {studios?.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400 mb-1">
            Studios
          </p>
          <p className="text-sm leading-relaxed text-white">
            {Array.isArray(studios) ? studios.join(", ") : studios}
          </p>
        </div>
      )}
    </div>
  );
}

function getNextEpisodeInfo(anime) {
  const next =
    anime?.nextAiringEpisode ||
    anime?.airingEpisode ||
    anime?.animeInfo?.nextAiringEpisode ||
    null;

  const episodeNumber = next?.episode || next?.number || null;

  if (episodeNumber && next?.airingAt) {
    return `EP ${episodeNumber} drops in ${formatCountdown(next.airingAt)}`;
  }

  if (episodeNumber) {
    return `EP ${episodeNumber} coming soon`;
  }

  if (/airing|releasing|currently/i.test(String(anime?.status || ""))) {
    return "Next episode date will update soon";
  }

  return "";
}

function formatCountdown(airingAt) {
  const now = Math.floor(Date.now() / 1000);
  const seconds = Number(airingAt) - now;

  if (!Number.isFinite(seconds) || seconds <= 0) return "soon";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}
