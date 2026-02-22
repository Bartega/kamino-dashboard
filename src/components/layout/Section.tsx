import { ReactNode } from "react";
import { DataBadge } from "../shared/DataBadge";

export function Section({
  id,
  title,
  description,
  source,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  source?: "live" | "static";
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {source && <DataBadge source={source} />}
      </div>
      {description && (
        <p className="text-muted text-sm leading-relaxed mb-6 max-w-3xl">
          {description}
        </p>
      )}
      {children}
    </section>
  );
}
