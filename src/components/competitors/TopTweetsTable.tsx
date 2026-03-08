"use client";

import { useState } from "react";
import type { CompetitorData } from "@/lib/api/competitor-types";
import { engagementRate } from "@/lib/utils/competitor-metrics";

type SortKey = "engRate" | "likes" | "bookmarks" | "retweets" | "views";

interface RankedTweet {
  handle: string;
  displayName: string;
  text: string;
  url: string;
  likes: number;
  bookmarks: number;
  retweets: number;
  views: number;
  engRate: number;
}

export function TopTweetsTable({
  competitors,
}: {
  competitors: CompetitorData[];
}) {
  const [sortBy, setSortBy] = useState<SortKey>("engRate");

  const allTweets: RankedTweet[] = competitors.flatMap((c) =>
    c.tweets.map((t) => ({
      handle: c.twitterHandle,
      displayName: c.displayName,
      text: t.fullText,
      url: t.twitterUrl,
      likes: t.likeCount,
      bookmarks: t.bookmarkCount,
      retweets: t.retweetCount,
      views: t.viewCount,
      engRate: +(engagementRate(t) * 100).toFixed(2),
    })),
  );

  const sorted = [...allTweets]
    .filter((t) => t.views >= 500)
    .sort((a, b) => b[sortBy] - a[sortBy])
    .slice(0, 10);

  const headers: { key: SortKey; label: string }[] = [
    { key: "engRate", label: "Eng %" },
    { key: "likes", label: "Likes" },
    { key: "bookmarks", label: "Bookmarks" },
    { key: "retweets", label: "RTs" },
    { key: "views", label: "Views" },
  ];

  function fmt(n: number): string {
    if (n >= 1_000_000) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted border-b border-border">
            <th className="text-left py-2 pr-2 font-medium">#</th>
            <th className="text-left py-2 pr-2 font-medium">Protocol</th>
            <th className="text-left py-2 pr-2 font-medium max-w-[200px]">Tweet</th>
            {headers.map((h) => (
              <th
                key={h.key}
                onClick={() => setSortBy(h.key)}
                className={`text-right py-2 px-2 font-medium cursor-pointer hover:text-foreground ${sortBy === h.key ? "text-accent" : ""}`}
              >
                {h.label}
                {sortBy === h.key ? " ↓" : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => (
            <tr key={`${t.handle}-${i}`} className="border-b border-border/50">
              <td className="py-2 pr-2 text-muted">{i + 1}</td>
              <td className="py-2 pr-2 text-foreground font-medium whitespace-nowrap">
                {t.displayName}
              </td>
              <td className="py-2 pr-2 max-w-[200px]">
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-accent line-clamp-2"
                >
                  {t.text}
                </a>
              </td>
              {headers.map((h) => (
                <td key={h.key} className="py-2 px-2 text-right text-foreground">
                  {h.key === "engRate" ? `${t.engRate}%` : fmt(t[h.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
