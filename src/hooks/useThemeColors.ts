"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useThemeColors() {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    setColors({
      background: style.getPropertyValue("--color-background").trim(),
      foreground: style.getPropertyValue("--color-foreground").trim(),
      card: style.getPropertyValue("--color-card").trim(),
      border: style.getPropertyValue("--color-border").trim(),
      muted: style.getPropertyValue("--color-muted").trim(),
      accent: style.getPropertyValue("--color-accent").trim(),
      accentForeground: style.getPropertyValue("--color-accent-foreground").trim(),
      kaminoBlue: style.getPropertyValue("--color-kamino-blue").trim(),
      liquidityBlue: style.getPropertyValue("--color-liquidity-blue").trim(),
      chartNavy: style.getPropertyValue("--color-chart-navy").trim(),
      warning: style.getPropertyValue("--color-warning").trim(),
      danger: style.getPropertyValue("--color-danger").trim(),
      surface: style.getPropertyValue("--color-surface").trim(),
    });
  }, [resolvedTheme]);

  return colors;
}
