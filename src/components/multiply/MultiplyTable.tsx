"use client";

import { useState } from "react";
import type { DisplayMultiply } from "@/lib/api/types";
import { KAMINO_APP_URL } from "@/lib/constants";

type SortKey = "name" | "type";

export function MultiplyTable({
  strategies,
}: {
  strategies: DisplayMultiply[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("type");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...strategies].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    return mul * a[sortKey].localeCompare(b[sortKey]);
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " \u2191" : " \u2193") : "";

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th
                className="pb-3 pr-4 font-medium cursor-pointer hover:text-foreground"
                onClick={() => toggleSort("name")}
              >
                Strategy{arrow("name")}
              </th>
              <th className="pb-3 pr-4 font-medium">Collateral</th>
              <th className="pb-3 pr-4 font-medium">Debt</th>
              <th className="pb-3 pr-4 font-medium text-right">
                Max Leverage
              </th>
              <th className="pb-3 pr-4 font-medium text-right">
                Net APY Range
              </th>
              <th
                className="pb-3 font-medium cursor-pointer hover:text-foreground"
                onClick={() => toggleSort("type")}
              >
                Type{arrow("type")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr
                key={s.name}
                className="border-b border-border/50 hover:bg-card-hover transition-colors"
              >
                <td className="py-3 pr-4">
                  <a
                    href={`${KAMINO_APP_URL}/multiply`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:text-accent transition-colors"
                  >
                    {s.name}
                  </a>
                </td>
                <td className="py-3 pr-4 text-muted">{s.collateral}</td>
                <td className="py-3 pr-4 text-muted">{s.debt}</td>
                <td className="py-3 pr-4 text-right font-mono font-semibold text-foreground">
                  {s.maxLeverage}
                </td>
                <td className="py-3 pr-4 text-right font-mono font-semibold text-accent">
                  {s.netApyRange}
                </td>
                <td className="py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      s.type === "Correlated"
                        ? "bg-blue-500/10 text-blue-400"
                        : s.type === "Stable"
                          ? "bg-accent-dim text-accent"
                          : "bg-warning/10 text-warning"
                    }`}
                  >
                    {s.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {sorted.map((s) => (
          <a
            key={s.name}
            href={`${KAMINO_APP_URL}/multiply`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-card rounded-xl p-4 border border-border hover:border-accent/30 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-foreground">{s.name}</span>
              <span className="font-mono font-semibold text-accent">
                {s.netApyRange}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>
                {s.collateral}/{s.debt}
              </span>
              <span>{s.maxLeverage} max</span>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
