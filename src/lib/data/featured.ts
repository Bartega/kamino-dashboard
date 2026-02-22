export interface FeaturedOpportunity {
  title: string;
  highlight: string;
  description: string;
  details?: string[];
  link: string;
}

export interface OpportunityCategory {
  id: string;
  title: string;
  description: string;
  opportunities: FeaturedOpportunity[];
  risks: string[];
}

export const CATEGORIES: OpportunityCategory[] = [
  {
    id: "lending",
    title: "Lending & Borrowing",
    description:
      "K-Lend powers 26 isolated and shared markets with $2.65B in total market size. Elevation mode (eMode) enables capital-efficient borrowing of correlated assets with up to 95% LTV. Soft liquidations and dynamic penalties protect positions.",
    opportunities: [
      {
        title: "PYUSD Lending",
        highlight: "<5% borrow rate",
        description:
          "The lowest borrow rate on Solana. Over $190M in available liquidity with PayPal-backed stability. A straightforward lending opportunity with deep liquidity.",
        details: [
          "Market size: $190M+ borrowable",
          "Borrow APY under 5%",
          "PayPal-backed stablecoin",
        ],
        link: "https://kamino.com/lend",
      },
      {
        title: "Main Market",
        highlight: "$1.47B market size",
        description:
          "The primary lending market on Kamino supporting SOL and 27 additional assets. The deepest liquidity pool across all of Solana DeFi with 5.35% borrow APY.",
        details: [
          "SOL + 27 assets",
          "5.35% borrow APY",
          "Largest single market on Solana",
        ],
        link: "https://kamino.com/lend",
      },
      {
        title: "Prime Market (Figure)",
        highlight: "6.40% borrow APY",
        description:
          "Backed by PRIME (Figure) HELOC collateral - real-world home equity lines of credit tokenised on Solana. $473M in market size. Productive debt backed by real assets.",
        details: [
          "Market size: $473.55M",
          "Real-world asset collateral",
          "Institutional-grade lending",
        ],
        link: "https://kamino.com/lend",
      },
      {
        title: "Maple Market (syrupUSDC)",
        highlight: "3.16% borrow APY",
        description:
          "Institutional lending powered by Maple Finance. syrupUSDC provides yield from institutional borrowers with over-collateralised loans. $242M in market size.",
        details: [
          "Market size: $242.52M",
          "Institutional borrowers",
          "Over-collateralised loans",
        ],
        link: "https://kamino.com/lend",
      },
    ],
    risks: [
      "Liquidation risk - If collateral value drops below the loan-to-value threshold, partial liquidation occurs. Kamino uses soft liquidations (20% of debt) with dynamic penalties (2-10%).",
      "Smart contract risk - Despite 18 audits and zero incidents, all DeFi protocols carry inherent smart contract risk.",
      "Oracle risk - Price feeds from Pyth and Switchboard are cross-referenced, but oracle failures remain a theoretical risk.",
    ],
  },
  {
    id: "liquidity",
    title: "Liquidity Vaults",
    description:
      "Automated concentrated liquidity on Solana DEXs with $310M+ TVL and $40M+ in cumulative fees generated. Auto-swap, auto-compound, and auto-rebalance handle everything. Displayed APYs often understate effective returns for vaults containing yield-bearing assets.",
    opportunities: [
      {
        title: "JitoSOL-SOL Drift Strategy",
        highlight: "~11% effective APY",
        description:
          "Displayed APYs understate effective returns by roughly 40%. The Drift Strategy tracks the stake rate, keeping liquidity concentrated in the active range. Triple yield: trading fees, JTO incentives, and native staking yield.",
        details: [
          "Displayed: 7.56% APY",
          "Hidden LST yield: ~4.25%",
          "100K monthly JTO incentives",
          "$1M+ fees generated since inception",
        ],
        link: "https://kamino.com/liquidity",
      },
      {
        title: "JUP-BONK",
        highlight: "247% 7D APY",
        description:
          "High-volatility pair generating significant trading fees from swap volume. Short-term yields are elevated during periods of high activity. Best suited for active monitoring.",
        details: [
          "$9.77K fees in one week",
          "Volatile-Volatile pair",
          "High IL risk - monitor closely",
        ],
        link: "https://kamino.com/liquidity",
      },
      {
        title: "PYUSD-USDC",
        highlight: "~12% APY",
        description:
          "Stablecoin pair with tight trading ranges and concentrated liquidity. High swap volume between PYUSD and USDC generates consistent fees with minimal impermanent loss risk.",
        details: [
          "Stablecoin pair - low IL risk",
          "High volume from stablecoin swaps",
          "Tight range concentration",
        ],
        link: "https://kamino.com/liquidity",
      },
      {
        title: "PST-USDC (Huma)",
        highlight: "~17% effective APY",
        description:
          "Yield-bearing stablecoin pair. PST carries ~5% native yield on top of the displayed 12% APY from trading fees and incentives. The native yield accrues to your position value automatically.",
        details: [
          "Displayed: ~12% APY",
          "Native PST yield: ~5%",
          "Yield-bearing stablecoin",
        ],
        link: "https://kamino.com/liquidity",
      },
      {
        title: "hyUSD-USDC",
        highlight: "10K JTO/month incentives",
        description:
          "Stablecoin vault with 10,000 JTO monthly incentives plus a 5x Hylo XP boost. A straightforward yield opportunity enhanced by external incentive programmes.",
        details: [
          "10,000 JTO monthly incentives",
          "5x Hylo XP boost",
          "Stable pair - low IL risk",
        ],
        link: "https://kamino.com/liquidity",
      },
    ],
    risks: [
      "Impermanent loss - Standard AMM risk. Uncorrelated volatile pairs (e.g. JUP-BONK) carry the highest IL risk. Auto-rebalancing mitigates but does not eliminate this.",
      "Depeg events - LST and stablecoin vaults carry depeg risk if the pegged asset loses its peg.",
      "Rebalance risk - In volatile-volatile pools, rebalances can lock in IL if prices diverge significantly between rebalance intervals.",
    ],
  },
  {
    id: "multiply",
    title: "Multiply & Looping",
    description:
      "One-click leveraged exposure to yield-bearing assets. Uses K-Lend eMode and flash loans to open leveraged positions in a single transaction. Correlated pairs benefit from up to 10x leverage via 95% LTV.",
    opportunities: [
      {
        title: "JLP Multiply",
        highlight: "Up to 14% Net APY",
        description:
          "One-click leveraged exposure to JLP. Correlated pair dynamics via eMode keep liquidation risk manageable. Liquidation only triggers from JLP price decline vs USD.",
        details: [
          "Up to 4x leverage",
          "Example: 8x multiplier, 7% yield, 6% borrow = 14% Net APY",
          "Flash loan fee: 0.001%",
        ],
        link: "https://kamino.com/multiply",
      },
      {
        title: "JitoSOL Multiply",
        highlight: "5-14% Net APY",
        description:
          "Leverage JitoSOL staking yield against SOL borrowing. eMode enables up to 10x leverage on this correlated pair. Liquidation risk comes only from sustained negative yield spread.",
        details: [
          "Up to 10x leverage (eMode 95% LTV)",
          "Correlated pair - no price liquidation risk",
          "Risk: borrow rate exceeding staking yield",
        ],
        link: "https://kamino.com/multiply",
      },
      {
        title: "PYUSD Loop",
        highlight: "Up to 21% leveraged yield",
        description:
          "Loop PYUSD against USDC borrowing at the lowest borrow rates on Solana. Stable pair dynamics with up to 10x leverage. Yield amplified through multiple deposit-borrow cycles.",
        details: [
          "Up to 10x leverage",
          "Stable-stable pair",
          "Lowest borrow rates on Solana",
        ],
        link: "https://kamino.com/multiply",
      },
      {
        title: "mSOL / bSOL Multiply",
        highlight: "4-12% Net APY",
        description:
          "Same mechanics as JitoSOL Multiply across alternative LSTs. Diversify staking exposure while maintaining leveraged yield. All SOL LSTs benefit from eMode 10x leverage.",
        details: [
          "Up to 10x leverage",
          "Multiple LST options",
          "Correlated pair dynamics",
        ],
        link: "https://kamino.com/multiply",
      },
    ],
    risks: [
      "Interest rate risk - If borrow rates exceed collateral yield for a sustained period, the leveraged position becomes unprofitable and can eventually trigger liquidation.",
      "Liquidation risk - Volatile pairs (JLP/USD) face standard price-based liquidation. Correlated pairs (LST/SOL) face only interest rate risk.",
      "Smart contract risk - Multiply uses flash loans across multiple protocol interactions, adding composability risk.",
    ],
  },
];
