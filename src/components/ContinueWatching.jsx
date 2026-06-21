import { Link } from "react-router-dom";

const ContinueWatching = () => {
  const data = JSON.parse(localStorage.getItem("continueWatching")) || [];

  if (!data.length) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Continue Watching</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {data.map(item => {
          const progress = (item.currentTime / item.duration) * 100;

          return (
            <Link
              key={item.id}
              to={`/watch/${item.id}?ep=${item.episode}`}
              className="group"
            >
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={item.poster}
                  className="w-full h-[180px] object-cover"
                />

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 w-full h-[4px] bg-black/50">
                  <div
                    className="h-full bg-white"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <p className="text-sm mt-2 line-clamp-2">
                {item.title}
              </p>

              <p className="text-xs text-gray-400">
                Episode {item.episode}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ContinueWatching;