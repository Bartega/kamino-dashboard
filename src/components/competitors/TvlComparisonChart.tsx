"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CompetitorDataFile } from "@/lib/api/competitor-types";

const COLORS = ["#9CAED4", "#D97706", "#DC2626", "#4A5565", "#10B981"];

export function TvlComparisonChart({ data }: { data: CompetitorDataFile }) {
  // Build a unified time-series keyed by date
  const dateMap = new Map<number, Record<string, number>>();

  // Add Kamino data
  for (const point of data.kaminoTvlHistory) {
    const entry = dateMap.get(point.date) ?? {};
    entry["Kamino"] = point.tvl;
    dateMap.set(point.date, entry);
  }

  // Add competitor data
  for (const comp of data.competitors) {
    for (const point of comp.tvlHistory) {
      const entry = dateMap.get(point.date) ?? {};
      entry[comp.displayName] = point.tvl;
      dateMap.set(point.date, entry);
    }
  }

  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([date, values]) => ({
      date: new Date(date * 1000).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      ...values,
    }));

  if (chartData.length === 0) {
    return <p className="text-sm text-muted">No TVL history available</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis
          tickFormatter={(v) => `$${(v / 1e9).toFixed(1)}B`}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(v) => `$${(Number(v) / 1e6).toFixed(0)}M`}
        />
        <Legend />
        <Line
          dataKey="Kamino"
          stroke="#001F46"
          strokeWidth={2}
          dot={false}
        />
        {data.competitors.map((c, i) => (
          <Line
            key={c.twitterHandle}
            dataKey={c.displayName}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={1.5}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
