const ANILIST_API = "https://graphql.anilist.co";

export default async function getMalId(anilistId) {
  try {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          idMal
          title {
            romaji
            english
          }
        }
      }
    `;

    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          id: Number(anilistId),
        },
      }),
    });

    const json = await response.json();

    return json?.data?.Media?.idMal || null;
  } catch (err) {
    console.log("Failed to get MAL ID:", err);

    return null;
  }
}
