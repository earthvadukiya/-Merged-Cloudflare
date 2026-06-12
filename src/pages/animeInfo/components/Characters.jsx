export default function Characters({ data = [] }) {
  if (!data.length) return null;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-5">Characters</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((char, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={char.character?.image}
                alt={char.character?.name || "Character"}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
                loading="lazy"
              />
              <div className="min-w-0">
                <p className="font-semibold line-clamp-1">
                  {char.character?.name}
                </p>
                <p className="text-gray-400 text-sm line-clamp-1">
                  {char.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-right shrink-0">
              <div className="hidden sm:block">
                <p className="text-sm line-clamp-1">
                  {char.voiceActors?.[0]?.name || "Unknown"}
                </p>
                <p className="text-gray-400 text-xs">
                  Voice Actor
                </p>
              </div>

              {char.voiceActors?.[0]?.image && (
                <img
                  src={char.voiceActors?.[0]?.image}
                  alt={char.voiceActors?.[0]?.name || "Voice actor"}
                  className="w-10 h-10 rounded-lg object-cover"
                  loading="lazy"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
