import type { FeaturedOpportunity } from "@/lib/data/featured";

const CATEGORY_COLORS: Record<string, string> = {
  borrow: "bg-kamino-blue/40",
  liquidity: "bg-liquidity-blue/25",
  multiply: "bg-kamino-blue/20",
};

export function FeaturedCard({
  opportunity,
  categoryId,
}: {
  opportunity: FeaturedOpportunity;
  categoryId?: string;
}) {
  const headerBg = CATEGORY_COLORS[categoryId ?? ""] ?? "";

  return (
    <a
      href={opportunity.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl border border-border hover:border-liquidity-blue hover:shadow-md transition-all group overflow-hidden"
    >
      <div className={`flex items-center justify-between px-5 pt-4 pb-3 ${headerBg}`}>
        <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
          {opportunity.title}
        </h3>
        <span className="text-sm font-mono font-bold text-accent shrink-0 ml-3">
          {opportunity.highlight}
        </span>
      </div>
      <div className="px-5 pb-5 pt-3">
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
      </div>
    </a>
  );
}
