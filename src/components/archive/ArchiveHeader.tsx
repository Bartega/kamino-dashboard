import type { ArchiveStats } from "@/lib/api/competitor-types";

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function ArchiveHeader({ stats }: { stats: ArchiveStats | null }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Tweet Archive
        </h1>
        <p className="text-muted text-sm mt-1">
          Historical tweet data with performance analysis.
        </p>
      </div>
      {stats && (
        <div className="flex flex-wrap gap-3">
          <StatBadge
            label="Total archived"
            value={stats.totalTweets.toLocaleString()}
          />
          <StatBadge
            label="Competitors"
            value={String(stats.competitorCount)}
          />
          {stats.topByVolume && (
            <StatBadge
              label="Most active"
              value={`@${stats.topByVolume.handle} (${stats.topByVolume.count})`}
            />
          )}
          {stats.topByEngagement && (
            <StatBadge
              label="Highest engagement"
              value={`@${stats.topByEngagement.handle} (${stats.topByEngagement.avgRate}%)`}
            />
          )}
        </div>
      )}
    </div>
  );
}
