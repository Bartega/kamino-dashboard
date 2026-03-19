import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

function getRedis() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

export async function GET() {
  try {
    const redis = getRedis();
    const dates = await redis.zrange("daily-digest:dates", 0, -1, {
      rev: true,
    });

    return NextResponse.json({ dates: dates as string[] });
  } catch (error) {
    console.error("Failed to fetch digest dates:", error);
    return NextResponse.json(
      { error: "Failed to fetch digest dates" },
      { status: 500 },
    );
  }
}
