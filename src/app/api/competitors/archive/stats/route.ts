import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import type { ArchivedTweet, ArchiveStats } from "@/lib/api/competitor-types";

function getRedis() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

export async function GET() {
  const redis = getRedis();

  const allIds = await redis.scard("tweet-archive:ids");
  const keys = await redis.keys("tweet-archive:*");
  const handleKeys = keys.filter(
    (k) => k !== "tweet-archive:ids" && !k.startsWith("tweet-archive:ai-analysis:"),
  );

  let earliest: string | null = null;
  let latest: string | null = null;
  let topByVolume: { handle: string; count: number } | null = null;
  let topByEngagement: { handle: string; avgRate: number } | null = null;

  for (const key of handleKeys) {
    const handle = key.replace("tweet-archive:", "");
    const count = await redis.zcard(key);

    if (!topByVolume || count > topByVolume.count) {
      topByVolume = { handle, count };
    }

    // Get oldest and newest tweets
    const oldestRaw = await redis.zrange(key, 0, 0);
    const newestRaw = await redis.zrange(key, -1, -1);

    if (oldestRaw.length) {
      const oldestTweet = (
        typeof oldestRaw[0] === "string" ? JSON.parse(oldestRaw[0]) : oldestRaw[0]
      ) as ArchivedTweet;
      if (!earliest || oldestTweet.createdAt < earliest) {
        earliest = oldestTweet.createdAt;
      }
    }

    if (newestRaw.length) {
      const newestTweet = (
        typeof newestRaw[0] === "string" ? JSON.parse(newestRaw[0]) : newestRaw[0]
      ) as ArchivedTweet;
      if (!latest || newestTweet.createdAt > latest) {
        latest = newestTweet.createdAt;
      }
    }

    // Compute avg engagement rate for this handle
    const allTweetsRaw = await redis.zrange(key, 0, -1);
    if (allTweetsRaw.length > 0) {
      const tweets = allTweetsRaw.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item,
      ) as ArchivedTweet[];
      const avgRate =
        tweets.reduce((sum, t) => sum + t.engagementRate, 0) / tweets.length;
      if (!topByEngagement || avgRate > topByEngagement.avgRate) {
        topByEngagement = { handle, avgRate: +avgRate.toFixed(2) };
      }
    }
  }

  const stats: ArchiveStats = {
    totalTweets: allIds ?? 0,
    earliestDate: earliest,
    latestDate: latest,
    competitorCount: handleKeys.length,
    topByVolume,
    topByEngagement,
  };

  return NextResponse.json(stats);
}
