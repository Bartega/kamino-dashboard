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
  "#F59E0B",
  "#6366F1",
];

interface CategoryAgg {
  name: string;
  count: number;
  avgEngagement: number;
}

interface HandleBreakdown {
  handle: string;
  displayName: string;
  breakdown: { category: string; count: number }[];
}

interface TopicsData {
  categories: CategoryAgg[];
  byHandle: HandleBreakdown[];
  totalClassified: number;
}

function formatCategory(raw: string): string {
  return raw
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function NarrativeTracker() {
  const colors = useThemeColors();
  const [days, setDays] = useState<14 | 30 | 90>(30);
  const [data, setData] = useState<TopicsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/competitors/archive/topics?days=${days}`)
      .then((res) => res.json())
      .then((json: TopicsData) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, [days]);

  if (loading) {
    return <p className="text-sm text-muted">Loading...</p>;
  }

  if (!data || data.categories.length === 0) {
    return (
      <p className="text-sm text-muted">
        No classified tweets yet - data will appear after the next scraper run
      </p>
    );
  }

  const chartData = data.categories.map((c) => ({
    name: formatCategory(c.name),
    count: c.count,
    avgEngagement: c.avgEngagement,
  }));

  return (
    <div>
      {/* Period toggle */}
      <div className="flex gap-2 mb-3">
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
          onClick={() => setDays(90)}
          className={`text-xs px-2 py-1 rounded ${days === 90 ? "bg-accent text-accent-foreground" : "bg-background text-muted"}`}
        >
          90 days
        </button>
      </div>

      {/* Horizontal bar chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const item = payload[0].payload as {
                name: string;
                count: number;
                avgEngagement: number;
              };
              return (
                <div
                  className="rounded px-3 py-2 text-xs shadow-lg"
                  style={{
                    backgroundColor: colors.card || "#1a1a2e",
                    border: `1px solid ${colors.border || "#333"}`,
                    color: colors.foreground || "#fff",
                  }}
                >
                  <p className="font-medium">{item.name}</p>
                  <p>Count: {item.count}</p>
                  <p>Avg engagement: {(item.avgEngagement * 100).toFixed(2)}%</p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Breakdown by handle */}
      <div className="mt-4 space-y-1">
        {data.byHandle.map((h) => {
          const top2 = h.breakdown.slice(0, 2);
          const summary = top2
            .map((b) => `${formatCategory(b.category)} (${b.count})`)
            .join(", ");
          return (
            <p key={h.handle} className="text-xs text-muted">
              {h.displayName}: {summary}
            </p>
          );
        })}
      </div>
    </div>
  );
}
