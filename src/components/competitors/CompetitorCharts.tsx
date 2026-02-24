"use client";

import type { CompetitorDataFile } from "@/lib/api/competitor-types";
import { TvlComparisonChart } from "./TvlComparisonChart";
import { EngagementChart } from "./EngagementChart";

export function CompetitorCharts({ data }: { data: CompetitorDataFile }) {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold text-foreground">Analytics</h2>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            TVL Comparison (30 days)
          </h3>
          <TvlComparisonChart data={data} />
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Tweet Engagement (last 5 tweets)
          </h3>
          <EngagementChart competitors={data.competitors} />
        </div>
      </div>
    </section>
  );
}
