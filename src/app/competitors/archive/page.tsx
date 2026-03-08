"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArchiveHeader } from "@/components/archive/ArchiveHeader";
import { ArchiveFilters } from "@/components/archive/ArchiveFilters";
import { ArchivedTweetCard } from "@/components/archive/ArchivedTweetCard";
import type { ArchivedTweet, ArchiveStats } from "@/lib/api/competitor-types";

const PAGE_SIZE = 30;

export default function ArchivePage() {
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [tweets, setTweets] = useState<ArchivedTweet[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [handles, setHandles] = useState<string[]>([]);

  // Filters
  const [selectedHandle, setSelectedHandle] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "engagement">("date");
  const [searchText, setSearchText] = useState("");

  // Fetch stats on mount
  useEffect(() => {
    fetch("/api/competitors/archive/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  // Fetch competitor handles from config
  useEffect(() => {
    fetch("/api/competitors/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.competitors) {
          setHandles(
            data.competitors.map(
              (c: { twitterHandle: string }) => c.twitterHandle,
            ),
          );
        }
      })
      .catch(() => {});
  }, []);

  const fetchTweets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      sort: sortBy,
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (selectedHandle) params.set("handle", selectedHandle);

    try {
      const res = await fetch(`/api/competitors/archive?${params}`);
      const data = await res.json();
      let filtered = data.tweets as ArchivedTweet[];
      if (searchText) {
        const lower = searchText.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.fullText.toLowerCase().includes(lower) ||
            t.twitterHandle.toLowerCase().includes(lower) ||
            t.displayName.toLowerCase().includes(lower),
        );
      }
      setTweets(filtered);
      setTotal(data.total);
    } catch {
      setTweets([]);
      setTotal(0);
    }
    setLoading(false);
  }, [sortBy, page, selectedHandle, searchText]);

  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedHandle, sortBy, searchText]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <ArchiveHeader stats={stats} />

        <ArchiveFilters
          handles={handles}
          selectedHandle={selectedHandle}
          onHandleChange={setSelectedHandle}
          sortBy={sortBy}
          onSortChange={setSortBy}
          searchText={searchText}
          onSearchChange={setSearchText}
        />

        {loading ? (
          <p className="text-sm text-muted text-center py-8">
            Loading archive...
          </p>
        ) : tweets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted">No archived tweets yet.</p>
            <p className="text-sm text-muted mt-2">
              Tweets will be archived automatically on the next scrape run.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted">
              Showing {page * PAGE_SIZE + 1}-
              {Math.min((page + 1) * PAGE_SIZE, total)} of {total} tweets
            </p>
            <div className="space-y-3">
              {tweets.map((tweet) => (
                <ArchivedTweetCard key={tweet.id} tweet={tweet} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="text-sm px-3 py-1.5 rounded border border-border bg-white disabled:opacity-40 hover:bg-background transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-muted">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="text-sm px-3 py-1.5 rounded border border-border bg-white disabled:opacity-40 hover:bg-background transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
