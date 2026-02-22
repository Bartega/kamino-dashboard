import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { CATEGORIES, type OpportunityCategory } from "./featured";

interface ScrapedLendVault {
  name: string;
  curator: string;
  apy: number;
  deposits: number;
  profile: string;
  collateralCount: number;
}

interface ScrapedLiquidityVault {
  pair: string;
  feesApy7d: number;
  volume7d: number;
  tvl: number;
  dex: string;
}

interface ScrapedMultiplyStrategy {
  supply: string;
  market: string;
  borrowToken: string;
  maxNetApy: number;
  maxLeverage: string;
  liqAvailable: number;
  supplied: number;
  strategy: string;
}

interface ScrapedStats {
  lendMarketSize: number;
  lendVaultDeposits: number;
  liquidityDeposits: number;
  liquidityFeesGenerated: number;
  multiplyDeposits: number;
  multiplyBorrows: number;
}

interface ScrapedData {
  timestamp: string;
  version: number;
  stats: ScrapedStats;
  lend: ScrapedLendVault[];
  liquidity: ScrapedLiquidityVault[];
  multiply: ScrapedMultiplyStrategy[];
}

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const SCRAPED_PATH = resolve(process.cwd(), "src/lib/data/scraped-data.json");

function fmtUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPct(n: number): string {
  if (n >= 100) return `${n.toFixed(0)}%`;
  if (n >= 10) return `${n.toFixed(1)}%`;
  return `${n.toFixed(2)}%`;
}

function findLendVault(data: ScrapedData, fragment: string): ScrapedLendVault | undefined {
  return data.lend.find((v) =>
    v.name.toLowerCase().includes(fragment.toLowerCase())
  );
}

function findLiqVault(data: ScrapedData, fragment: string): ScrapedLiquidityVault | undefined {
  return data.liquidity.find((v) =>
    v.pair.toLowerCase().includes(fragment.toLowerCase())
  );
}

function findMultiply(
  data: ScrapedData,
  supply: string,
  borrowToken?: string
): ScrapedMultiplyStrategy | undefined {
  return data.multiply.find(
    (s) =>
      s.supply.toLowerCase() === supply.toLowerCase() &&
      (!borrowToken || s.borrowToken.toLowerCase() === borrowToken.toLowerCase())
  );
}

function bestMultiply(data: ScrapedData, supply: string): ScrapedMultiplyStrategy | undefined {
  const matches = data.multiply.filter(
    (s) => s.supply.toLowerCase() === supply.toLowerCase() && s.maxNetApy > 0
  );
  if (matches.length === 0) return undefined;
  return matches.reduce((best, s) => (s.maxNetApy > best.maxNetApy ? s : best));
}

function sumSupplied(data: ScrapedData, market: string): number {
  return data.multiply
    .filter((s) => s.market === market)
    .reduce((sum, s) => sum + s.supplied, 0);
}

// Merge scraped numbers into a single featured card
function mergeLending(
  data: ScrapedData,
  title: string,
  opp: { highlight: string; details?: string[] }
): { highlight: string; details?: string[] } {
  switch (title) {
    case "PYUSD Lending": {
      const vault = findLendVault(data, "PYUSD");
      if (!vault) return opp;
      return {
        highlight: `${fmtPct(vault.apy)} lending APY`,
        details: [
          `${fmtUsd(vault.deposits)}+ deposited`,
          `${fmtPct(vault.apy)} APY`,
          opp.details?.[2] || "PayPal-backed stablecoin",
        ],
      };
    }
    case "Main Market": {
      const size = data.stats.lendMarketSize;
      if (!size) return opp;
      return {
        highlight: `${fmtUsd(size)} market size`,
        details: opp.details,
      };
    }
    case "Prime Market (Figure)": {
      const supplied = sumSupplied(data, "Prime Market");
      const best = data.multiply.find(
        (s) => s.market === "Prime Market" && s.maxNetApy > 0
      );
      if (!supplied && !best) return opp;
      return {
        highlight: best ? `${fmtPct(best.maxNetApy)} max net APY` : opp.highlight,
        details: [
          supplied ? `Market size: ${fmtUsd(supplied)}` : opp.details?.[0] || "",
          opp.details?.[1] || "Real-world asset collateral",
          opp.details?.[2] || "Institutional-grade lending",
        ],
      };
    }
    case "Maple Market (syrupUSDC)": {
      const syrup = data.multiply.filter(
        (s) => s.supply.toLowerCase() === "syrupusdc"
      );
      const best = syrup.reduce(
        (b, s) => (s.maxNetApy > b.maxNetApy ? s : b),
        syrup[0]
      );
      const supplied = syrup.reduce((sum, s) => sum + s.supplied, 0);
      if (!best) return opp;
      return {
        highlight: best.maxNetApy > 0 ? `${fmtPct(best.maxNetApy)} max net APY` : opp.highlight,
        details: [
          supplied ? `Market size: ${fmtUsd(supplied)}` : opp.details?.[0] || "",
          opp.details?.[1] || "Institutional borrowers",
          opp.details?.[2] || "Over-collateralised loans",
        ],
      };
    }
    default:
      return opp;
  }
}

function mergeLiquidity(
  data: ScrapedData,
  title: string,
  opp: { highlight: string; details?: string[] }
): { highlight: string; details?: string[] } {
  switch (title) {
    case "JitoSOL-SOL Drift Strategy": {
      const vault = findLiqVault(data, "JITOSOL-SOL");
      if (!vault) return opp;
      const effective = vault.feesApy7d + 4.25; // hidden LST yield
      return {
        highlight: `~${Math.round(effective)}% effective APY`,
        details: [
          `Displayed: ${fmtPct(vault.feesApy7d)} APY`,
          opp.details?.[1] || "Hidden LST yield: ~4.25%",
          opp.details?.[2] || "100K monthly JTO incentives",
          opp.details?.[3] || "$1M+ fees generated since inception",
        ],
      };
    }
    case "JUP-BONK": {
      const vault = findLiqVault(data, "JUP-BONK");
      if (!vault) return opp;
      return {
        highlight: `${fmtPct(vault.feesApy7d)} 7D APY`,
        details: opp.details,
      };
    }
    case "PYUSD-USDC": {
      const vault = findLiqVault(data, "PYUSD-USDC");
      if (!vault) return opp;
      return {
        highlight: `${fmtPct(vault.feesApy7d)} 7D APY`,
        details: opp.details,
      };
    }
    case "PST-USDC (Huma)": {
      const vault = findLiqVault(data, "PST-USDC");
      if (!vault) return opp;
      const effective = vault.feesApy7d + 5; // native PST yield
      return {
        highlight: `~${Math.round(effective)}% effective APY`,
        details: [
          `Displayed: ${fmtPct(vault.feesApy7d)} APY`,
          opp.details?.[1] || "Native PST yield: ~5%",
          opp.details?.[2] || "Yield-bearing stablecoin",
        ],
      };
    }
    case "hyUSD-USDC": {
      const vault = findLiqVault(data, "hyUSD-USDC");
      if (!vault) return opp;
      return {
        highlight: `${fmtPct(vault.feesApy7d)} 7D APY`,
        details: opp.details,
      };
    }
    default:
      return opp;
  }
}

function mergeMultiply(
  data: ScrapedData,
  title: string,
  opp: { highlight: string; details?: string[] }
): { highlight: string; details?: string[] } {
  switch (title) {
    case "JLP Multiply": {
      const best = bestMultiply(data, "JLP");
      if (!best) return opp;
      return {
        highlight: `Up to ${fmtPct(best.maxNetApy)} Net APY`,
        details: [
          `Up to ${best.maxLeverage} leverage`,
          opp.details?.[1] || "",
          opp.details?.[2] || "Flash loan fee: 0.001%",
        ],
      };
    }
    case "JitoSOL Multiply": {
      const strat = findMultiply(data, "JITOSOL", "SOL");
      if (!strat) return opp;
      return {
        highlight: `${fmtPct(strat.maxNetApy)} Net APY`,
        details: [
          `Up to ${strat.maxLeverage} leverage (eMode)`,
          opp.details?.[1] || "Correlated pair - no price liquidation risk",
          opp.details?.[2] || "Risk: borrow rate exceeding staking yield",
        ],
      };
    }
    case "PYUSD Loop": {
      const strat = findMultiply(data, "USDC", "PYUSD");
      if (!strat) return opp;
      return {
        highlight: `Up to ${fmtPct(strat.maxNetApy)} leveraged yield`,
        details: [
          `Up to ${strat.maxLeverage} leverage`,
          opp.details?.[1] || "Stable-stable pair",
          opp.details?.[2] || "Lowest borrow rates on Solana",
        ],
      };
    }
    case "mSOL / bSOL Multiply": {
      const msol = findMultiply(data, "MSOL", "SOL");
      const bsol = findMultiply(data, "BSOL", "SOL");
      const apys = [msol?.maxNetApy, bsol?.maxNetApy].filter(
        (a): a is number => a !== undefined && a > 0
      );
      if (apys.length === 0) return opp;
      const min = Math.min(...apys);
      const max = Math.max(...apys);
      return {
        highlight: `${fmtPct(min)}-${fmtPct(max)} Net APY`,
        details: [
          `Up to ${msol?.maxLeverage || bsol?.maxLeverage || "7.7x"} leverage`,
          opp.details?.[1] || "Multiple LST options",
          opp.details?.[2] || "Correlated pair dynamics",
        ],
      };
    }
    default:
      return opp;
  }
}

function mergeCategoryDescription(
  data: ScrapedData,
  catId: string,
  description: string
): string {
  if (catId === "lending") {
    const size = data.stats.lendMarketSize;
    const vaultCount = data.lend.length;
    if (size) {
      description = description.replace(
        /\$[\d.]+[BM] in total market size/,
        `${fmtUsd(size)} in total market size`
      );
    }
    if (vaultCount) {
      description = description.replace(
        /\d+ isolated and shared markets/,
        `${vaultCount} lending vaults and shared markets`
      );
    }
  }
  if (catId === "liquidity") {
    const tvl = data.stats.liquidityDeposits;
    const fees = data.stats.liquidityFeesGenerated;
    if (tvl) {
      description = description.replace(/\$\d+M\+ TVL/, `${fmtUsd(tvl)}+ TVL`);
    }
    if (fees) {
      description = description.replace(
        /\$\d+M\+ in cumulative fees generated/,
        `${fmtUsd(fees)}+ in cumulative fees generated`
      );
    }
  }
  return description;
}

export function getCategories(): OpportunityCategory[] {
  if (!existsSync(SCRAPED_PATH)) return CATEGORIES;

  let data: ScrapedData;
  try {
    data = JSON.parse(readFileSync(SCRAPED_PATH, "utf-8"));
  } catch {
    return CATEGORIES;
  }

  // Check freshness
  const ageMs = Date.now() - new Date(data.timestamp).getTime();
  if (ageMs > MAX_AGE_MS) return CATEGORIES;

  return CATEGORIES.map((cat) => {
    const mergedDescription = mergeCategoryDescription(
      data,
      cat.id,
      cat.description
    );

    const mergedOpps = cat.opportunities.map((opp) => {
      let merged: { highlight: string; details?: string[] };

      switch (cat.id) {
        case "lending":
          merged = mergeLending(data, opp.title, opp);
          break;
        case "liquidity":
          merged = mergeLiquidity(data, opp.title, opp);
          break;
        case "multiply":
          merged = mergeMultiply(data, opp.title, opp);
          break;
        default:
          merged = opp;
      }

      return {
        ...opp,
        highlight: merged.highlight,
        details: merged.details,
      };
    });

    return {
      ...cat,
      description: mergedDescription,
      opportunities: mergedOpps,
    };
  });
}

export function getScrapedTimestamp(): string | null {
  if (!existsSync(SCRAPED_PATH)) return null;
  try {
    const data = JSON.parse(readFileSync(SCRAPED_PATH, "utf-8"));
    const ageMs = Date.now() - new Date(data.timestamp).getTime();
    if (ageMs > MAX_AGE_MS) return null;
    return data.timestamp;
  } catch {
    return null;
  }
}
