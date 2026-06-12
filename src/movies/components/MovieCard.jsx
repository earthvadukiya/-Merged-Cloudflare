/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faStar } from "@fortawesome/free-solid-svg-icons";

export default function MovieCard({ item, priority = false }) {
  const { id, type, title, poster, year, rating } = item;
  // Clicking a card opens the INFO page first (user then taps "Watch Now").
  const infoPath = `/movies/${type}/${id}`;

  return (
    <div className="group relative">
      <Link to={infoPath} draggable={false} className="block relative w-full pb-[140%] rounded-lg overflow-hidden bg-[#1a1a22]">
        {poster ? (
          <img
            src={poster}
            alt={title}
            loading={priority ? "eager" : "lazy"}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#ffffff40] text-xs">
            No image
          </div>
        )}

        {/* hover "more info" overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="w-12 h-12 rounded-full bg-[#a855f7] flex items-center justify-center text-white text-lg shadow-lg">
            <FontAwesomeIcon icon={faCircleInfo} />
          </span>
        </div>

        {/* rating badge */}
        {rating && (
          <span className="absolute top-2 left-2 flex items-center gap-x-1 bg-black/70 backdrop-blur-sm text-[11px] font-semibold px-1.5 py-0.5 rounded text-white">
            <FontAwesomeIcon icon={faStar} className="text-[#fbbf24] text-[10px]" />
            {rating}
          </span>
        )}

        {/* type badge */}
        <span className="absolute top-2 right-2 bg-[#a855f7] text-[10px] font-bold uppercase px-1.5 py-0.5 rounded text-white">
          {type === "tv" ? "TV" : "Movie"}
        </span>
      </Link>

      <div className="mt-2">
        <Link
          to={infoPath}
          className="block text-[13px] font-medium text-white line-clamp-1 hover:text-[#a855f7] transition-colors"
          title={title}
        >
          {title}
        </Link>
        {year && <p className="text-[11px] text-[#ffffff80] mt-0.5">{year}</p>}
      </div>
    </div>
  );
}
