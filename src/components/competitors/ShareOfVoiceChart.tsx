"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
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

interface HandleSnapshot {
  handle: string;
  displayName: string;
  tweetCount: number;
  totalEngagement: number;
}

interface TimeSeriesEntry {
  date: string;
  [handle: string]: string | number;
}

interface ShareOfVoiceData {
  snapshot: HandleSnapshot[];
  volumeTimeSeries: TimeSeriesEntry[];
  engagementTimeSeries: TimeSeriesEntry[];
}

type Tab = "volume" | "engagement";

const RADIAN = Math.PI / 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderLabel(props: any) {
  const cx = Number(props.cx ?? 0);
  const cy = Number(props.cy ?? 0);
  const midAngle = Number(props.midAngle ?? 0);
  const innerRadius = Number(props.innerRadius ?? 0);
  const outerRadius = Number(props.outerRadius ?? 0);
  const percent = Number(props.percent ?? 0);
  if (percent < 0.03) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function ShareOfVoiceChart() {
  const colors = useThemeColors();
  const [days, setDays] = useState<7 | 14 | 30>(14);
  const [tab, setTab] = useState<Tab>("engagement");
  const [data, setData] = useState<ShareOfVoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/competitors/archive/share-of-voice?days=${days}`)
      .then((res) => res.json())
      .then((json: ShareOfVoiceData) => {
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

  if (!data || data.snapshot.length === 0) {
    return <p className="text-sm text-muted">No archive data available</p>;
  }

  const pieData = data.snapshot.map((s) => ({
    name: s.displayName,
    value: tab === "volume" ? s.tweetCount : s.totalEngagement,
  }));

  return (
    <div>
      {/* Period toggle */}
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
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab("volume")}
          className={`text-xs px-2 py-1 rounded ${tab === "volume" ? "bg-accent text-accent-foreground" : "bg-background text-muted"}`}
        >
          Volume
        </button>
        <button
          onClick={() => setTab("engagement")}
          className={`text-xs px-2 py-1 rounded ${tab === "engagement" ? "bg-accent text-accent-foreground" : "bg-background text-muted"}`}
        >
          Engagement
        </button>
      </div>

      {/* Donut chart */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            label={renderLabel}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) =>
              tab === "volume"
                ? `${value} tweets`
                : Number(value).toLocaleString()
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 px-2">
        {pieData.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {entry.name}
          </div>
        ))}
      </div>
    </div>
  );
}
