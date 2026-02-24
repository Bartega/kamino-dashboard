"use client";

import { useState } from "react";
import type { CompetitorTweet } from "@/lib/api/competitor-types";
import { TweetMetrics } from "./TweetMetrics";

function formatTimeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function TweetItem({ tweet }: { tweet: CompetitorTweet }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-background/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <TweetMetrics tweet={tweet} />
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs text-muted">{formatTimeAgo(tweet.createdAt)}</span>
          <svg
            className={`w-4 h-4 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-border">
          <p className="text-sm text-foreground leading-relaxed mt-2 whitespace-pre-wrap">
            {tweet.fullText}
          </p>
          <a
            href={tweet.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:text-foreground transition-colors mt-2 inline-block"
          >
            View on X
          </a>
        </div>
      )}
    </div>
  );
}
