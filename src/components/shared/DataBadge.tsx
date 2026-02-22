export function DataBadge({ source }: { source: "live" | "static" }) {
  if (source === "live") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
      <span className="w-1.5 h-1.5 rounded-full bg-liquidity-blue" />
      Curated
    </span>
  );
}
