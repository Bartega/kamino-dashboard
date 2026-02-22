import { formatApy } from "@/lib/utils/format";

export function ApyBadge({ value, label }: { value: number; label?: string }) {
  const color =
    value >= 10
      ? "text-accent"
      : value >= 5
        ? "text-liquidity-blue"
        : "text-foreground";

  return (
    <span className={`font-mono font-semibold ${color}`}>
      {label && <span className="text-muted text-xs mr-1">{label}</span>}
      {formatApy(value)}
    </span>
  );
}
