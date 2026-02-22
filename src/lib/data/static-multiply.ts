import type { DisplayMultiply } from "../api/types";

export const STATIC_MULTIPLY: DisplayMultiply[] = [
  {
    name: "JitoSOL Multiply",
    collateral: "JitoSOL",
    debt: "SOL",
    maxLeverage: "10x",
    netApyRange: "5-14%",
    type: "Correlated",
  },
  {
    name: "mSOL Multiply",
    collateral: "mSOL",
    debt: "SOL",
    maxLeverage: "10x",
    netApyRange: "4-12%",
    type: "Correlated",
  },
  {
    name: "bSOL Multiply",
    collateral: "bSOL",
    debt: "SOL",
    maxLeverage: "10x",
    netApyRange: "4-11%",
    type: "Correlated",
  },
  {
    name: "JLP Multiply",
    collateral: "JLP",
    debt: "USDC",
    maxLeverage: "4x",
    netApyRange: "8-25%",
    type: "Volatile",
  },
  {
    name: "PYUSD Loop",
    collateral: "PYUSD",
    debt: "USDC",
    maxLeverage: "10x",
    netApyRange: "8-21%",
    type: "Stable",
  },
  {
    name: "SOL Multiply",
    collateral: "SOL",
    debt: "USDC",
    maxLeverage: "4x",
    netApyRange: "Variable",
    type: "Volatile",
  },
];
