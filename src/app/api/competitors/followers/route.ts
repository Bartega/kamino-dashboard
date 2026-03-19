import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

function getRedis() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

interface FollowerSnapshot {
  followers: number;
  timestamp: string;
  displayName: string;
}

interface FollowerSeries {
  handle: string;
  displayName: string;
  snapshots: { timestamp: number; followers: number }[];
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const handle = params.get("handle");
  const days = Number(params.get("days") ?? 30);

  const redis = getRedis();
  const now = Math.floor(Date.now() / 1000);
  const fromScore = now - days * 86400;

  const series: FollowerSeries[] = [];

  if (handle) {
    // Single handle
    const key = `follower-snapshots:${handle}`;
    const raw = await redis.zrange(key, fromScore, "+inf", { byScore: true });
    const snapshots = raw.map((item) => {
      const parsed: FollowerSnapshot =
        typeof item === "string" ? JSON.parse(item) : item;
      return {
        timestamp: new Date(parsed.timestamp).getTime() / 1000,
        followers: parsed.followers,
      };
    });

    if (snapshots.length > 0) {
      const first: FollowerSnapshot =
        typeof raw[0] === "string" ? JSON.parse(raw[0]) : raw[0];
      series.push({
        handle,
        displayName: first.displayName,
        snapshots,
      });
    }
  } else {
    // All handles
    const keys = await redis.keys("follower-snapshots:*");

    for (const key of keys) {
      const raw = await redis.zrange(key, fromScore, "+inf", {
        byScore: true,
      });

      if (raw.length === 0) continue;

      const snapshots = raw.map((item) => {
        const parsed: FollowerSnapshot =
          typeof item === "string" ? JSON.parse(item) : item;
        return {
          timestamp: new Date(parsed.timestamp).getTime() / 1000,
          followers: parsed.followers,
        };
      });

      const first: FollowerSnapshot =
        typeof raw[0] === "string" ? JSON.parse(raw[0]) : raw[0];

      series.push({
        handle: key.replace("follower-snapshots:", ""),
        displayName: first.displayName,
        snapshots,
      });
    }
  }

  return NextResponse.json({ series });
}
