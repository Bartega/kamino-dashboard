import { DEFILLAMA_API_BASE, FETCH_TIMEOUT_MS } from "../constants";
import type { DefiLlamaProtocol } from "./types";

export async function fetchProtocolBySlug(
  slug: string
): Promise<DefiLlamaProtocol> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${DEFILLAMA_API_BASE}/protocol/${slug}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}
