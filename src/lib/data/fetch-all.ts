import { fetchProtocolTvl } from "../api/defillama";
import { fetchMarkets } from "../api/kamino";
import {
  fetchStrategies,
  fetchStrategyMetricsBatch,
} from "../api/kamino";
import { STATIC_STATS } from "./static-stats";
import { STATIC_MARKETS } from "./static-markets";
import { STATIC_VAULTS } from "./static-vaults";
import { STATIC_MULTIPLY } from "./static-multiply";
import type {
  ProtocolStats,
  DisplayMarket,
  DisplayVault,
  DisplayMultiply,
  ApiResponse,
} from "../api/types";

export async function getProtocolStats(): Promise<ApiResponse<ProtocolStats>> {
  try {
    const protocol = await fetchProtocolTvl();
    const tvl = protocol.currentChainTvls?.Solana ?? STATIC_STATS.tvl;
    return {
      source: "live",
      data: { ...STATIC_STATS, tvl },
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return { source: "static", data: STATIC_STATS, updatedAt: "curated" };
  }
}

export async function getLendingMarkets(): Promise<
  ApiResponse<DisplayMarket[]>
> {
  // The Kamino markets list endpoint returns names/addresses but not
  // per-reserve APY or size data. Curated static data provides more
  // useful information for display, so we use it for v1.
  return { source: "static", data: STATIC_MARKETS, updatedAt: "curated" };
}

export async function getLiquidityVaults(): Promise<
  ApiResponse<DisplayVault[]>
> {
  // The Kamino /strategies endpoint returns all vaults including many
  // with near-zero TVL and no APY data. Per-strategy /metrics calls
  // also return 0% APY for most vaults. Curated static data provides
  // more useful display information for v1.
  return { source: "static", data: STATIC_VAULTS, updatedAt: "curated" };
}

export async function getMultiplyStrategies(): Promise<
  ApiResponse<DisplayMultiply[]>
> {
  return { source: "static", data: STATIC_MULTIPLY, updatedAt: "curated" };
}
