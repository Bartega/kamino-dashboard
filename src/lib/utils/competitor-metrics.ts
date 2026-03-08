import type { CompetitorTweet, TvlDataPoint } from "@/lib/api/competitor-types";

export function engagementRate(tweet: CompetitorTweet): number {
  if (!tweet.viewCount) return 0;
  return (
    (tweet.likeCount + tweet.bookmarkCount + tweet.retweetCount) /
    tweet.viewCount
  );
}

export function avgEngagementRate(tweets: CompetitorTweet[]): number {
  if (!tweets.length) return 0;
  const total = tweets.reduce((sum, t) => sum + engagementRate(t), 0);
  return total / tweets.length;
}

export function totalEngagement(tweets: CompetitorTweet[]): number {
  return tweets.reduce(
    (sum, t) => sum + t.likeCount + t.bookmarkCount + t.retweetCount,
    0,
  );
}

export function avgViews(tweets: CompetitorTweet[]): number {
  if (!tweets.length) return 0;
  return tweets.reduce((sum, t) => sum + t.viewCount, 0) / tweets.length;
}

export function tvlChange(
  history: TvlDataPoint[],
  days: number,
): { absolute: number; percentage: number } {
  if (history.length < 2) return { absolute: 0, percentage: 0 };
  const sorted = [...history].sort((a, b) => a.date - b.date);
  const latest = sorted[sorted.length - 1];
  const cutoff = latest.date - days * 86400;
  const earlier = sorted.find((p) => p.date >= cutoff) ?? sorted[0];
  if (!earlier.tvl) return { absolute: latest.tvl, percentage: 0 };
  return {
    absolute: latest.tvl - earlier.tvl,
    percentage: ((latest.tvl - earlier.tvl) / earlier.tvl) * 100,
  };
}

export function tweetFrequency(
  tweets: CompetitorTweet[],
): { tweetsPerDay: number; avgGapHours: number } {
  if (tweets.length < 2) return { tweetsPerDay: 0, avgGapHours: 0 };
  const times = tweets
    .map((t) => new Date(t.createdAt).getTime())
    .sort((a, b) => b - a);
  const spanMs = times[0] - times[times.length - 1];
  const spanDays = spanMs / 86_400_000 || 1;
  const gaps = times.slice(0, -1).map((t, i) => t - times[i + 1]);
  const avgGapMs = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  return {
    tweetsPerDay: tweets.length / spanDays,
    avgGapHours: avgGapMs / 3_600_000,
  };
}

export function metricRates(
  tweets: CompetitorTweet[],
): { likeRate: number; bookmarkRate: number; retweetRate: number } {
  const totalViews = tweets.reduce((s, t) => s + t.viewCount, 0);
  if (!totalViews) return { likeRate: 0, bookmarkRate: 0, retweetRate: 0 };
  return {
    likeRate:
      tweets.reduce((s, t) => s + t.likeCount, 0) / totalViews,
    bookmarkRate:
      tweets.reduce((s, t) => s + t.bookmarkCount, 0) / totalViews,
    retweetRate:
      tweets.reduce((s, t) => s + t.retweetCount, 0) / totalViews,
  };
}
