export default async function getServers() {
  return [
    { id: "megaplay-sub", name: "MegaPlay", provider: "megaplay", type: "sub" },
    { id: "megaplay-dub", name: "MegaPlay", provider: "megaplay", type: "dub" },
    { id: "animepahe-sub", name: "AnimePahe", provider: "animepahe", type: "sub" },
    { id: "animepahe-dub", name: "AnimePahe", provider: "animepahe", type: "dub" },
  ];
}
