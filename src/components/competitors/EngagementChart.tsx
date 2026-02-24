"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CompetitorData } from "@/lib/api/competitor-types";

export function EngagementChart({
  competitors,
}: {
  competitors: CompetitorData[];
}) {
  const chartData = competitors.map((c) => ({
    name: c.displayName,
    likes: c.tweets.reduce((sum, t) => sum + t.likeCount, 0),
    bookmarks: c.tweets.reduce((sum, t) => sum + t.bookmarkCount, 0),
    retweets: c.tweets.reduce((sum, t) => sum + t.retweetCount, 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="likes" fill="#001F46" radius={[4, 4, 0, 0]} />
        <Bar dataKey="bookmarks" fill="#C0F4FF" radius={[4, 4, 0, 0]} />
        <Bar dataKey="retweets" fill="#9CAED4" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
