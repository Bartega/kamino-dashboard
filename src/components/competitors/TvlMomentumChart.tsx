"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CompetitorDataFile } from "@/lib/api/competitor-types";
import { tvlChange } from "@/lib/utils/competitor-metrics";

export function TvlMomentumChart({ data }: { data: CompetitorDataFile }) {
  const [days, setDays] = useState<7 | 30>(7);

  const chartData = [
    { name: "Kamino", ...tvlChange(data.kaminoTvlHistory, days) },
    ...data.competitors.map((c) => ({
      name: c.displayName,
      ...tvlChange(c.tvlHistory, days),
    })),
  ]
    .filter((d) => d.percentage !== 0)
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setDays(7)}
          className={`text-xs px-2 py-1 rounded ${days === 7 ? "bg-accent text-white" : "bg-background text-muted"}`}
        >
          7 days
        </button>
        <button
          onClick={() => setDays(30)}
          className={`text-xs px-2 py-1 rounded ${days === 30 ? "bg-accent text-white" : "bg-background text-muted"}`}
        >
          30 days
        </button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10 }}
            width={90}
          />
          <Tooltip
            formatter={(v) => `${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(2)}%`}
          />
          <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.percentage >= 0 ? "#10B981" : "#EF4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
