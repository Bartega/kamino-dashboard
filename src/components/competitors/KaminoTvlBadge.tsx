import { formatUsd } from "@/lib/utils/format";

export function KaminoTvlBadge({ tvl }: { tvl: number }) {
  return (
    <div className="bg-card rounded-xl px-5 py-3 text-right shrink-0">
      <p className="text-xs text-muted mb-0.5">Kamino TVL</p>
      <p className="text-xl font-bold text-foreground font-mono">
        {formatUsd(tvl)}
      </p>
    </div>
  );
}
