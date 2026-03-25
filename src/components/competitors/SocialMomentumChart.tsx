"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface MomentumEntry {
  handle: string;
  displayName: string;
  current: number;
  previous: number;
  changePercent: number;
}

export function SocialMomentumChart() {
  const [data, setData] = useState<MomentumEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/competitors/archive/social-momentum")
      .then((res) => res.json())
      .then((json: { series: MomentumEntry[] }) => {
        setData(json.series);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Loading...</p>;
  if (data.length === 0)
    return <p className="text-sm text-muted">No archive data available</p>;

  const chartData = data.map((d) => ({
    name: d.displayName,
    change: +d.changePercent.toFixed(1),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical">
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 10 }}
          width={90}
        />
        <Tooltip
          formatter={(v) =>
            `${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(1)}%`
          }
        />
        <Bar dataKey="change" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.change >= 0 ? "#10B981" : "#EF4444"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
