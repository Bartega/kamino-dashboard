import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCompetitorData } from "@/lib/data/fetch-competitors";
import { CompetitorCharts } from "@/components/competitors/CompetitorCharts";

export const revalidate = 300;

export default async function AnalysisPage() {
  const data = getCompetitorData();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Analysis
          </h1>
          <p className="text-muted text-sm mt-1">
            Charts and metrics across all tracked competitors.
          </p>
        </div>

        {data?.timestamp && (
          <p className="text-xs text-muted text-right -mt-4">
            Data updated:{" "}
            {new Date(data.timestamp).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        )}

        {data ? (
          <CompetitorCharts data={data} />
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted">
              No competitor data available yet.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
