"use client";

import { useState, useEffect, useRef } from "react";
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

function getTweetId(url: string): string | null {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
}

function TweetEmbed({ tweetId }: { tweetId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const win = window as typeof window & {
      twttr?: {
        widgets: { createTweet: (id: string, el: HTMLElement, opts?: Record<string, unknown>) => Promise<unknown> };
        ready: (fn: () => void) => void;
      };
    };

    function renderTweet() {
      if (!containerRef.current || !win.twttr) return;
      containerRef.current.innerHTML = "";
      win.twttr.widgets
        .createTweet(tweetId, containerRef.current, {
          conversation: "none",
          dnt: true,
        })
        .then(() => setLoaded(true));
    }

    if (win.twttr?.widgets) {
      renderTweet();
    } else {
      if (!document.getElementById("twitter-wjs")) {
        const script = document.createElement("script");
        script.id = "twitter-wjs";
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        document.head.appendChild(script);
      }
      const check = setInterval(() => {
        if (win.twttr?.widgets) {
          clearInterval(check);
          renderTweet();
        }
      }, 200);
      return () => clearInterval(check);
    }
  }, [tweetId]);

  return (
    <div>
      {!loaded && (
        <p className="text-xs text-muted py-2">Loading tweet...</p>
      )}
      <div ref={containerRef} />
    </div>
  );
}

export function TweetItem({ tweet }: { tweet: CompetitorTweet }) {
  const [expanded, setExpanded] = useState(false);
  const tweetId = getTweetId(tweet.twitterUrl);

  // First line of tweet text as preview
  const preview =
    tweet.fullText.split("\n").find((l) => l.trim()) ?? tweet.fullText;

  return (
    <div className="border border-border rounded-lg bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-background/50 transition-colors"
      >
        {tweet.thumbnailUrl && (
          <img
            src={tweet.thumbnailUrl}
            alt=""
            className="w-10 h-10 rounded object-cover shrink-0 mr-2"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">{preview}</p>
          <div className="mt-1">
            <TweetMetrics tweet={tweet} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs text-muted">
            {formatTimeAgo(tweet.createdAt)}
          </span>
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
          {tweetId ? (
            <div className="mt-2">
              <TweetEmbed tweetId={tweetId} />
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
