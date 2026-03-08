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
  const from = params.get("from");
  const to = params.get("to");
  const sort = params.get("sort") ?? "date";
  const limit = Math.min(Number(params.get("limit") ?? 50), 200);
  const offset = Number(params.get("offset") ?? 0);

  const redis = getRedis();

  const fromScore: number | "-inf" = from
    ? new Date(from).getTime() / 1000
    : "-inf";
  const toScore: number | "+inf" = to
    ? new Date(to).getTime() / 1000
    : "+inf";

  let tweets: ArchivedTweet[] = [];

  if (handle) {
    // Single competitor
    const raw = await redis.zrange(
      `tweet-archive:${handle}`,
      fromScore,
      toScore,
      { byScore: true },
    );
    tweets = raw.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item,
    ) as ArchivedTweet[];
  } else {
    // All competitors - get all archive keys
    const keys = await redis.keys("tweet-archive:*");
    const handleKeys = keys.filter(
      (k) => k !== "tweet-archive:ids" && !k.startsWith("tweet-archive:ai-analysis:"),
    );

    for (const key of handleKeys) {
      const raw = await redis.zrange(key, fromScore, toScore, { byScore: true });
      const parsed = raw.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item,
      ) as ArchivedTweet[];
      tweets.push(...parsed);
    }
  }

  // Fetch AI analyses for these tweets
  if (tweets.length > 0) {
    const analysisKeys = tweets.map((t) => `tweet-archive:ai-analysis:${t.id}`);
    // Batch fetch in groups of 20
    for (let i = 0; i < analysisKeys.length; i += 20) {
      const batch = analysisKeys.slice(i, i + 20);
      const results = await redis.mget<(string | null)[]>(...batch);
      results.forEach((analysis, j) => {
        if (analysis) tweets[i + j].aiAnalysis = analysis;
      });
    }
  }

  // Sort
  if (sort === "engagement") {
    tweets.sort((a, b) => b.engagementRate - a.engagementRate);
  } else {
    tweets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  const total = tweets.length;
  const paginated = tweets.slice(offset, offset + limit);

  return NextResponse.json({ tweets: paginated, total, offset, limit });
}
