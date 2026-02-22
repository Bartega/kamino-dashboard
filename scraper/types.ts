export interface ScrapedBorrowAsset {
  asset: string;
  market: string;
  totalSupply: number;
  totalBorrow: number;
  liqLtv: number;
  supplyApy: number;
  borrowApy: number;
}

export interface ScrapedLiquidityVault {
  pair: string;
  feesApy7d: number;
  volume7d: number;
  tvl: number;
  dex: string;
}

export interface ScrapedMultiplyStrategy {
  supply: string;
  market: string;
  borrowToken: string;
  maxNetApy: number;
  maxLeverage: string;
  liqAvailable: number;
  supplied: number;
  strategy: string;
}

export interface ScrapedStats {
  borrowMarketSize: number;
  borrowActiveBorrows: number;
  liquidityDeposits: number;
  liquidityFeesGenerated: number;
  multiplyDeposits: number;
  multiplyBorrows: number;
}

export interface ScrapedData {
  timestamp: string;
  version: number;
  stats: ScrapedStats;
  borrow: ScrapedBorrowAsset[];
  liquidity: ScrapedLiquidityVault[];
  multiply: ScrapedMultiplyStrategy[];
}
