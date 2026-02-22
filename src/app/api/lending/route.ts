import { NextResponse } from "next/server";
import { fetchMarkets } from "@/lib/api/kamino";
import { STATIC_MARKETS } from "@/lib/data/static-markets";
import type { DisplayMarket, ApiResponse } from "@/lib/api/types";

export const revalidate = 300;

export async function GET() {
  try {
    const markets = await fetchMarkets();

    const displayMarkets: DisplayMarket[] = markets.map((m) => ({
      name: m.name || "Unknown Market",
      collateral: m.description || "-",
      borrowApy: 0,
      marketSize: 0,
      address: m.lendingMarket,
    }));

    if (displayMarkets.length === 0) throw new Error("No markets returned");

    return NextResponse.json<ApiResponse<DisplayMarket[]>>({
      source: "live",
      data: displayMarkets,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json<ApiResponse<DisplayMarket[]>>({
      source: "static",
      data: STATIC_MARKETS,
      updatedAt: "curated",
    });
  }
}
