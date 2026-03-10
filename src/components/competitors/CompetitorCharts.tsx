"use client";

import type { CompetitorDataFile } from "@/lib/api/competitor-types";
import { TvlComparisonChart } from "./TvlComparisonChart";
import { EngagementChart } from "./EngagementChart";
import { TvlMomentumChart } from "./TvlMomentumChart";
import { EngagementRateChart } from "./EngagementRateChart";
import { TweetVelocityChart } from "./TweetVelocityChart";
import { ContentHeatmap } from "./ContentHeatmap";
import { TvlSocialQuadrant } from "./TvlSocialQuadrant";
import { TopTweetsTable } from "./TopTweetsTable";

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

export function CompetitorCharts({ data }: { data: CompetitorDataFile }) {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold text-foreground">Analytics</h2>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Content Performance Heatmap">
          <ContentHeatmap competitors={data.competitors} />
        </ChartCard>

        <ChartCard title="Top 10 Tweets by Engagement Rate">
          <TopTweetsTable competitors={data.competitors} />
        </ChartCard>

        <ChartCard title="TVL Comparison (30 days)">
          <TvlComparisonChart data={data} />
        </ChartCard>

        <ChartCard title="TVL Momentum">
          <TvlMomentumChart data={data} />
        </ChartCard>

        <ChartCard title="Tweet Engagement (last 5 tweets)">
          <EngagementChart competitors={data.competitors} />
        </ChartCard>

        <ChartCard title="Engagement Rate vs Views">
          <EngagementRateChart competitors={data.competitors} />
        </ChartCard>

        <ChartCard title="TVL vs Social Engagement">
          <TvlSocialQuadrant competitors={data.competitors} />
        </ChartCard>

        <ChartCard title="Tweet Velocity">
          <TweetVelocityChart competitors={data.competitors} />
        </ChartCard>
      </div>
    </section>
  );
}
