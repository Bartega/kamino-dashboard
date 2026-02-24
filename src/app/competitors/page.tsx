import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCompetitorData } from "@/lib/data/fetch-competitors";
import { KaminoTvlBadge } from "@/components/competitors/KaminoTvlBadge";
import { HighlightsBar } from "@/components/competitors/HighlightsBar";
import { CompetitorGrid } from "@/components/competitors/CompetitorGrid";
import { CompetitorCharts } from "@/components/competitors/CompetitorCharts";
import { CompetitorAdmin } from "@/components/competitors/CompetitorAdmin";

export const revalidate = 300;

export default async function CompetitorsPage() {
  const data = getCompetitorData();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page header with Kamino TVL top-right */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Competitor Intelligence
            </h1>
            <p className="text-muted text-sm mt-1 max-w-2xl">
              Track competitor activity across Twitter and DeFi Llama.
              Updated four times daily.
            </p>
          </div>
          {data && <KaminoTvlBadge tvl={data.kaminoTvl} />}
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
          <>
            <HighlightsBar
              highlights={data.highlights}
              competitors={data.competitors}
            />
            <CompetitorGrid competitors={data.competitors} />
            <CompetitorCharts data={data} />
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted">
              No competitor data available yet.
            </p>
            <p className="text-sm text-muted mt-2">
              Add competitors below and run the scraper to populate the
              dashboard.
            </p>
          </div>
        )}

        <CompetitorAdmin />
      </main>

      <Footer />
    </div>
  );
}
