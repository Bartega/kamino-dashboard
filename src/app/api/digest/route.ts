import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

function getRedis() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const date =
    params.get("date") ?? new Date().toISOString().split("T")[0];

  try {
    const redis = getRedis();
    const raw = await redis.get(`daily-digest:${date}`);

    if (!raw) {
      return NextResponse.json({ digest: null });
    }

    const digest = typeof raw === "string" ? JSON.parse(raw) : raw;

    return NextResponse.json({ digest });
  } catch (error) {
    console.error("Failed to fetch digest:", error);
    return NextResponse.json(
      { error: "Failed to fetch digest" },
      { status: 500 },
    );
  }
}
