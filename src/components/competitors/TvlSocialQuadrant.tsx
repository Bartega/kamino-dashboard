"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { CompetitorData } from "@/lib/api/competitor-types";
import { totalEngagement } from "@/lib/utils/competitor-metrics";
import { useThemeColors } from "@/hooks/useThemeColors";

const COLORS = [
  "#001F46", "#D97706", "#DC2626", "#10B981", "#4A5565",
  "#7C3AED", "#0EA5E9", "#F59E0B", "#EF4444", "#14B8A6",
  "#8B5CF6", "#06B6D4", "#F97316", "#EC4899", "#6366F1",
  "#84CC16", "#E11D48",
];

export function TvlSocialQuadrant({
  competitors,
}: {
  competitors: CompetitorData[];
}) {
  const colors = useThemeColors();

  const withTvl = competitors.filter((c) => c.tvl > 0);

  const chartData = withTvl.map((c, i) => ({
    name: c.displayName,
    tvl: c.tvl,
    engagement: totalEngagement(c.tweets),
    color: COLORS[i % COLORS.length],
  }));

  const tvls = chartData.map((d) => d.tvl).sort((a, b) => a - b);
  const engs = chartData.map((d) => d.engagement).sort((a, b) => a - b);
  const medianTvl = tvls[Math.floor(tvls.length / 2)] ?? 0;
  const medianEng = engs[Math.floor(engs.length / 2)] ?? 0;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ bottom: 10, left: 10, right: 10 }}>
        <XAxis
          dataKey="tvl"
          type="number"
          scale="log"
          domain={["auto", "auto"]}
          tick={{ fontSize: 10 }}
          tickFormatter={(v) =>
            v >= 1e9 ? `$${(v / 1e9).toFixed(0)}B` : `$${(v / 1e6).toFixed(0)}M`
          }
        />
        <YAxis
          dataKey="engagement"
          type="number"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) =>
            v >= 1_000 ? `${(v / 1e3).toFixed(0)}K` : String(v)
          }
        />
        <ReferenceLine x={medianTvl} stroke={colors.liquidityBlue || "#9CAED4"} strokeDasharray="3 3" />
        <ReferenceLine y={medianEng} stroke={colors.liquidityBlue || "#9CAED4"} strokeDasharray="3 3" />
        <Tooltip
          formatter={(value, name) =>
            name === "tvl"
              ? `$${(Number(value) / 1e6).toFixed(0)}M`
              : Number(value).toLocaleString()
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
