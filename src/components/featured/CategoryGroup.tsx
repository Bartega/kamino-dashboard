import type { OpportunityCategory } from "@/lib/data/featured";
import { FeaturedCard } from "./FeaturedOpportunity";
import { RiskDisclaimer } from "../shared/RiskDisclaimer";

export function CategoryGroup({
  category,
}: {
  category: OpportunityCategory;
}) {
  return (
    <section id={category.id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {category.title}
      </h2>
      <p className="text-sm text-muted leading-relaxed mb-6 max-w-3xl">
        {category.description}
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {category.opportunities.map((opp) => (
          <FeaturedCard key={opp.title} opportunity={opp} />
        ))}
      </div>
      <RiskDisclaimer
        title={`Risks to Understand - ${category.title}`}
        risks={category.risks}
      />
    </section>
  );
}
