"use client";

import { useEffect, useState } from "react";

interface HeatmapData {
  frequency: number[][];
  avgEngagement: number[][];
  tweetCount: number;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DISPLAY_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

function intensityClass(value: number, max: number): string {
  if (!max) return "bg-surface";
  const ratio = value / max;
  if (ratio > 0.75) return "bg-accent/80 text-accent-foreground";
  if (ratio > 0.5) return "bg-accent/50 text-accent-foreground";
  if (ratio > 0.25) return "bg-accent/25 text-foreground";
  return "bg-accent/10 text-foreground";
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}`;
}

export function PostingHeatmap() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"frequency" | "engagement">("frequency");

  useEffect(() => {
    fetch("/api/competitors/archive/posting-heatmap")
      .then((res) => res.json())
      .then((json: HeatmapData) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Loading...</p>;
  if (!data || data.tweetCount === 0)
    return <p className="text-sm text-muted">No archive data available</p>;

  const matrix =
    mode === "frequency" ? data.frequency : data.avgEngagement;

  const max = Math.max(...matrix.flat());

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMode("frequency")}
          className={`text-xs px-2 py-1 rounded ${mode === "frequency" ? "bg-accent text-accent-foreground" : "bg-background text-muted"}`}
        >
          Frequency
        </button>
        <button
          onClick={() => setMode("engagement")}
          className={`text-xs px-2 py-1 rounded ${mode === "engagement" ? "bg-accent text-accent-foreground" : "bg-background text-muted"}`}
        >
          Engagement
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-muted">
              <th className="text-left py-1 pr-2 font-medium">Day</th>
              {Array.from({ length: 24 }, (_, h) => (
                <th
                  key={h}
                  className="text-center py-1 px-0.5 font-medium min-w-[24px]"
                >
                  {DISPLAY_HOURS.includes(h) ? formatHour(h) : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((dayLabel, d) => (
              <tr key={dayLabel}>
                <td className="py-1 pr-2 text-foreground font-medium whitespace-nowrap">
                  {dayLabel}
                </td>
                {Array.from({ length: 24 }, (_, h) => {
                  const freq = data.frequency[d][h];
                  const eng = data.avgEngagement[d][h];
                  const cellValue = matrix[d][h];
                  const display =
                    mode === "frequency"
                      ? freq > 0
                        ? String(freq)
                        : ""
                      : eng > 0
                        ? eng.toFixed(1)
                        : "";
                  const tooltip = `${dayLabel} ${formatHour(h)}:00 UTC - ${freq} tweet${freq !== 1 ? "s" : ""}, avg ${eng.toFixed(1)}% engagement`;

                  return (
                    <td
                      key={h}
                      className={`text-center py-1 px-0.5 rounded ${intensityClass(cellValue, max)}`}
                      title={tooltip}
                    >
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
