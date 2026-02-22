import type { Page } from "playwright";
import type { ScrapedLendVault } from "../types.js";
import { waitForTable, parseDollarValue, parsePercent } from "../utils.js";

export async function scrapeLend(page: Page): Promise<{
  vaults: ScrapedLendVault[];
  marketSize: number;
  vaultDeposits: number;
}> {
  await page.goto("https://kamino.com/lend", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await waitForTable(page);

  // Extract raw text from browser, parse in Node.js
  const raw = await page.evaluate(`(() => {
    var allText = document.body.innerText;
    var rows = document.querySelectorAll("table tbody tr");
    var rowData = [];

    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].querySelectorAll("td");
      if (cells.length < 5) continue;

      // Get p elements from first cell for name/curator split
      var pTags = cells[0].querySelectorAll("p");
      var pTexts = [];
      for (var j = 0; j < pTags.length; j++) {
        var t = pTags[j].textContent.trim();
        if (t.length > 0) pTexts.push(t);
      }

      rowData.push({
        pTexts: pTexts,
        apy: cells[1].textContent.trim(),
        deposits: cells[2].textContent.trim(),
        profile: cells[3].textContent.trim(),
        collateral: cells[4].textContent.trim(),
      });
    }

    return { allText: allText.substring(0, 2000), rowData: rowData };
  })()`) as {
    allText: string;
    rowData: Array<{
      pTexts: string[];
      apy: string;
      deposits: string;
      profile: string;
      collateral: string;
    }>;
  };

  // Parse summary stats
  const marketSizeMatch = raw.allText.match(/Market Size\s*\n?\s*\$?([\d,.]+[BMK]?)/);
  const vaultDepositsMatch = raw.allText.match(/Vault Deposits\s*\n?\s*\$?([\d,.]+[BMK]?)/);
  const marketSize = marketSizeMatch ? parseDollarValue(marketSizeMatch[1]) : 0;
  const vaultDeposits = vaultDepositsMatch ? parseDollarValue(vaultDepositsMatch[1]) : 0;

  // Parse rows
  const vaults: ScrapedLendVault[] = raw.rowData.map((row) => {
    // pTexts should be [name, curator] from the two <p> elements
    const name = row.pTexts[0] || "";
    const curator = row.pTexts[1] || "";

    return {
      name,
      curator,
      apy: parsePercent(row.apy),
      deposits: parseDollarValue(row.deposits),
      profile: row.profile,
      collateralCount: parseInt(row.collateral.replace(/[^0-9]/g, "")) || 0,
    };
  });

  console.log(`  Lend: ${vaults.length} vaults, market size: $${(marketSize / 1e9).toFixed(2)}B`);
  return { vaults, marketSize, vaultDeposits };
}
