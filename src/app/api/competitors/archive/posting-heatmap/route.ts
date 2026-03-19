import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import type { ArchivedTweet } from "@/lib/api/competitor-types";

function getRedis() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const handle = params.get("handle");

  const redis = getRedis();

  let tweets: ArchivedTweet[] = [];

  if (handle) {
    const raw = await redis.zrange(
      `tweet-archive:${handle}`,
      "-inf",
      "+inf",
      { byScore: true },
    );
    tweets = raw.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item,
    ) as ArchivedTweet[];
  } else {
    const keys = await redis.keys("tweet-archive:*");
    const handleKeys = keys.filter(
      (k) =>
        k !== "tweet-archive:ids" &&
        !k.startsWith("tweet-archive:ai-analysis:"),
    );

    for (const key of handleKeys) {
      const raw = await redis.zrange(key, "-inf", "+inf", { byScore: true });
      const parsed = raw.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item,
      ) as ArchivedTweet[];
      tweets.push(...parsed);
    }
  }

  // Build 7x24 matrices (0=Mon ... 6=Sun, hours 0-23 UTC)
  const frequency: number[][] = Array.from({ length: 7 }, () =>
    Array(24).fill(0),
  );
  const engagementSum: number[][] = Array.from({ length: 7 }, () =>
    Array(24).fill(0),
  );
  const engagementCount: number[][] = Array.from({ length: 7 }, () =>
    Array(24).fill(0),
  );

  for (const tweet of tweets) {
    const date = new Date(tweet.createdAt);
    if (isNaN(date.getTime())) continue;

    const jsDay = date.getUTCDay(); // 0=Sun, 1=Mon, ...
    const day = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon, ..., 6=Sun
    const hour = date.getUTCHours();

    frequency[day][hour]++;
    engagementSum[day][hour] += tweet.engagementRate ?? 0;
    engagementCount[day][hour]++;
  }

  // Compute average engagement per cell
  const avgEngagement: number[][] = Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 24 }, (_, h) =>
      engagementCount[d][h] > 0
        ? engagementSum[d][h] / engagementCount[d][h]
        : 0,
    ),
  );

  return NextResponse.json({
    frequency,
    avgEngagement,
    tweetCount: tweets.length,
  });
}
