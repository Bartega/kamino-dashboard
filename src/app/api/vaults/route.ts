import { NextResponse } from "next/server";
import { fetchStrategies, fetchStrategyMetricsBatch } from "@/lib/api/kamino";
import { STATIC_VAULTS } from "@/lib/data/static-vaults";
import type { DisplayVault, ApiResponse } from "@/lib/api/types";

export const revalidate = 300;

export async function GET() {
  try {
    const strategies = await fetchStrategies();
    const liveStrategies = strategies
      .filter((s) => s.status === "LIVE")
      .slice(0, 30);

    if (liveStrategies.length === 0) throw new Error("No strategies returned");

    const addresses = liveStrategies.map((s) => s.address);
    const metrics = await fetchStrategyMetricsBatch(addresses);

    const displayVaults: DisplayVault[] = metrics
      .map((m) => ({
        name: `${m.tokenA || "?"}-${m.tokenB || "?"}`,
        tokenA: m.tokenA || "?",
        tokenB: m.tokenB || "?",
        type: "Live",
        apy7d: (m.kaminoApy?.vault?.apy7d ?? m.apy?.vault?.totalApy ?? 0) * 100,
        apy30d: (m.kaminoApy?.vault?.apy30d ?? 0) * 100,
        tvl: m.totalValueLocked ?? 0,
        rewards: [],
        address: m.strategy,
      }))
      .filter((v) => v.tvl > 0)
      .sort((a, b) => b.apy7d - a.apy7d)
      .slice(0, 20);

    if (displayVaults.length === 0) throw new Error("No vault metrics");

    return NextResponse.json<ApiResponse<DisplayVault[]>>({
      source: "live",
      data: displayVaults,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json<ApiResponse<DisplayVault[]>>({
      source: "static",
      data: STATIC_VAULTS,
      updatedAt: "curated",
    });
  }
}
