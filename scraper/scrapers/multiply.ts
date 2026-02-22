import type { Page } from "playwright";
import type { ScrapedMultiplyStrategy } from "../types.js";
import { waitForTable, parseDollarValue, parsePercent } from "../utils.js";

export async function scrapeMultiply(page: Page): Promise<{
  strategies: ScrapedMultiplyStrategy[];
  totalDeposits: number;
  activeBorrows: number;
}> {
  await page.goto("https://kamino.com/multiply", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await waitForTable(page);

  const raw = await page.evaluate(`(() => {
    const allText = document.body.innerText;
    const rows = document.querySelectorAll("table tbody tr");
    const rowData = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 7) return;

      rowData.push({
        supply: cells[0].textContent?.trim() || "",
        borrowToken: cells[1].textContent?.trim() || "",
        maxNetApy: cells[2].textContent?.trim() || "",
        maxLeverage: cells[3].textContent?.trim() || "",
        liqAvailable: cells[4].textContent?.trim() || "",
        supplied: cells[5].textContent?.trim() || "",
        strategy: cells[6].textContent?.trim() || "",
      });
    });

    return { allText: allText.substring(0, 2000), rowData };
  })()`) as {
    allText: string;
    rowData: Array<{
      supply: string;
      borrowToken: string;
      maxNetApy: string;
      maxLeverage: string;
      liqAvailable: string;
      supplied: string;
      strategy: string;
    }>;
  };

  const depositsMatch = raw.allText.match(/Total Deposits\s*\n?\s*\$?([\d,.]+[BMK]?)/);
  const borrowsMatch = raw.allText.match(/Active Borrows\s*\n?\s*\$?([\d,.]+[BMK]?)/);
  const totalDeposits = depositsMatch ? parseDollarValue(depositsMatch[1]) : 0;
  const activeBorrows = borrowsMatch ? parseDollarValue(borrowsMatch[1]) : 0;

  const marketPatterns = [
    "Prime Market", "Main Market", "JLP Market", "Maple Market",
    "Jito Market", "OnRe Market", "Marinade Market", "Solstice Market",
    "Sanctum Market", "Solblaze Market", "xxStocks Market",
    "rstSOL Leverage Market",
  ];

  const strategies: ScrapedMultiplyStrategy[] = raw.rowData.map((row) => {
    let supply = row.supply;
    let market = "";
    for (const mp of marketPatterns) {
      if (row.supply.endsWith(mp)) {
        supply = row.supply.slice(0, -mp.length).trim();
        market = mp;
        break;
      }
    }

    return {
      supply,
      market,
      borrowToken: row.borrowToken,
      maxNetApy: parsePercent(row.maxNetApy),
      maxLeverage: row.maxLeverage,
      liqAvailable: parseDollarValue(row.liqAvailable),
      supplied: parseDollarValue(row.supplied),
      strategy: row.strategy,
    };
  });

  console.log(`  Multiply: ${strategies.length} strategies, deposits: $${(totalDeposits / 1e6).toFixed(1)}M`);
  return { strategies, totalDeposits, activeBorrows };
}
