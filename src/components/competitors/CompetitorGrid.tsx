import type { CompetitorData } from "@/lib/api/competitor-types";
import { CompetitorCard } from "./CompetitorCard";

export function CompetitorGrid({
  competitors,
}: {
  competitors: CompetitorData[];
}) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      {competitors.map((comp) => (
        <CompetitorCard key={comp.twitterHandle} competitor={comp} />
      ))}
    </div>
  );
}
