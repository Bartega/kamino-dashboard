"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useThemeColors } from "@/hooks/useThemeColors";

const COLORS = [
  "#9CAED4",
  "#D97706",
  "#DC2626",
  "#4A5565",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];

interface Snapshot {
  timestamp: number;
  followers: number;
}

interface Series {
  handle: string;
  displayName: string;
  snapshots: Snapshot[];
}

interface ApiResponse {
  series: Series[];
}

function formatFollowers(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
}

export function FollowerGrowthChart() {
  const colors = useThemeColors();
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/competitors/followers?days=${days}`)
      .then((res) => res.json())
      .then((json: ApiResponse) => {
        setData(json.series);
        setLoading(false);
      })
      .catch(() => {
        setData([]);
        setLoading(false);
      });
  }, [days]);

  if (loading) {
    return <p className="text-sm text-muted">Loading...</p>;
  }

  const hasSnapshots = data.some((s) => s.snapshots.length > 0);
  if (!hasSnapshots) {
    return (
      <p className="text-sm text-muted">
        Collecting follower data - check back in 24 hours
      </p>
    );
  }

  // Build a unified time series keyed by date string (YYYY-MM-DD)
  const dateMap = new Map<string, Record<string, number | string>>();

  for (const series of data) {
    for (const snap of series.snapshots) {
      const dateStr = new Date(snap.timestamp * 1000)
        .toISOString()
        .slice(0, 10);
      const entry = dateMap.get(dateStr) ?? { date: dateStr };
      entry[series.handle] = snap.followers;
      dateMap.set(dateStr, entry);
    }
  }

  const chartData = Array.from(dateMap.values()).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string),
  );

  // Format date labels as "19 Mar"
  const formattedData = chartData.map((entry) => ({
    ...entry,
    dateLabel: new Date(entry.date as string).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setDays(7)}
          className={`text-xs px-2 py-1 rounded ${days === 7 ? "bg-accent text-accent-foreground" : "bg-background text-muted"}`}
        >
          7 days
        </button>
        <button
          onClick={() => setDays(14)}
          className={`text-xs px-2 py-1 rounded ${days === 14 ? "bg-accent text-accent-foreground" : "bg-background text-muted"}`}
        >
          14 days
        </button>
        <button
          onClick={() => setDays(30)}
          className={`text-xs px-2 py-1 rounded ${days === 30 ? "bg-accent text-accent-foreground" : "bg-background text-muted"}`}
        >
          30 days
        </button>
        <button
          onClick={() => setDays(365)}
          className={`text-xs px-2 py-1 rounded ${days === 365 ? "bg-accent text-accent-foreground" : "bg-background text-muted"}`}
        >
          All
        </button>
      </div>
      <ResponsiveContainer width="100%" height={600}>
        <LineChart data={formattedData}>
          <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v) => formatFollowers(v)}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(v) => formatFollowers(Number(v))}
          />
          <Legend />
          {data
            .filter((s) => s.snapshots.length > 0)
            .map((s, i) => (
              <Line
                key={s.handle}
                dataKey={s.handle}
                name={s.displayName}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={1.5}
                dot={false}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
