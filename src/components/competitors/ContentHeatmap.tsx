"use client";

import type { CompetitorData } from "@/lib/api/competitor-types";
import { metricRates } from "@/lib/utils/competitor-metrics";

function intensityClass(value: number, max: number): string {
  if (!max) return "bg-gray-50";
  const ratio = value / max;
  if (ratio > 0.75) return "bg-accent/80 text-white";
  if (ratio > 0.5) return "bg-accent/50 text-white";
  if (ratio > 0.25) return "bg-accent/25 text-foreground";
  return "bg-accent/10 text-foreground";
}

export function ContentHeatmap({
  competitors,
}: {
  competitors: CompetitorData[];
}) {
  const rows = competitors.map((c) => {
    const rates = metricRates(c.tweets);
    return {
      name: c.displayName,
      likeRate: rates.likeRate * 100,
      bookmarkRate: rates.bookmarkRate * 100,
      retweetRate: rates.retweetRate * 100,
    };
  });

  const maxLike = Math.max(...rows.map((r) => r.likeRate));
  const maxBookmark = Math.max(...rows.map((r) => r.bookmarkRate));
  const maxRetweet = Math.max(...rows.map((r) => r.retweetRate));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted">
            <th className="text-left py-1 pr-3 font-medium">Protocol</th>
            <th className="text-center py-1 px-2 font-medium">Like Rate</th>
            <th className="text-center py-1 px-2 font-medium">Bookmark Rate</th>
            <th className="text-center py-1 px-2 font-medium">Retweet Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="py-1 pr-3 text-foreground font-medium truncate max-w-[100px]">
                {r.name}
              </td>
              <td className="py-1 px-2 text-center">
                <span
                  className={`inline-block rounded px-2 py-0.5 ${intensityClass(r.likeRate, maxLike)}`}
                >
                  {r.likeRate.toFixed(2)}%
                </span>
              </td>
              <td className="py-1 px-2 text-center">
                <span
                  className={`inline-block rounded px-2 py-0.5 ${intensityClass(r.bookmarkRate, maxBookmark)}`}
                >
                  {r.bookmarkRate.toFixed(2)}%
                </span>
              </td>
              <td className="py-1 px-2 text-center">
                <span
                  className={`inline-block rounded px-2 py-0.5 ${intensityClass(r.retweetRate, maxRetweet)}`}
                >
                  {r.retweetRate.toFixed(2)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
