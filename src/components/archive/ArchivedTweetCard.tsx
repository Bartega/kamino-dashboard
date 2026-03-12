"use client";

import { useState } from "react";
import type { ArchivedTweet } from "@/lib/api/competitor-types";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ArchivedTweetCard({ tweet }: { tweet: ArchivedTweet }) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-start gap-3">
        {tweet.thumbnailUrl && (
          <img
            src={tweet.thumbnailUrl}
            alt=""
            className="w-12 h-12 rounded object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-foreground">
              {tweet.displayName}
            </span>
            <span className="text-xs text-muted">@{tweet.twitterHandle}</span>
            <span className="text-xs text-muted">{formatDate(tweet.createdAt)}</span>
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded bg-accent/10 text-accent">
              {tweet.engagementRate.toFixed(2)}%
            </span>
          </div>

          <a
            href={tweet.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-foreground hover:text-accent leading-relaxed block mb-2"
          >
            {tweet.fullText}
          </a>

          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="text-pink-500">{formatCount(tweet.likeCount)} likes</span>
            <span className="text-liquidity-blue">{formatCount(tweet.bookmarkCount)} bookmarks</span>
            <span>{formatCount(tweet.retweetCount)} RTs</span>
            <span>{formatCount(tweet.viewCount)} views</span>
          </div>

          {tweet.aiAnalysis && (
            <div className="mt-2">
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="text-xs text-accent hover:text-foreground transition-colors"
              >
                {showAnalysis ? "Hide analysis" : "Why it worked ↓"}
              </button>
              {showAnalysis && (
                <div className="mt-2 bg-background rounded-lg p-3">
                  <p className="text-xs font-medium text-accent mb-1">Performance Analysis</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {tweet.aiAnalysis}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
