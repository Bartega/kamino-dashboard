"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CompetitorData } from "@/lib/api/competitor-types";
import { tweetFrequency } from "@/lib/utils/competitor-metrics";

export function TweetVelocityChart({
  competitors,
}: {
  competitors: CompetitorData[];
}) {
  const chartData = competitors
    .map((c) => {
      const freq = tweetFrequency(c.tweets);
      return {
        name: c.displayName,
        tweetsPerDay: +freq.tweetsPerDay.toFixed(2),
        avgGapHours: +freq.avgGapHours.toFixed(1),
      };
    })
    .sort((a, b) => b.tweetsPerDay - a.tweetsPerDay);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value, name) =>
            name === "tweetsPerDay"
              ? `${value} tweets/day`
              : `${value}h avg gap`
          }
        />
        <Bar
          dataKey="tweetsPerDay"
          fill="#001F46"
          radius={[4, 4, 0, 0]}
          name="Tweets/day"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
