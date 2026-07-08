import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faDownload,
  faTriangleExclamation,
  faUpRightFromSquare,
  faShieldVirus,
} from "@fortawesome/free-solid-svg-icons";

import {
  getDownloadSources,
  buildDownloadUrl,
} from "@/src/utils/downloadSources.utils";

/**
 * Universal Download page (used by both the anime Watch page and the
 * Movies/TV pages). All context is passed via the query string so it has no
 * dependency on either section's data layer:
 *
 *   /download?title=...&kind=anime|movie&type=movie|tv
 *            &tmdb=...&imdb=...&season=...&episode=...&back=...
 *
 * We only deep-link to external sites — nothing is hosted or proxied here.
 */
export default function Download() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const title = params.get("title") || "this title";
  const kind = params.get("kind") === "movie" ? "movie" : "anime";
  const type = params.get("type") === "tv" ? "tv" : "movie";
  const tmdbId = params.get("tmdb") || "";
  const imdbId = params.get("imdb") || "";
  const season = params.get("season") || "1";
  const episode = params.get("episode") || "1";
  const back = params.get("back") || "";

  const sources = useMemo(() => getDownloadSources(kind), [kind]);

  const ctx = { tmdbId, imdbId, type, season, episode };

  const goBack = () => {
    if (back) navigate(back);
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back
        </button>

        <header className="mb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <FontAwesomeIcon icon={faDownload} className="text-lg" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                Download
              </h1>
              <p className="text-gray-400 text-sm mt-0.5 line-clamp-1">
                {title}
              </p>
            </div>
          </div>
        </header>

        {/* Disclaimer */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 mb-6">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="text-amber-400 mt-0.5 text-lg shrink-0"
            />
            <div className="text-sm text-amber-100/90 leading-relaxed">
              <p className="font-bold text-amber-200 mb-1">
                Please read before downloading
              </p>
              <p>
                The download sources below are{" "}
                <span className="font-semibold">third-party websites</span>. We
                only link to them &mdash; we do <span className="font-semibold">not</span>{" "}
                host, upload, or control any file. We are{" "}
                <span className="font-semibold">not responsible</span> for any
                viruses, malware, ads, or content you may encounter on those
                sites. Use a good ad-blocker and antivirus, and download at your
                own risk.
              </p>
            </div>
          </div>
        </div>

        {/* Sources list */}
        <div className="space-y-3">
          {sources.map((source) => {
            const url = buildDownloadUrl(source, title, ctx);
            return (
              <a
                key={source.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                data-allow-popup="true"
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition p-4"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white shrink-0">
                  <FontAwesomeIcon icon={faShieldVirus} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold truncate">{source.name}</p>
                    {source.recommended && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded px-1.5 py-0.5">
                        Recommended
                      </span>
                    )}
                    <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-white/10 rounded px-1.5 py-0.5">
                      {source.label || "Download"}
                    </span>
                  </div>
                </div>
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-200 group-hover:text-white shrink-0">
                  <span className="hidden sm:inline">Open</span>
                  <FontAwesomeIcon icon={faUpRightFromSquare} />
                </span>
              </a>
            );
          })}
        </div>

        <p className="text-xs text-gray-600 mt-6 text-center">
          Tip: most sites open a search for &ldquo;{title}&rdquo;. Pick the
          release / quality you want on their page.{" "}
          <Link to="/dmca" className="underline hover:text-gray-400">
            DMCA
          </Link>
        </p>
      </div>
    </div>
  );
}
