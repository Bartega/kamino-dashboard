// --- Kamino API response types ---

export interface KaminoMarketResponse {
  lendingMarket: string;
  name: string;
  description: string;
  isPrimary: boolean;
}

export interface KaminoStrategyResponse {
  address: string;
  type: string;
  status: string;
  tokenAMint: string;
  tokenBMint: string;
  strategyDex: string;
}

export interface StrategyMetricsResponse {
  strategy: string;
  tokenA: string;
  tokenB: string;
  kaminoApy?: {
    vault?: {
      apr7d?: number;
      apy7d?: number;
      apr24h?: number;
      apy24h?: number;
      apr30d?: number;
      apy30d?: number;
    };
  };
  apy?: {
    vault?: {
      feeApr?: number;
      feeApy?: number;
      totalApr?: number;
      totalApy?: number;
      rewardsApr?: number[];
      rewardsApy?: number[];
    };
  };
  totalValueLocked?: number;
  vaultBalances?: {
    tokenA?: { totalUsd?: number };
    tokenB?: { totalUsd?: number };
  };
  sharePrice?: number;
}

export interface DefiLlamaProtocol {
  name: string;
  currentChainTvls: Record<string, number>;
  chainTvls: Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;
}

// --- Display types (normalised for UI) ---

export interface DisplayMarket {
  name: string;
  collateral: string;
  borrowApy: number;
  marketSize: number;
  address?: string;
}

export interface DisplayVault {
  name: string;
  tokenA: string;
  tokenB: string;
  type: string;
  apy7d: number;
  apy30d: number;
  tvl: number;
  rewards: string[];
  address?: string;
}

export interface DisplayMultiply {
  name: string;
  collateral: string;
  debt: string;
  maxLeverage: string;
  netApyRange: string;
  type: string;
}

export interface ProtocolStats {
  tvl: number;
  totalDeposits: number;
  loansIssued: number;
  activeMarkets: number;
  audits: number;
  badDebt: string;
}

export interface ApiResponse<T> {
  source: "live" | "static";
  data: T;
  updatedAt: string;
}
