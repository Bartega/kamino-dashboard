"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Label,
} from "recharts";
import type { CompetitorData } from "@/lib/api/competitor-types";
import { avgEngagementRate, avgViews } from "@/lib/utils/competitor-metrics";
import { useThemeColors } from "@/hooks/useThemeColors";

const COLORS = [
  "#001F46", "#D97706", "#DC2626", "#10B981", "#4A5565",
  "#7C3AED", "#0EA5E9", "#F59E0B", "#EF4444", "#14B8A6",
  "#8B5CF6", "#06B6D4", "#F97316", "#EC4899", "#6366F1",
  "#84CC16", "#E11D48",
];

export function EngagementRateChart({
  competitors,
}: {
  competitors: CompetitorData[];
}) {
  const colors = useThemeColors();

  const chartData = competitors.map((c, i) => ({
    name: c.displayName,
    engRate: +(avgEngagementRate(c.tweets) * 100).toFixed(2),
    views: Math.round(avgViews(c.tweets)),
    color: COLORS[i % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ bottom: 10, left: 10, right: 10 }}>
        <XAxis
          dataKey="engRate"
          type="number"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
        >
          <Label value="Avg Engagement Rate" position="bottom" offset={-2} style={{ fontSize: 11 }} />
        </XAxis>
        <YAxis
          dataKey="views"
          type="number"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) =>
            v >= 1_000_000 ? `${(v / 1e6).toFixed(1)}M` : v >= 1_000 ? `${(v / 1e3).toFixed(0)}K` : String(v)
          }
        />
        <Tooltip
          formatter={(value, name) =>
            name === "engRate" ? `${value}%` : Number(value).toLocaleString()
          }
          labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
        />
        <Scatter data={chartData}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
