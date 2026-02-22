import { NextResponse } from "next/server";
import { fetchProtocolTvl } from "@/lib/api/defillama";
import { STATIC_STATS } from "@/lib/data/static-stats";
import type { ProtocolStats, ApiResponse } from "@/lib/api/types";

export const revalidate = 300;

export async function GET() {
  try {
    const protocol = await fetchProtocolTvl();
    const tvl = protocol.currentChainTvls?.Solana ?? STATIC_STATS.tvl;

    const stats: ProtocolStats = {
      tvl,
      totalDeposits: STATIC_STATS.totalDeposits,
      loansIssued: STATIC_STATS.loansIssued,
      activeMarkets: STATIC_STATS.activeMarkets,
      audits: STATIC_STATS.audits,
      badDebt: STATIC_STATS.badDebt,
    };

    return NextResponse.json<ApiResponse<ProtocolStats>>({
      source: "live",
      data: stats,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json<ApiResponse<ProtocolStats>>({
      source: "static",
      data: STATIC_STATS,
      updatedAt: "curated",
    });
  }
}
