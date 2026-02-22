import type { Page } from "playwright";
import type { ScrapedLiquidityVault } from "../types.js";
import { waitForTable, parseDollarValue, parsePercent } from "../utils.js";

export async function scrapeLiquidity(page: Page): Promise<{
  vaults: ScrapedLiquidityVault[];
  totalDeposits: number;
  feesGenerated: number;
}> {
  await page.goto("https://kamino.com/liquidity", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await waitForTable(page);

  // Scroll to load virtualised rows
  await page.evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
  await page.waitForTimeout(2000);
  await page.evaluate(`window.scrollTo(0, 0)`);
  await page.waitForTimeout(1000);

  const raw = await page.evaluate(`(() => {
    const allText = document.body.innerText;
    const rows = document.querySelectorAll("table tbody tr");
    const rowData = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 5) return;

      rowData.push({
        pair: cells[0].textContent?.trim() || "",
        feesApy: cells[1].textContent?.trim() || "",
        volume: cells[2].textContent?.trim() || "",
        tvl: cells[3].textContent?.trim() || "",
        dex: cells[4].textContent?.trim() || "",
      });
    });

    return { allText: allText.substring(0, 2000), rowData };
  })()`) as {
    allText: string;
    rowData: Array<{
      pair: string;
      feesApy: string;
      volume: string;
      tvl: string;
      dex: string;
    }>;
  };

  const depositsMatch = raw.allText.match(/Total Deposits\s*\n?\s*\$?([\d,.]+[BMK]?)/);
  const feesMatch = raw.allText.match(/Fees Generated\s*\n?\s*\$?([\d,.]+[BMK]?)/);
  const totalDeposits = depositsMatch ? parseDollarValue(depositsMatch[1]) : 0;
  const feesGenerated = feesMatch ? parseDollarValue(feesMatch[1]) : 0;

  const vaults: ScrapedLiquidityVault[] = raw.rowData.map((row) => ({
    pair: row.pair,
    feesApy7d: parsePercent(row.feesApy),
    volume7d: parseDollarValue(row.volume),
    tvl: parseDollarValue(row.tvl),
    dex: row.dex,
  }));

  console.log(`  Liquidity: ${vaults.length} vaults, total deposits: $${(totalDeposits / 1e6).toFixed(1)}M`);
  return { vaults, totalDeposits, feesGenerated };
}
