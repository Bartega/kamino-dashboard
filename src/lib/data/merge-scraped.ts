import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  CATEGORIES,
  type FeaturedOpportunity,
  type OpportunityCategory,
} from "./featured";

interface ScrapedBorrowAsset {
  asset: string;
  market: string;
  totalSupply: number;
  totalBorrow: number;
  liqLtv: number;
  supplyApy: number;
  borrowApy: number;
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
  borrowMarketSize: number;
  borrowActiveBorrows: number;
  liquidityDeposits: number;
  liquidityFeesGenerated: number;
  multiplyDeposits: number;
  multiplyBorrows: number;
}

interface ScrapedData {
  timestamp: string;
  version: number;
  stats: ScrapedStats;
  borrow: ScrapedBorrowAsset[];
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

// --- Card generation functions ---

function generateBorrowCards(data: ScrapedData): FeaturedOpportunity[] {
  // 4 highest supply APY
  const supplyCards = data.borrow
    .filter((a) => a.supplyApy > 0)
    .sort((a, b) => b.supplyApy - a.supplyApy)
    .slice(0, 4)
    .map((a) => ({
      title: `Supply ${a.asset}`,
      highlight: `${fmtPct(a.supplyApy)} supply APY`,
      description: `Earn yield by supplying ${a.asset} to the ${a.market}. ${fmtUsd(a.totalSupply)} total supply with ${fmtUsd(a.totalBorrow)} in active borrows.`,
      details: [
        `Market: ${a.market}`,
        `Total supply: ${fmtUsd(a.totalSupply)}`,
        `Total borrow: ${fmtUsd(a.totalBorrow)}`,
        ...(a.liqLtv > 0 ? [`Liquidation LTV: ${a.liqLtv}%`] : []),
      ],
      link: "https://kamino.com/borrow",
    }));

  // 2 lowest borrow APY (cheapest to borrow)
  const borrowCards = data.borrow
    .filter((a) => a.borrowApy > 0)
    .sort((a, b) => a.borrowApy - b.borrowApy)
    .slice(0, 2)
    .map((a) => ({
      title: `Borrow ${a.asset}`,
      highlight: `${fmtPct(a.borrowApy)} borrow APY`,
      description: `Borrow ${a.asset} from the ${a.market} at low rates. ${fmtUsd(a.totalSupply - a.totalBorrow)} available liquidity.`,
      details: [
        `Market: ${a.market}`,
        `Available: ${fmtUsd(Math.max(0, a.totalSupply - a.totalBorrow))}`,
        `Total supply: ${fmtUsd(a.totalSupply)}`,
      ],
      link: "https://kamino.com/borrow",
    }));

  return [...supplyCards, ...borrowCards];
}

function generateLiquidityCards(data: ScrapedData): FeaturedOpportunity[] {
  const sorted = data.liquidity
    .filter((v) => v.feesApy7d > 0)
    .sort((a, b) => b.feesApy7d - a.feesApy7d)
    .slice(0, 6);

  // Track duplicates for disambiguation
  const pairCounts = new Map<string, number>();
  for (const v of sorted) {
    pairCounts.set(v.pair, (pairCounts.get(v.pair) || 0) + 1);
  }
  const pairSeen = new Map<string, number>();

  return sorted.map((vault) => {
    let title = vault.pair;
    const count = pairCounts.get(vault.pair) || 1;
    if (count > 1) {
      const idx = (pairSeen.get(vault.pair) || 0) + 1;
      pairSeen.set(vault.pair, idx);
      title = vault.dex ? `${vault.pair} (${vault.dex})` : `${vault.pair} #${idx}`;
    }

    return {
      title,
      highlight: `${fmtPct(vault.feesApy7d)} 7D fees APY`,
      description: `Auto-rebalancing concentrated liquidity vault. ${fmtUsd(vault.volume7d)} in 7-day volume with ${fmtUsd(vault.tvl)} TVL.`,
      details: [
        `7D volume: ${fmtUsd(vault.volume7d)}`,
        `TVL: ${fmtUsd(vault.tvl)}`,
        ...(vault.dex ? [`DEX: ${vault.dex}`] : []),
      ],
      link: "https://kamino.com/liquidity",
    };
  });
}

function generateMultiplyCards(data: ScrapedData): FeaturedOpportunity[] {
  return data.multiply
    .filter((s) => s.maxNetApy > 0)
    .sort((a, b) => b.maxNetApy - a.maxNetApy)
    .slice(0, 6)
    .map((strat) => {
      const title = strat.market
        ? `${strat.supply}/${strat.borrowToken}`
        : strat.supply;

      return {
        title,
        highlight: `${fmtPct(strat.maxNetApy)} max net APY`,
        description: `${strat.strategy} strategy on ${strat.market || "dedicated market"}. Up to ${strat.maxLeverage} leverage with ${fmtUsd(strat.liqAvailable)} liquidity available.`,
        details: [
          `Max leverage: ${strat.maxLeverage}`,
          `Market: ${strat.market || "Dedicated"}`,
          `Supplied: ${fmtUsd(strat.supplied)}`,
        ],
        link: "https://kamino.com/multiply",
      };
    });
}

function buildCategoryDescription(data: ScrapedData, catId: string): string {
  switch (catId) {
    case "borrow":
      return `Securely borrow against your assets or earn yield by supplying. ${fmtUsd(data.stats.borrowMarketSize)} total market size with ${fmtUsd(data.stats.borrowActiveBorrows)} in active borrows. Elevation mode (eMode) enables capital-efficient borrowing of correlated assets with up to 95% LTV.`;
    case "liquidity":
      return `Automated concentrated liquidity on Solana DEXs with ${fmtUsd(data.stats.liquidityDeposits)}+ TVL and ${fmtUsd(data.stats.liquidityFeesGenerated)}+ in cumulative fees generated. Auto-swap, auto-compound, and auto-rebalance handle everything.`;
    case "multiply":
      return `One-click leveraged exposure to yield-bearing assets. Uses K-Lend eMode and flash loans to open positions in a single transaction. ${fmtUsd(data.stats.multiplyDeposits)} in deposits and ${fmtUsd(data.stats.multiplyBorrows)} in active borrows.`;
    default:
      return "";
  }
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

  const generators: Record<string, (d: ScrapedData) => FeaturedOpportunity[]> =
    {
      borrow: generateBorrowCards,
      liquidity: generateLiquidityCards,
      multiply: generateMultiplyCards,
    };

  return CATEGORIES.map((cat) => {
    const gen = generators[cat.id];
    const generated = gen ? gen(data) : [];
    const opportunities =
      generated.length > 0 ? generated : cat.opportunities;
    const description =
      generated.length > 0
        ? buildCategoryDescription(data, cat.id) || cat.description
        : cat.description;

    return { ...cat, description, opportunities };
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
