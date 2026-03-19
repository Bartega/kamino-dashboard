import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import type { ArchivedTweet } from "@/lib/api/competitor-types";

function getRedis() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

interface HandleSnapshot {
  handle: string;
  displayName: string;
  tweetCount: number;
  totalEngagement: number;
}

interface TimeSeriesEntry {
  date: string;
  [handle: string]: string | number;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const days = Math.min(Number(params.get("days") ?? 14), 90);

  const redis = getRedis();

  const nowSeconds = Math.floor(Date.now() / 1000);
  const fromScore = nowSeconds - days * 86400;

  // Get all archive keys, filtering out non-handle keys
  const keys = await redis.keys("tweet-archive:*");
  const handleKeys = keys.filter(
    (k) =>
      k !== "tweet-archive:ids" &&
      !k.startsWith("tweet-archive:ai-analysis:"),
  );

  const allTweets: ArchivedTweet[] = [];

  for (const key of handleKeys) {
    const raw = await redis.zrange(key, fromScore, "+inf", {
      byScore: true,
    });
    const parsed = raw.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item,
    ) as ArchivedTweet[];
    allTweets.push(...parsed);
  }

  if (allTweets.length === 0) {
    return NextResponse.json({
      snapshot: [],
      volumeTimeSeries: [],
      engagementTimeSeries: [],
    });
  }

  // --- Snapshot: per-handle aggregation ---
  const handleMap = new Map<
    string,
    { displayName: string; tweetCount: number; totalEngagement: number }
  >();

  for (const tweet of allTweets) {
    const handle = tweet.twitterHandle;
    const engagement =
      (tweet.likeCount ?? 0) +
      (tweet.bookmarkCount ?? 0) +
      (tweet.retweetCount ?? 0);

    const existing = handleMap.get(handle);
    if (existing) {
      existing.tweetCount += 1;
      existing.totalEngagement += engagement;
    } else {
      handleMap.set(handle, {
        displayName: tweet.displayName,
        tweetCount: 1,
        totalEngagement: engagement,
      });
    }
  }

  const snapshot: HandleSnapshot[] = Array.from(handleMap.entries())
    .map(([handle, data]) => ({
      handle,
      displayName: data.displayName,
      tweetCount: data.tweetCount,
      totalEngagement: data.totalEngagement,
    }))
    .sort((a, b) => b.totalEngagement - a.totalEngagement);

  // --- Time series: bucket by date ---
  const handles = Array.from(handleMap.keys());

  const volumeByDate = new Map<string, Record<string, number>>();
  const engagementByDate = new Map<string, Record<string, number>>();

  for (const tweet of allTweets) {
    const date = new Date(tweet.createdAt).toISOString().slice(0, 10);
    const handle = tweet.twitterHandle;
    const engagement =
      (tweet.likeCount ?? 0) +
      (tweet.bookmarkCount ?? 0) +
      (tweet.retweetCount ?? 0);

    // Volume
    if (!volumeByDate.has(date)) {
      volumeByDate.set(date, {});
    }
    const vol = volumeByDate.get(date)!;
    vol[handle] = (vol[handle] ?? 0) + 1;

    // Engagement
    if (!engagementByDate.has(date)) {
      engagementByDate.set(date, {});
    }
    const eng = engagementByDate.get(date)!;
    eng[handle] = (eng[handle] ?? 0) + engagement;
  }

  const sortedDates = Array.from(
    new Set([...volumeByDate.keys(), ...engagementByDate.keys()]),
  ).sort();

  const volumeTimeSeries: TimeSeriesEntry[] = sortedDates.map((date) => {
    const entry: TimeSeriesEntry = { date };
    const vol = volumeByDate.get(date) ?? {};
    for (const handle of handles) {
      entry[handle] = vol[handle] ?? 0;
    }
    return entry;
  });

  const engagementTimeSeries: TimeSeriesEntry[] = sortedDates.map((date) => {
    const entry: TimeSeriesEntry = { date };
    const eng = engagementByDate.get(date) ?? {};
    for (const handle of handles) {
      entry[handle] = eng[handle] ?? 0;
    }
    return entry;
  });

  return NextResponse.json({
    snapshot,
    volumeTimeSeries,
    engagementTimeSeries,
  });
}
