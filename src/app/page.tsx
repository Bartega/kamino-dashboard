import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProtocolStats } from "@/components/hero/ProtocolStats";
import { CategoryGroup } from "@/components/featured/CategoryGroup";
import { getCategories, getScrapedTimestamp } from "@/lib/data/merge-scraped";
import { getProtocolStats } from "@/lib/data/fetch-all";

export const revalidate = 300;

export default async function Home() {
  const statsRes = await getProtocolStats();
  const categories = getCategories();
  const scrapedAt = getScrapedTimestamp();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <ProtocolStats stats={statsRes.data} source={statsRes.source} />

        {scrapedAt && (
          <p className="text-xs text-muted text-right -mt-8">
            Data updated: {new Date(scrapedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        )}

        {categories.map((cat) => (
          <CategoryGroup key={cat.id} category={cat} />
        ))}
      </main>

      <Footer />
    </div>
  );
}
