import { writeFileSync, readFileSync, existsSync, renameSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { launchBrowser, withRetry } from "./utils.js";
import { scrapeBorrow } from "./scrapers/borrow.js";
import { scrapeLiquidity } from "./scrapers/liquidity.js";
import { scrapeMultiply } from "./scrapers/multiply.js";
import type { ScrapedData } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../src/lib/data/scraped-data.json");

async function main() {
  const pageFilter = process.argv
    .find((a) => a.startsWith("--page"))
    ?.split("=")[1];

  console.log(`[scraper] Starting at ${new Date().toISOString()}`);
  if (pageFilter) console.log(`[scraper] Filtering to: ${pageFilter}`);

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage({
      viewport: { width: 1400, height: 900 },
    });
    page.setDefaultTimeout(30_000);

    // Load existing data for partial updates
    let existing: ScrapedData | null = null;
    if (existsSync(OUTPUT_PATH)) {
      try {
        existing = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
      } catch {
        /* ignore corrupt file */
      }
    }

    const data: ScrapedData = {
      timestamp: new Date().toISOString(),
      version: 2,
      stats: existing?.stats || {
        borrowMarketSize: 0,
        borrowActiveBorrows: 0,
        liquidityDeposits: 0,
        liquidityFeesGenerated: 0,
        multiplyDeposits: 0,
        multiplyBorrows: 0,
      },
      borrow: existing?.borrow || [],
      liquidity: existing?.liquidity || [],
      multiply: existing?.multiply || [],
    };

    if (!pageFilter || pageFilter === "borrow") {
      console.log("[scraper] Scraping borrow page...");
      const result = await withRetry(() => scrapeBorrow(page));
      data.borrow = result.assets;
      data.stats.borrowMarketSize = result.marketSize;
      data.stats.borrowActiveBorrows = result.activeBorrows;
    }

    if (!pageFilter || pageFilter === "liquidity") {
      console.log("[scraper] Scraping liquidity page...");
      const result = await withRetry(() => scrapeLiquidity(page));
      data.liquidity = result.vaults;
      data.stats.liquidityDeposits = result.totalDeposits;
      data.stats.liquidityFeesGenerated = result.feesGenerated;
    }

    if (!pageFilter || pageFilter === "multiply") {
      console.log("[scraper] Scraping multiply page...");
      const result = await withRetry(() => scrapeMultiply(page));
      data.multiply = result.strategies;
      data.stats.multiplyDeposits = result.totalDeposits;
      data.stats.multiplyBorrows = result.activeBorrows;
    }

    data.timestamp = new Date().toISOString();

    // Atomic write
    const tmpPath = OUTPUT_PATH + ".tmp";
    writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    renameSync(tmpPath, OUTPUT_PATH);

    console.log(`[scraper] Written to ${OUTPUT_PATH}`);
    console.log(`[scraper] Finished at ${new Date().toISOString()}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("[scraper] Fatal error:", err);
  process.exit(1);
});
