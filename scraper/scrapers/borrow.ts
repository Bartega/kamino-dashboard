import type { Page } from "playwright";
import type { ScrapedBorrowAsset } from "../types.js";
import { waitForTable, parseDollarValue, parsePercent } from "../utils.js";

function parseCompositePercent(s: string): number {
  if (!s || s === "-") return 0;
  // Handle composite APYs like "4.36%+4.73%" by summing parts
  const parts = s.split("+").map((p) => parsePercent(p.trim()));
  return parts.reduce((sum, v) => sum + v, 0);
}

export async function scrapeBorrow(page: Page): Promise<{
  assets: ScrapedBorrowAsset[];
  marketSize: number;
  activeBorrows: number;
}> {
  await page.goto("https://kamino.com/borrow", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await waitForTable(page);

  const raw = await page.evaluate(`(() => {
    var allText = document.body.innerText;
    var tables = document.querySelectorAll("table");
    var result = [];

    var marketNames = [
      "Prime Market", "Main Market", "JLP Market", "Maple Market",
      "Jito Market", "OnRe Market", "Marinade Market", "Solstice Market",
      "Sanctum Market", "Solblaze Market", "xxStocks Market",
    ];

    for (var t = 0; t < tables.length; t++) {
      // Walk up DOM to find market name
      var el = tables[t].parentElement;
      var marketName = "";
      while (el && !marketName) {
        var elText = el.textContent || "";
        for (var m = 0; m < marketNames.length; m++) {
          if (elText.indexOf(marketNames[m]) !== -1) {
            marketName = marketNames[m];
            break;
          }
        }
        el = el.parentElement;
      }

      var rows = tables[t].querySelectorAll("tbody tr");
      for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].querySelectorAll("td");
        if (cells.length < 5) continue;

        var pTags = cells[0].querySelectorAll("p");
        var asset = pTags.length > 0 ? pTags[0].textContent.trim() : cells[0].textContent.trim();

        // Skip aggregate rows like "LSTs"
        if (!asset || asset.length > 10) continue;

        result.push({
          asset: asset,
          market: marketName,
          totalSupply: cells[1].textContent.trim(),
          totalBorrow: cells[2].textContent.trim(),
          liqLtv: cells[3].textContent.trim(),
          supplyApy: cells[4].textContent.trim(),
          borrowApy: cells.length > 6 ? cells[6].textContent.trim() : "",
        });
      }
    }

    return { allText: allText.substring(0, 2000), rows: result };
  })()`) as {
    allText: string;
    rows: Array<{
      asset: string;
      market: string;
      totalSupply: string;
      totalBorrow: string;
      liqLtv: string;
      supplyApy: string;
      borrowApy: string;
    }>;
  };

  // Parse summary stats
  const marketSizeMatch = raw.allText.match(
    /Market Size\s*\n?\s*\$?([\d,.]+[BMK]?)/
  );
  const borrowsMatch = raw.allText.match(
    /Active Borrows\s*\n?\s*\$?([\d,.]+[BMK]?)/
  );
  const marketSize = marketSizeMatch ? parseDollarValue(marketSizeMatch[1]) : 0;
  const activeBorrows = borrowsMatch ? parseDollarValue(borrowsMatch[1]) : 0;

  // Parse rows
  const assets: ScrapedBorrowAsset[] = raw.rows.map((row) => ({
    asset: row.asset,
    market: row.market,
    totalSupply: parseDollarValue(row.totalSupply),
    totalBorrow: parseDollarValue(row.totalBorrow),
    liqLtv: parsePercent(row.liqLtv),
    supplyApy: parseCompositePercent(row.supplyApy),
    borrowApy: parseCompositePercent(row.borrowApy),
  }));

  console.log(
    `  Borrow: ${assets.length} assets, market size: $${(marketSize / 1e9).toFixed(2)}B`
  );
  return { assets, marketSize, activeBorrows };
}
