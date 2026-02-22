import { KAMINO_API_BASE, FETCH_TIMEOUT_MS } from "../constants";
import type {
  KaminoMarketResponse,
  KaminoStrategyResponse,
  StrategyMetricsResponse,
} from "./types";

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchMarkets(): Promise<KaminoMarketResponse[]> {
  const res = await fetchWithTimeout(`${KAMINO_API_BASE}/v2/kamino-market`);
  return res.json();
}

export async function fetchStrategies(): Promise<KaminoStrategyResponse[]> {
  const res = await fetchWithTimeout(
    `${KAMINO_API_BASE}/strategies?status=LIVE`
  );
  return res.json();
}

export async function fetchStrategyMetrics(
  address: string
): Promise<StrategyMetricsResponse> {
  const res = await fetchWithTimeout(
    `${KAMINO_API_BASE}/strategies/${address}/metrics`
  );
  return res.json();
}

export async function fetchStrategyMetricsBatch(
  addresses: string[],
  concurrency = 10
): Promise<StrategyMetricsResponse[]> {
  const results: StrategyMetricsResponse[] = [];
  for (let i = 0; i < addresses.length; i += concurrency) {
    const batch = addresses.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map((addr) => fetchStrategyMetrics(addr))
    );
    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }
  }
  return results;
}
