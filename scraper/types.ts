export interface ScrapedLendVault {
  name: string;
  curator: string;
  apy: number;
  deposits: number;
  profile: string;
  collateralCount: number;
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
  lendMarketSize: number;
  lendVaultDeposits: number;
  liquidityDeposits: number;
  liquidityFeesGenerated: number;
  multiplyDeposits: number;
  multiplyBorrows: number;
}

export interface ScrapedData {
  timestamp: string;
  version: number;
  stats: ScrapedStats;
  lend: ScrapedLendVault[];
  liquidity: ScrapedLiquidityVault[];
  multiply: ScrapedMultiplyStrategy[];
}
