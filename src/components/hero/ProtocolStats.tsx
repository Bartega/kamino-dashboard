import { formatUsd } from "@/lib/utils/format";
import type { ProtocolStats as Stats } from "@/lib/api/types";
import { DataBadge } from "../shared/DataBadge";

export function ProtocolStats({
  stats,
  source,
}: {
  stats: Stats;
  source: "live" | "static";
}) {
  const items = [
    { label: "Total TVL", value: formatUsd(stats.tvl) },
    { label: "Total Deposits", value: formatUsd(stats.totalDeposits) },
    { label: "Loans Issued", value: formatUsd(stats.loansIssued) },
    { label: "Active Markets", value: String(stats.activeMarkets) },
    { label: "Security Audits", value: String(stats.audits) },
    { label: "Bad Debt", value: stats.badDebt },
  ];

  return (
    <div id="overview" className="scroll-mt-20">
      <div className="bg-kamino-blue rounded-2xl p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Kamino Opportunities
          </h1>
          <DataBadge source={source} />
        </div>
        <p className="text-muted text-sm mb-6 max-w-2xl">
          Live and curated yield opportunities across Kamino Finance - the
          largest DeFi protocol on Solana. Lending markets, liquidity vaults,
          and leveraged strategies.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="bg-background/70 rounded-xl p-4 backdrop-blur-sm"
            >
              <p className="text-xs text-muted mb-1">{item.label}</p>
              <p className="text-lg font-bold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
