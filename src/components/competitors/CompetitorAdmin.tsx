"use client";

import { useState, useEffect } from "react";
import type { CompetitorConfig } from "@/lib/api/competitor-types";

export function CompetitorAdmin() {
  const [competitors, setCompetitors] = useState<CompetitorConfig[]>([]);
  const [newHandle, setNewHandle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/competitors/config")
      .then((res) => res.json())
      .then((data) => setCompetitors(data.competitors ?? []));
  }, []);

  async function handleAdd() {
    if (!newHandle || !newSlug) return;
    setLoading(true);
    const res = await fetch("/api/competitors/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add",
        twitterHandle: newHandle.replace("@", ""),
        defiLlamaSlug: newSlug,
      }),
    });
    const data = await res.json();
    setCompetitors(data.competitors ?? []);
    setNewHandle("");
    setNewSlug("");
    setLoading(false);
  }

  async function handleRemove(handle: string) {
    setLoading(true);
    const res = await fetch("/api/competitors/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", twitterHandle: handle }),
    });
    const data = await res.json();
    setCompetitors(data.competitors ?? []);
    setLoading(false);
  }

  return (
    <div className="border border-border rounded-lg bg-white mt-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted hover:text-foreground transition-colors"
      >
        <span>Manage Competitors</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
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
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {competitors.length === 0 && (
            <p className="text-sm text-muted">No competitors configured yet.</p>
          )}
          {competitors.map((c) => (
            <div
              key={c.twitterHandle}
              className="flex items-center justify-between text-sm"
            >
              <span>
                @{c.twitterHandle}{" "}
                <span className="text-muted">({c.defiLlamaSlug})</span>
              </span>
              <button
                onClick={() => handleRemove(c.twitterHandle)}
                className="text-xs text-danger hover:text-foreground transition-colors"
                disabled={loading}
              >
                Remove
              </button>
            </div>
          ))}
          <div className="flex gap-2 items-end pt-2">
            <input
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              placeholder="Twitter handle"
              className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background"
            />
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="DeFi Llama slug"
              className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background"
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newHandle || !newSlug}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
