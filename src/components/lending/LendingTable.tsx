"use client";

import { useState } from "react";
import type { DisplayMarket } from "@/lib/api/types";
import { ApyBadge } from "../shared/ApyBadge";
import { formatUsd } from "@/lib/utils/format";
import { KAMINO_APP_URL } from "@/lib/constants";

type SortKey = "name" | "borrowApy" | "marketSize";

export function LendingTable({ markets }: { markets: DisplayMarket[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("marketSize");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...markets].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    if (sortKey === "name") return mul * a.name.localeCompare(b.name);
    return mul * (a[sortKey] - b[sortKey]);
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " \u2191" : " \u2193") : "";

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th
                className="pb-3 pr-4 font-medium cursor-pointer hover:text-foreground"
                onClick={() => toggleSort("name")}
              >
                Market{arrow("name")}
              </th>
              <th className="pb-3 pr-4 font-medium">Collateral</th>
              <th
                className="pb-3 pr-4 font-medium cursor-pointer hover:text-foreground text-right"
                onClick={() => toggleSort("borrowApy")}
              >
                Borrow APY{arrow("borrowApy")}
              </th>
              <th
                className="pb-3 font-medium cursor-pointer hover:text-foreground text-right"
                onClick={() => toggleSort("marketSize")}
              >
                Market Size{arrow("marketSize")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((market) => (
              <tr
                key={market.name}
                className="border-b border-border/50 hover:bg-card-hover transition-colors"
              >
                <td className="py-3 pr-4">
                  <a
                    href={`${KAMINO_APP_URL}/lending`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:text-accent transition-colors"
                  >
                    {market.name}
                  </a>
                </td>
                <td className="py-3 pr-4 text-muted">{market.collateral}</td>
                <td className="py-3 pr-4 text-right">
                  <ApyBadge value={market.borrowApy} />
                </td>
                <td className="py-3 text-right font-mono text-foreground">
                  {formatUsd(market.marketSize)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sorted.map((market) => (
          <a
            key={market.name}
            href={`${KAMINO_APP_URL}/lending`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-card rounded-xl p-4 border border-border hover:border-accent/30 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-foreground">{market.name}</span>
              <ApyBadge value={market.borrowApy} />
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>{market.collateral}</span>
              <span>{formatUsd(market.marketSize)}</span>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
