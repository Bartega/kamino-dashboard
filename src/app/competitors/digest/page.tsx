"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface DailyDigest {
  date: string;
  generatedAt: string;
  aiSummary: string;
  topTweets: {
    id: string;
    fullText: string;
    twitterHandle: string;
    displayName: string;
    likeCount: number;
    bookmarkCount: number;
    retweetCount: number;
    viewCount: number;
    engagementRate: number;
    createdAt: string;
    twitterUrl: string;
    category?: string;
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
    avgEngagement: number;
  }[];
  stats: {
    totalTweets: number;
    totalCompetitors: number;
    avgEngagement: number;
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatCategoryName(raw: string): string {
  return raw
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function DigestSummary({
  summary,
  generatedAt,
}: {
  summary: string;
  generatedAt: string;
}) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        AI Summary
      </h2>
      <p className="text-sm text-foreground whitespace-pre-line">{summary}</p>
      <p className="text-sm text-muted mt-3">
        Generated at{" "}
        {new Date(generatedAt).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        })}{" "}
        UTC
      </p>
    </div>
  );
}

function DigestTopTweets({
  tweets,
}: {
  tweets: DailyDigest["topTweets"];
}) {
  const displayed = tweets.slice(0, 10);

  if (displayed.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Top Tweets
        </h2>
        <p className="text-sm text-muted">
          No tweets recorded for this period.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Top Tweets
      </h2>
      <div className="space-y-4">
        {displayed.map((tweet) => (
          <div
            key={tweet.id}
            className="border-b border-border/50 pb-4 last:border-b-0 last:pb-0"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground">
                {tweet.displayName}
              </span>
              <span className="text-sm text-muted">@{tweet.twitterHandle}</span>
            </div>
            <p className="text-sm text-foreground mb-2">
              {tweet.fullText.length > 200
                ? tweet.fullText.slice(0, 200) + "..."
                : tweet.fullText}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-muted bg-background rounded px-2 py-0.5">
                {tweet.likeCount.toLocaleString()} likes
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted bg-background rounded px-2 py-0.5">
                {tweet.bookmarkCount.toLocaleString()} bookmarks
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted bg-background rounded px-2 py-0.5">
                {tweet.retweetCount.toLocaleString()} retweets
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted bg-background rounded px-2 py-0.5">
                {tweet.viewCount.toLocaleString()} views
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground bg-background rounded px-2 py-0.5">
                {tweet.engagementRate.toFixed(1)}%
              </span>
              {tweet.category && (
                <span className="inline-flex items-center text-xs font-medium text-accent bg-accent/10 rounded px-2 py-0.5">
                  {formatCategoryName(tweet.category)}
                </span>
              )}
              <a
                href={tweet.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-liquidity-blue hover:underline ml-auto"
              >
                View
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DigestCategories({
  categories,
}: {
  categories: DailyDigest["categoryBreakdown"];
}) {
  const maxCount = useMemo(
    () => Math.max(...categories.map((c) => c.count), 1),
    [categories],
  );

  if (categories.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Category Breakdown
        </h2>
        <p className="text-sm text-muted">
          No categorised tweets for this period.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Category Breakdown
      </h2>
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.category} className="flex items-center gap-3">
            <span className="text-sm text-foreground w-36 shrink-0">
              {formatCategoryName(cat.category)}
            </span>
            <div className="flex-1 h-6 bg-background rounded overflow-hidden">
              <div
                className="h-full bg-accent/30 rounded flex items-center px-2"
                style={{
                  width: `${(cat.count / maxCount) * 100}%`,
                  minWidth: "2rem",
                }}
              >
                <span className="text-xs font-medium text-foreground">
                  {cat.count}
                </span>
              </div>
            </div>
            <span className="text-xs text-muted w-20 text-right shrink-0">
              {cat.avgEngagement.toFixed(1)}% avg
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DigestPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayUTC());
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch available dates on mount
  useEffect(() => {
    fetch("/api/digest/dates")
      .then((r) => r.json())
      .then((json: { dates: string[] }) => {
        const sorted = [...json.dates].sort();
        setAvailableDates(sorted);
      })
      .catch(() => setAvailableDates([]));
  }, []);

  // Fetch digest when selectedDate changes
  const fetchDigest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/digest?date=${selectedDate}`);
      if (!res.ok) {
        setDigest(null);
        return;
      }
      const json = await res.json();
      setDigest(json.digest ?? null);
    } catch {
      setDigest(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  const currentIndex = availableDates.indexOf(selectedDate);
  const canGoPrev = currentIndex > 0;
  const canGoNext =
    currentIndex >= 0 && currentIndex < availableDates.length - 1;

  function goToPreviousDate() {
    if (canGoPrev) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
  }

  function goToNextDate() {
    if (canGoNext) {
      setSelectedDate(availableDates[currentIndex + 1]);
    }
  }

  function goToToday() {
    setSelectedDate(getTodayUTC());
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Digest</h1>
          <p className="text-sm text-muted mt-1">
            AI-generated summary of competitor activity, updated daily.
          </p>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={goToPreviousDate}
            disabled={!canGoPrev}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border hover:bg-card disabled:opacity-40 disabled:hover:bg-surface transition-colors"
            aria-label="Previous date"
          >
            <svg
              className="w-4 h-4 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <span className="text-sm font-medium text-foreground">
            {formatDate(selectedDate)}
          </span>

          <button
            onClick={goToNextDate}
            disabled={!canGoNext}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border hover:bg-card disabled:opacity-40 disabled:hover:bg-surface transition-colors"
            aria-label="Next date"
          >
            <svg
              className="w-4 h-4 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {selectedDate !== getTodayUTC() && (
            <button
              onClick={goToToday}
              className="text-xs px-2.5 py-1 rounded bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-sm text-muted text-center py-8">
            Loading digest...
          </p>
        ) : !digest ? (
          <p className="text-sm text-muted text-center py-8">
            No digest available for this date.
          </p>
        ) : (
          <>
            <DigestSummary
              summary={digest.aiSummary}
              generatedAt={digest.generatedAt}
            />

            <DigestTopTweets tweets={digest.topTweets} />

            <DigestCategories categories={digest.categoryBreakdown} />

            {/* Stats footer */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface rounded-lg border border-border p-3">
                <p className="text-xs text-muted">Tweets Tracked</p>
                <p className="text-lg font-bold text-foreground">
                  {digest.stats.totalTweets.toLocaleString()}
                </p>
              </div>
              <div className="bg-surface rounded-lg border border-border p-3">
                <p className="text-xs text-muted">Competitors Active</p>
                <p className="text-lg font-bold text-foreground">
                  {digest.stats.totalCompetitors.toLocaleString()}
                </p>
              </div>
              <div className="bg-surface rounded-lg border border-border p-3">
                <p className="text-xs text-muted">Avg Engagement</p>
                <p className="text-lg font-bold text-foreground">
                  {digest.stats.avgEngagement.toFixed(1)}%
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
