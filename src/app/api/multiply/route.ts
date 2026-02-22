import { NextResponse } from "next/server";
import { STATIC_MULTIPLY } from "@/lib/data/static-multiply";
import type { DisplayMultiply, ApiResponse } from "@/lib/api/types";

export const revalidate = 300;

export async function GET() {
  // Multiply strategies are derived from lending market data + eMode config.
  // For v1, we serve curated data since the REST API doesn't expose
  // a dedicated multiply endpoint with net APY calculations.
  return NextResponse.json<ApiResponse<DisplayMultiply[]>>({
    source: "static",
    data: STATIC_MULTIPLY,
    updatedAt: "curated",
  });
}
