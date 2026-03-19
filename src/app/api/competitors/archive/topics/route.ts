import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import type { ArchivedTweet } from "@/lib/api/competitor-types";

function getRedis() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

interface CategoryAgg {
  name: string;
  count: number;
  avgEngagement: number;
}

interface HandleBreakdown {
  handle: string;
  displayName: string;
  breakdown: { category: string; count: number }[];
}

const VALID_CATEGORIES = new Set([
  "tvl-milestone",
  "new-feature",
  "partnership",
  "education",
  "meme-culture",
  "thread-explainer",
  "promotion",
  "community",
  "market-commentary",
  "other",
]);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const handle = params.get("handle");
  const days = Number(params.get("days") ?? 30);

  const redis = getRedis();

  const now = Math.floor(Date.now() / 1000);
  const fromScore = now - days * 86400;
  const toScore = now;

  let tweets: ArchivedTweet[] = [];

  if (handle) {
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
    const keys = await redis.keys("tweet-archive:*");
    const handleKeys = keys.filter(
      (k) =>
        k !== "tweet-archive:ids" &&
        !k.startsWith("tweet-archive:ai-analysis:"),
    );

    for (const key of handleKeys) {
      const raw = await redis.zrange(key, fromScore, toScore, {
        byScore: true,
      });
      const parsed = raw.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item,
      ) as ArchivedTweet[];
      tweets.push(...parsed);
    }
  }

  // Keep only tweets with a valid category
  const classified = tweets.filter(
    (t) => t.category && VALID_CATEGORIES.has(t.category),
  );

  // Aggregate by category
  const categoryMap = new Map<
    string,
    { count: number; totalEngagement: number }
  >();

  for (const t of classified) {
    const cat = t.category!;
    const existing = categoryMap.get(cat) ?? { count: 0, totalEngagement: 0 };
    existing.count += 1;
    existing.totalEngagement += t.engagementRate;
    categoryMap.set(cat, existing);
  }

  const categories: CategoryAgg[] = Array.from(categoryMap.entries())
    .map(([name, { count, totalEngagement }]) => ({
      name,
      count,
      avgEngagement: count > 0 ? totalEngagement / count : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Aggregate by handle
  const handleMap = new Map<
    string,
    { displayName: string; cats: Map<string, number> }
  >();

  for (const t of classified) {
    const h = t.twitterHandle;
    const existing = handleMap.get(h) ?? {
      displayName: t.displayName,
      cats: new Map<string, number>(),
    };
    const catCount = existing.cats.get(t.category!) ?? 0;
    existing.cats.set(t.category!, catCount + 1);
    handleMap.set(h, existing);
  }

  const byHandle: HandleBreakdown[] = Array.from(handleMap.entries()).map(
    ([h, { displayName, cats }]) => ({
      handle: h,
      displayName,
      breakdown: Array.from(cats.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
    }),
  );

  return NextResponse.json({
    categories,
    byHandle,
    totalClassified: classified.length,
  });
}
