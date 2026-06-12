import website_name from "@/src/config/website";

export const generateDescription = (text, maxLength = 155) => {
  if (!text) return `Watch anime online free on ${website_name}. Stream English subbed and dubbed anime with no ads.`;

  const cleanText = text.replace(/<[^>]*>/g, '');

  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.substring(0, maxLength - 3) + '...';
};

export const generateKeywords = (animeInfo) => {
  const baseKeywords = [website_name.toLowerCase(), 'anime', 'watch online', 'free anime', 'streaming'];

  if (!animeInfo) return baseKeywords.join(', ');

  const keywords = [...baseKeywords];

  if (animeInfo.title) {
    keywords.push(animeInfo.title.toLowerCase());
    keywords.push(animeInfo.title.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase());
  }

  if (animeInfo.japanese_title) {
    keywords.push(animeInfo.japanese_title);
  }

  if (animeInfo.animeInfo?.genres) {
    keywords.push(...animeInfo.animeInfo.genres.map(g => g.toLowerCase()));
  }

  if (animeInfo.animeInfo?.tvInfo?.showtype) {
    keywords.push(animeInfo.animeInfo.tvInfo.showtype.toLowerCase());
  }

  if (animeInfo.animeInfo?.tvInfo?.sub) {
    keywords.push('english sub', 'subbed');
  }
  if (animeInfo.animeInfo?.tvInfo?.dub) {
    keywords.push('english dub', 'dubbed');
  }

  return keywords.slice(0, 15).join(', ');
};

export const generateCanonicalUrl = (path) => {
  const baseUrl = 'https://offanime.cc';
  if (!path) return baseUrl;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const generateOGImage = (imageUrl, fallbackUrl = 'https://i.postimg.cc/kMYmHkPm/home.webp') => {
  if (!imageUrl) return fallbackUrl;

  if (imageUrl.startsWith('/')) {
    return `https://offanime.cc${imageUrl}`;
  }

  return imageUrl;
};

export const generateAnimeStructuredData = (animeInfo, episodeInfo = null) => {
  const baseData = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": animeInfo.title,
    "alternativeHeadline": animeInfo.japanese_title,
    "description": generateDescription(animeInfo.animeInfo?.overview),
    "image": generateOGImage(animeInfo.poster),
    "genre": animeInfo.animeInfo?.genres || [],
    "datePublished": animeInfo.animeInfo?.tvInfo?.aired,
    "contentRating": animeInfo.animeInfo?.tvInfo?.rating,
    "inLanguage": ["ja", "en"],
    "numberOfEpisodes": animeInfo.animeInfo?.tvInfo?.total_episodes,
    "actor": animeInfo.animeInfo?.voiceActors?.map(actor => ({
      "@type": "Person",
      "name": actor.name
    })) || []
  };

  if (animeInfo.animeInfo?.tvInfo?.status) {
    baseData.status = animeInfo.animeInfo.tvInfo.status;
  }

  if (animeInfo.animeInfo?.producers && animeInfo.animeInfo.producers.length > 0) {
    baseData.productionCompany = animeInfo.animeInfo.producers.map(producer => ({
      "@type": "Organization",
      "name": producer
    }));
  }

  if (episodeInfo) {
    baseData.episode = {
      "@type": "TVEpisode",
      "name": `Episode ${episodeInfo.number}`,
      "episodeNumber": episodeInfo.number,
      "url": generateCanonicalUrl(`/watch/${animeInfo.id}?ep=${episodeInfo.id}`)
    };
  }

  return baseData;
};

export const generateBreadcrumbStructuredData = (items) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url ? generateCanonicalUrl(item.url) : undefined
    }))
  };
};

export const generateWebsiteStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": website_name,
    "alternateName": ["offanime.cc", "Just Anime"],
    "url": "https://offanime.cc",
    "description": `${website_name} is a free anime streaming website where you can watch English Subbed and Dubbed Anime online.`,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://offanime.cc/search?keyword={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
};

export const generateVideoStructuredData = (animeInfo, episodeInfo, streamUrl) => {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": `${animeInfo.title} - Episode ${episodeInfo.number}`,
    "description": generateDescription(animeInfo.animeInfo?.overview),
    "thumbnailUrl": generateOGImage(animeInfo.poster),
    "uploadDate": new Date().toISOString(),
    "contentUrl": streamUrl || generateCanonicalUrl(`/watch/${animeInfo.id}?ep=${episodeInfo.id}`),
    "embedUrl": streamUrl || generateCanonicalUrl(`/watch/${animeInfo.id}?ep=${episodeInfo.id}`),
    "duration": "PT24M",
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": { "@type": "WatchAction" },
      "userInteractionCount": Math.floor(Math.random() * 50000) + 10000
    }
  };
};

export const generateOrganizationStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": website_name,
    "url": "https://offanime.fun",
    "logo": "https://offanime.fun/logo.png",
    "sameAs": [
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "offanimexyz@gmail.com",
      "contactType": "customer service"
    }
  };
};

export const generateAlternateLinks = (currentPath, languages = ['en', 'ja']) => {
  return languages.map(lang => ({
    rel: 'alternate',
    hreflang: lang,
    href: generateCanonicalUrl(currentPath)
  }));
};

// Clean and optimize title for SEO
export const optimizeTitle = (title, suffix = true) => {
  if (!title) return website_name;

  // Remove special characters that might cause issues
  const cleanTitle = title.replace(/[^\w\s\-:,.!?']/g, '').trim();

  if (suffix) {
    // Keep title under 60 characters total
    const suffixText = ` - ${website_name}`;
    const maxTitleLength = 60 - suffixText.length;

    if (cleanTitle.length > maxTitleLength) {
      return cleanTitle.substring(0, maxTitleLength - 3) + '...' + suffixText;
    }

    return cleanTitle + suffixText;
  }

  return cleanTitle.length > 60 ? cleanTitle.substring(0, 57) + '...' : cleanTitle;
};

// Profile-specific SEO functions
export const generateProfileTitle = (user, isLoggedIn = false) => {
  if (!isLoggedIn) {
    return optimizeTitle('Login to Your Profile | AniList Integration', false);
  }

  if (user?.name) {
    return optimizeTitle(`${user.name}'s Anime Profile`);
  }

  return optimizeTitle('Your Anime Profile');
};

export const generateProfileDescription = (user, isLoggedIn = false) => {
  if (!isLoggedIn) {
    return 'Connect your AniList account to sync your anime library, track watching progress, and manage your anime collection on ' + website_name + '.';
  }

  if (user?.name) {
    const stats = user.statistics?.anime;
    let description = `View ${user.name}'s anime profile and collection`;

    if (stats) {
      if (stats.count) description += ` with ${stats.count} anime entries`;
      if (stats.episodesWatched) description += ` and ${stats.episodesWatched} episodes watched`;
    }

    description += `. Sync with AniList on ${website_name}.`;
    return generateDescription(description);
  }

  return `Manage your anime collection, track watching progress, and sync with AniList on ${website_name}.`;
};

export const generateProfileKeywords = (user, isLoggedIn = false) => {
  const baseKeywords = [website_name.toLowerCase(), 'anime profile', 'anilist', 'anime collection', 'anime tracker'];

  if (!isLoggedIn) {
    return [...baseKeywords, 'anilist login', 'anime sync', 'watch list'].join(', ');
  }

  if (user?.name) {
    baseKeywords.push(user.name.toLowerCase(), 'anime statistics', 'watching progress');
  }

  return [...baseKeywords, 'anime library', 'completed anime', 'plan to watch'].slice(0, 12).join(', ');
};

export const generateProfileStructuredData = (user, isLoggedIn = false) => {
  if (!isLoggedIn) {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "AniList Profile Login",
      "description": "Connect your AniList account to track anime",
      "url": generateCanonicalUrl('/profile'),
      "mainEntity": {
        "@type": "SoftwareApplication",
        "name": "AniList Integration",
        "applicationCategory": "EntertainmentApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      }
    };
  }

  const profileData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "name": user?.name ? `${user.name}'s Anime Profile` : "Anime Profile",
    "url": generateCanonicalUrl('/profile'),
    "description": generateProfileDescription(user, isLoggedIn),
    "mainEntity": {
      "@type": "Person",
      "name": user?.name || "Anonymous User",
      "identifier": user?.id,
      "sameAs": user?.siteUrl ? [user.siteUrl] : []
    }
  };

  if (user?.avatar?.large) {
    profileData.mainEntity.image = user.avatar.large;
  }

  if (user?.statistics?.anime) {
    const stats = user.statistics.anime;
    profileData.mainEntity.interactionStatistic = [];

    if (stats.count) {
      profileData.mainEntity.interactionStatistic.push({
        "@type": "InteractionCounter",
        "interactionType": "CollectAction",
        "userInteractionCount": stats.count
      });
    }

    if (stats.episodesWatched) {
      profileData.mainEntity.interactionStatistic.push({
        "@type": "InteractionCounter",
        "interactionType": "WatchAction",
        "userInteractionCount": stats.episodesWatched
      });
    }
  }

  return profileData;
};

export const generateProfileBreadcrumbs = (user, isLoggedIn = false) => {
  const breadcrumbs = [
    { name: 'Home', url: '/' }
  ];

  if (!isLoggedIn) {
    breadcrumbs.push({ name: 'Profile Login', url: '/profile' });
  } else {
    breadcrumbs.push({
      name: user?.name ? `${user.name}'s Profile` : 'Profile',
      url: '/profile'
    });
  }

  return generateBreadcrumbStructuredData(breadcrumbs);
};

// Category/Collection page SEO functions
export const generateCategoryMeta = (categoryName, page = 1, description = null) => {
  const displayName = categoryName.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const title = optimizeTitle(`${displayName} Anime${page > 1 ? ` - Page ${page}` : ''}`);
  const desc = description ||
    `Browse and watch ${displayName.toLowerCase()} anime online free. Stream high-quality ${displayName.toLowerCase()} anime series and movies with English sub and dub on ${website_name}.`;

  const keywords = [
    `${displayName.toLowerCase()} anime`,
    `watch ${displayName.toLowerCase()}`,
    `${displayName.toLowerCase()} series`,
    `${displayName.toLowerCase()} streaming`,
    website_name.toLowerCase(),
    'anime online',
    'free anime'
  ].join(', ');

  return { title, description: generateDescription(desc), keywords };
};

export const generatePaginationLinks = (basePath, currentPage, totalPages) => {
  const links = [];

  if (currentPage > 1) {
    const prevPage = currentPage - 1;
    links.push({
      rel: 'prev',
      href: prevPage === 1
        ? generateCanonicalUrl(basePath)
        : generateCanonicalUrl(`${basePath}?page=${prevPage}`)
    });
  }

  if (currentPage < totalPages) {
    links.push({
      rel: 'next',
      href: generateCanonicalUrl(`${basePath}?page=${currentPage + 1}`)
    });
  }

  return links;
};

export const generateCollectionSchema = (items, collectionName, basePath) => {
  if (!items || items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${collectionName} Anime Collection`,
    "description": `Browse ${collectionName.toLowerCase()} anime series and movies`,
    "url": generateCanonicalUrl(basePath),
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": generateCanonicalUrl('/')
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": collectionName
        }
      ]
    },
    "numberOfItems": items.length
  };
};

export const generateItemListSchema = (items, listName, baseUrl = '') => {
  if (!items || items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "numberOfItems": items.length,
    "itemListElement": items.slice(0, 20).map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "TVSeries",
        "name": item.title || item.name || item.animeTitle,
        "url": generateCanonicalUrl(`/${item.id || item.animeId}`),
        "image": item.poster || item.image
      }
    }))
  };
};

export const generateFAQSchema = (faqs) => {
  if (!faqs || faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

export const generateAggregateRating = (score, ratingCount = null) => {
  if (!score) return null;

  // Parse score (could be "8.5/10" or just "8.5")
  const numericScore = parseFloat(score.toString().split('/')[0]);

  if (isNaN(numericScore)) return null;

  return {
    "@type": "AggregateRating",
    "ratingValue": numericScore.toFixed(1),
    "ratingCount": ratingCount || Math.floor(Math.random() * 5000) + 1000,
    "bestRating": "10",
    "worstRating": "1"
  };
};

export const generateOfferSchema = (price = 0) => {
  return {
    "@type": "Offer",
    "price": price.toString(),
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": generateCanonicalUrl('/')
  };
};

// A-Z List specific SEO
export const generateAZListMeta = (letter, page = 1) => {
  const displayLetter = letter === 'az-list' ? 'All' :
    letter === 'other' ? '#' :
      letter === '0-9' ? '0-9' :
        letter.toUpperCase();

  const title = optimizeTitle(`Anime Starting with ${displayLetter}${page > 1 ? ` - Page ${page}` : ''}`);
  const description = generateDescription(
    `Browse anime titles starting with ${displayLetter}. Complete alphabetical directory of anime series and movies on ${website_name}.`
  );
  const keywords = `anime ${letter}, anime list ${displayLetter}, alphabetical anime, anime directory, ${website_name.toLowerCase()}`;

  return { title, description, keywords };
};

// Search page SEO
export const generateSearchMeta = (query) => {
  const title = query
    ? optimizeTitle(`Search: ${query}`)
    : optimizeTitle('Search Anime');

  const description = query
    ? generateDescription(`Search results for "${query}". Find anime series, movies and more on ${website_name}.`)
    : generateDescription(`Search thousands of anime titles on ${website_name}. Find your favorite anime series and movies.`);

  const keywords = query
    ? `search anime, find ${query}, anime search, ${query} anime, ${website_name.toLowerCase()}`
    : `search anime, find anime, anime search, ${website_name.toLowerCase()}`;

  return { title, description, keywords };
};

// Music page dynamic SEO
export const generateMusicMeta = (animeName = null, themes = []) => {
  if (animeName) {
    const title = optimizeTitle(`${animeName} - Anime Music & Themes`);
    const description = generateDescription(
      `Listen to opening and ending themes from ${animeName}. ${themes.length > 0 ? `${themes.length} tracks available.` : ''} High quality anime music streaming on ${website_name}.`
    );
    const keywords = `${animeName.toLowerCase()} music, ${animeName.toLowerCase()} opening, ${animeName.toLowerCase()} ending, anime soundtrack, ${website_name.toLowerCase()}`;

    return { title, description, keywords };
  }

  return {
    title: optimizeTitle('Anime Music & Themes'),
    description: generateDescription('Listen to your favorite anime opening and ending themes. High quality anime music streaming with comprehensive database.'),
    keywords: 'anime music, anime themes, opening songs, ending songs, anime soundtrack, op, ed'
  };
};

export const generateMusicPlaylistSchema = (animeName, themes = []) => {
  if (!animeName || themes.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "MusicPlaylist",
    "name": `${animeName} - Anime Themes`,
    "description": `Opening and ending themes from ${animeName}`,
    "numTracks": themes.length,
    "genre": "Anime Music",
    "track": themes.slice(0, 10).map((theme, index) => ({
      "@type": "MusicRecording",
      "position": index + 1,
      "name": theme.name || `Theme ${index + 1}`,
      "byArtist": theme.artist ? {
        "@type": "Person",
        "name": theme.artist
      } : undefined
    }))
  };
};
