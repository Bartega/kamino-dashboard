import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import type { ArchivedTweet } from "@/lib/api/competitor-types";

function getRedis() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

export async function GET() {
  const redis = getRedis();

  const nowSeconds = Math.floor(Date.now() / 1000);
  const oneWeekAgo = nowSeconds - 7 * 86400;
  const twoWeeksAgo = nowSeconds - 14 * 86400;

  const keys = await redis.keys("tweet-archive:*");
  const handleKeys = keys.filter(
    (k) =>
      k !== "tweet-archive:ids" &&
      !k.startsWith("tweet-archive:ai-analysis:"),
  );

  const thisWeek: ArchivedTweet[] = [];
  const lastWeek: ArchivedTweet[] = [];

  for (const key of handleKeys) {
    const thisWeekRaw = await redis.zrange(key, oneWeekAgo, "+inf", {
      byScore: true,
    });
    thisWeek.push(
      ...thisWeekRaw.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item,
      ),
    );

    const lastWeekRaw = await redis.zrange(key, twoWeeksAgo, oneWeekAgo, {
      byScore: true,
    });
    lastWeek.push(
      ...lastWeekRaw.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item,
      ),
    );
  }

  function aggregate(tweets: ArchivedTweet[]) {
    const map = new Map<string, { displayName: string; engagement: number }>();
    for (const t of tweets) {
      const eng =
        (t.likeCount ?? 0) + (t.bookmarkCount ?? 0) + (t.retweetCount ?? 0);
      const existing = map.get(t.twitterHandle);
      if (existing) {
        existing.engagement += eng;
      } else {
        map.set(t.twitterHandle, {
          displayName: t.displayName,
          engagement: eng,
        });
      }
    }
    return map;
  }

  const thisWeekMap = aggregate(thisWeek);
  const lastWeekMap = aggregate(lastWeek);

  const allHandles = new Set([
    ...thisWeekMap.keys(),
    ...lastWeekMap.keys(),
  ]);

  const series = Array.from(allHandles).map((handle) => {
    const current = thisWeekMap.get(handle)?.engagement ?? 0;
    const previous = lastWeekMap.get(handle)?.engagement ?? 0;
    const displayName =
      thisWeekMap.get(handle)?.displayName ??
      lastWeekMap.get(handle)?.displayName ??
      handle;
    const changePercent =
      previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

    return { handle, displayName, current, previous, changePercent };
  });

  series.sort((a, b) => b.changePercent - a.changePercent);

  return NextResponse.json({ series });
}
