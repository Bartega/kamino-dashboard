import type { CompetitorTweet } from "@/lib/api/competitor-types";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function MetricIcon({ name }: { name: string }) {
  const colorMap: Record<string, string> = {
    heart: "text-pink-500",
    bookmark: "text-blue-500",
  };

  const paths: Record<string, string> = {
    heart:
      "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    bookmark: "M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z",
    retweet:
      "M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3",
    reply:
      "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
  };

  return (
    <svg
      className={`w-3.5 h-3.5 ${colorMap[name] ?? ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={paths[name] || ""}
      />
      {name === "eye" && <circle cx="12" cy="12" r="3" />}
    </svg>
  );
}

export function TweetMetrics({ tweet }: { tweet: CompetitorTweet }) {
  const metrics = [
    { icon: "heart", value: tweet.likeCount, label: "Likes" },
    { icon: "bookmark", value: tweet.bookmarkCount, label: "Bookmarks" },
    { icon: "retweet", value: tweet.retweetCount, label: "Retweets" },
    { icon: "reply", value: tweet.replyCount, label: "Replies" },
    { icon: "eye", value: tweet.viewCount, label: "Views" },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {metrics.map((m) => (
        <span
          key={m.icon}
          className="inline-flex items-center gap-1 text-xs text-muted"
          title={m.label}
        >
          <MetricIcon name={m.icon} />
          {formatCount(m.value)}
        </span>
      ))}
    </div>
  );
}
