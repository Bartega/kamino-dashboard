"use client";

import { useState } from "react";

export function RiskDisclaimer({
  title,
  risks,
}: {
  title: string;
  risks: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border border-border rounded-lg bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted hover:text-foreground transition-colors"
      >
        <span>{title}</span>
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
        <div className="px-4 pb-4 space-y-2">
          {risks.map((risk, i) => (
            <p key={i} className="text-sm text-muted leading-relaxed">
              {risk}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
