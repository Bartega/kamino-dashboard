import type { FeaturedOpportunity } from "@/lib/data/featured";

export function FeaturedCard({
  opportunity,
}: {
  opportunity: FeaturedOpportunity;
}) {
  return (
    <a
      href={opportunity.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl p-5 border border-border hover:border-liquidity-blue hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
          {opportunity.title}
        </h3>
        <span className="text-sm font-mono font-bold text-accent shrink-0 ml-3">
          {opportunity.highlight}
        </span>
      </div>
      <p className="text-sm text-muted leading-relaxed mb-3">
        {opportunity.description}
      </p>
      {opportunity.details && opportunity.details.length > 0 && (
        <ul className="space-y-1">
          {opportunity.details.map((d) => (
            <li key={d} className="text-xs text-muted flex items-start gap-2">
              <span className="text-liquidity-blue mt-0.5 shrink-0">-</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}
    </a>
  );
}
