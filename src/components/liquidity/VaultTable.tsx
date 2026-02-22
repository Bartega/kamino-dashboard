"use client";

import { useState } from "react";
import type { DisplayVault } from "@/lib/api/types";
import { ApyBadge } from "../shared/ApyBadge";
import { formatUsd } from "@/lib/utils/format";
import { KAMINO_APP_URL } from "@/lib/constants";

type SortKey = "name" | "apy7d" | "apy30d" | "tvl";

export function VaultTable({ vaults }: { vaults: DisplayVault[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("apy7d");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...vaults].sort((a, b) => {
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
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th
                className="pb-3 pr-4 font-medium cursor-pointer hover:text-foreground"
                onClick={() => toggleSort("name")}
              >
                Vault{arrow("name")}
              </th>
              <th className="pb-3 pr-4 font-medium">Type</th>
              <th
                className="pb-3 pr-4 font-medium cursor-pointer hover:text-foreground text-right"
                onClick={() => toggleSort("apy7d")}
              >
                7D APY{arrow("apy7d")}
              </th>
              <th
                className="pb-3 pr-4 font-medium cursor-pointer hover:text-foreground text-right"
                onClick={() => toggleSort("apy30d")}
              >
                30D APY{arrow("apy30d")}
              </th>
              <th
                className="pb-3 pr-4 font-medium cursor-pointer hover:text-foreground text-right"
                onClick={() => toggleSort("tvl")}
              >
                TVL{arrow("tvl")}
              </th>
              <th className="pb-3 font-medium">Rewards</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((vault) => (
              <tr
                key={vault.name + vault.address}
                className="border-b border-border/50 hover:bg-card-hover transition-colors"
              >
                <td className="py-3 pr-4">
                  <a
                    href={`${KAMINO_APP_URL}/liquidity`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:text-accent transition-colors"
                  >
                    {vault.name}
                  </a>
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      vault.type === "Stable"
                        ? "bg-accent-dim text-accent"
                        : vault.type === "Pegged"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-warning/10 text-warning"
                    }`}
                  >
                    {vault.type}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right">
                  <ApyBadge value={vault.apy7d} />
                </td>
                <td className="py-3 pr-4 text-right">
                  <ApyBadge value={vault.apy30d} />
                </td>
                <td className="py-3 pr-4 text-right font-mono text-foreground">
                  {formatUsd(vault.tvl)}
                </td>
                <td className="py-3">
                  <div className="flex gap-1">
                    {vault.rewards.map((r) => (
                      <span
                        key={r}
                        className="text-xs px-2 py-0.5 rounded-full bg-accent-dim text-accent"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {sorted.map((vault) => (
          <a
            key={vault.name + vault.address}
            href={`${KAMINO_APP_URL}/liquidity`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-card rounded-xl p-4 border border-border hover:border-accent/30 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-medium text-foreground">
                  {vault.name}
                </span>
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    vault.type === "Stable"
                      ? "bg-accent-dim text-accent"
                      : vault.type === "Pegged"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-warning/10 text-warning"
                  }`}
                >
                  {vault.type}
                </span>
              </div>
              <ApyBadge value={vault.apy7d} label="7D" />
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>TVL: {formatUsd(vault.tvl)}</span>
              <span>30D: {vault.apy30d > 0 ? `${vault.apy30d.toFixed(1)}%` : "-"}</span>
            </div>
            {vault.rewards.length > 0 && (
              <div className="flex gap-1 mt-2">
                {vault.rewards.map((r) => (
                  <span
                    key={r}
                    className="text-xs px-2 py-0.5 rounded-full bg-accent-dim text-accent"
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
          </a>
        ))}
      </div>
    </>
  );
}
