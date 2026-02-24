import { Redis } from "@upstash/redis";
import type { CompetitorConfig } from "../api/competitor-types";

const KV_KEY = "competitors";

function getRedis() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

export async function getCompetitors(): Promise<CompetitorConfig[]> {
  const redis = getRedis();
  const data = await redis.get<CompetitorConfig[]>(KV_KEY);
  return data ?? [];
}

export async function addCompetitor(
  config: CompetitorConfig
): Promise<CompetitorConfig[]> {
  const competitors = await getCompetitors();
  const exists = competitors.some(
    (c) => c.twitterHandle === config.twitterHandle
  );
  if (exists) return competitors;

  competitors.push(config);
  const redis = getRedis();
  await redis.set(KV_KEY, competitors);
  return competitors;
}

export async function removeCompetitor(
  handle: string
): Promise<CompetitorConfig[]> {
  const competitors = await getCompetitors();
  const filtered = competitors.filter((c) => c.twitterHandle !== handle);
  const redis = getRedis();
  await redis.set(KV_KEY, filtered);
  return filtered;
}
