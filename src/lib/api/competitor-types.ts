// --- Competitor config (stored in Vercel KV) ---

export interface CompetitorConfig {
  twitterHandle: string;
  displayName: string;
  defiLlamaSlug: string;
  addedAt: string;
}

// --- Apify tweet scraper output ---

export interface ApifyTweet {
  id: string;
  fullText: string;
  createdAt: string;
  twitterUrl: string;
  likeCount: number;
  bookmarkCount: number;
  retweetCount: number;
  replyCount: number;
  viewCount: number;
  media?: string[];
  entities?: {
    media?: { media_url_https: string; type: string }[];
  };
  extendedEntities?: {
    media?: { media_url_https: string; type: string }[];
  };
  author: {
    name: string;
    userName: string;
    profilePicture: string;
  };
}

// --- Processed competitor data (competitor-data.json) ---

export interface CompetitorTweet {
  id: string;
  fullText: string;
  createdAt: string;
  twitterUrl: string;
  likeCount: number;
  bookmarkCount: number;
  retweetCount: number;
  replyCount: number;
  viewCount: number;
  thumbnailUrl?: string;
}

export interface TvlDataPoint {
  date: number;
  tvl: number;
}

export interface CompetitorData {
  twitterHandle: string;
  displayName: string;
  defiLlamaSlug: string;
  profilePicture: string;
  tvl: number;
  tvlHistory: TvlDataPoint[];
  aiSummary: string;
  tweets: CompetitorTweet[];
}

export interface MostLikedHighlight {
  twitterHandle: string;
  tweetIndex: number;
  likeCount: number;
}

export interface MostBookmarkedHighlight {
  twitterHandle: string;
  tweetIndex: number;
  bookmarkCount: number;
}

export interface MostInterestingHighlight {
  twitterHandle: string;
  tweetIndex: number;
  reason: string;
}

export interface CompetitorHighlights {
  mostLiked: MostLikedHighlight;
  mostBookmarked: MostBookmarkedHighlight;
  mostInteresting: MostInterestingHighlight;
}

export interface CompetitorDataFile {
  timestamp: string;
  version: number;
  kaminoTvl: number;
  kaminoTvlHistory: TvlDataPoint[];
  competitors: CompetitorData[];
  highlights: CompetitorHighlights;
}
