# Dark Theme for Kamino Dashboard

## Summary

Add system-aware dark mode with a manual toggle to the Kamino dashboard. Uses CSS variable swapping via `next-themes` so existing components work without modification.

## Decisions

- **Palette direction:** Deep Navy (#0A0F1A base)
- **Default behaviour:** Match OS preference, with manual override persisted to localStorage
- **Toggle style:** Sun/moon pill toggle in the header, left of the "Open Kamino" CTA
- **Library:** `next-themes` (v0.4+, React 19 compatible)

## Dark Palette

| Token | Light | Dark |
|-------|-------|------|
| `--color-background` | `#FCFCFC` | `#0A0F1A` |
| `--color-foreground` | `#000000` | `#E2E8F0` |
| `--color-card` | `#C6F4FF` | `#111827` |
| `--color-card-hover` | `#B0ECFF` | `#1A2332` |
| `--color-border` | `#D1D5DC` | `#1E293B` |
| `--color-muted` | `#4A5565` | `#94A3B8` |
| `--color-accent` | `#001F46` | `#C6F4FF` |
| `--color-accent-foreground` | `#FFFFFF` | `#0A0F1A` |
| `--color-accent-dim` | `rgba(198,244,255,0.5)` | `rgba(198,244,255,0.1)` |
| `--color-surface` | `#FFFFFF` | `#111827` |
| `--color-kamino-blue` | `#C6F4FF` | `#0C4A6E` |
| `--color-liquidity-blue` | `#9CAED4` | `#7DD3FC` |
| `--color-warning` | `#D97706` | `#F59E0B` |
| `--color-danger` | `#DC2626` | `#EF4444` |

Key inversions:
- `accent` flips from dark navy to Kamino Blue in dark mode, since navy is invisible on the dark background
- New `accent-foreground` token for text on accent-coloured elements (buttons, badges)
- New `surface` token for card/panel backgrounds (distinct from `background` for depth)

## Architecture

### 1. `globals.css` - Dark variable block

Add a `.dark` selector block after the `@theme inline` directive that overrides the CSS custom properties. The `.dark` class selector has sufficient specificity to override `@theme` layer declarations.

```css
.dark {
  --color-background: #0A0F1A;
  --color-foreground: #E2E8F0;
  /* ... all dark tokens */
}
```

Verify with a local test that `.dark` class specificity wins over `@theme` layer before committing to this approach.

### 2. `Providers.tsx` - Client Component wrapper

`layout.tsx` is a Server Component in Next.js 16 App Router. `ThemeProvider` uses React context (client-only). Create a separate client component wrapper:

```tsx
// src/components/Providers.tsx
"use client"
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

### 3. `layout.tsx` - Integration

Add `suppressHydrationWarning` to `<html>` (required by `next-themes` to prevent hydration mismatch when the class is injected before React hydrates). Wrap children with `<Providers>`.

```tsx
<html lang="en-GB" suppressHydrationWarning>
  <body>
    <Providers>{children}</Providers>
  </body>
</html>
```

### 4. `ThemeToggle.tsx` - New component

Pill toggle with sun/moon icons. Uses `useTheme()` from `next-themes`. Renders a pill with two segments; the active one gets a highlighted background.

Must handle hydration by mounting with a placeholder until `useEffect` confirms the theme.

### 5. `Header.tsx` - Add toggle

Insert `<ThemeToggle />` to the left of the "Open Kamino" button.

### 6. Hardcoded colour audit

Replace all hardcoded colours that bypass the token system.

**`bg-white` → `bg-surface` (20+ instances):**
- `FeaturedCard.tsx`
- `Footer.tsx`
- `RiskDisclaimer.tsx`
- `ArchiveFilters.tsx`, `ArchivedTweetCard.tsx`, `ArchiveHeader.tsx`
- `CompetitorCard.tsx`, `CompetitorAdmin.tsx`, `CompetitorCharts.tsx`, `TweetItem.tsx`
- `competitors/archive/page.tsx` (pagination buttons)

**`text-white` on `bg-accent` → `text-accent-foreground`:**
- `Header.tsx` (CTA button)
- `CompetitorAdmin.tsx` (buttons)
- `TvlMomentumChart.tsx` (labels)
- `ContentHeatmap.tsx`, `CompetitorCardHeader.tsx` (badges)

When `--color-accent` flips to `#C6F4FF` in dark mode, white text loses contrast. The new `accent-foreground` token resolves this.

**Hardcoded Tailwind palette classes:**
- `VaultTable.tsx` / `MultiplyTable.tsx`: `bg-blue-500/10 text-blue-400` type badges → use a token or `dark:` variant
- `ArchivedTweetCard.tsx` / `TweetMetrics.tsx`: `text-blue-500` → token
- `ContentHeatmap.tsx`: `bg-gray-50` → `bg-surface` or similar

### 7. Charts (recharts)

Create a `useThemeColors()` hook that reads CSS variable values via `getComputedStyle()` and returns them for chart props. Re-reads on theme change.

**Chart components with hardcoded hex colours:**
- `EngagementRateChart.tsx` - 17-colour array
- `TvlSocialQuadrant.tsx` - 17-colour array + `#9CAED4` reference lines
- `TvlComparisonChart.tsx` - 5 colours + `#001F46` axis stroke
- `TweetVelocityChart.tsx` - `#001F46` fill
- `EngagementChart.tsx` - `#001F46`, `#C0F4FF`, `#9CAED4` bar fills
- `TvlMomentumChart.tsx` - `#10B981`, `#EF4444` conditional fills

Critical: `#001F46` (dark navy) used in 5+ chart components will be invisible against `#0A0F1A`. These must swap to a visible colour in dark mode.

### 8. Shadow adjustments

`hover:shadow-md` on cards (e.g. `FeaturedOpportunity.tsx`) renders poorly on dark backgrounds. Add `dark:shadow-lg dark:shadow-black/20` or similar for dark mode.

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `next-themes` |
| `src/app/globals.css` | Add `.dark` variable block + new tokens (`surface`, `accent-foreground`) |
| `src/app/layout.tsx` | Add `suppressHydrationWarning`, wrap with `Providers` |
| `src/components/Providers.tsx` | New client component with `ThemeProvider` |
| `src/components/shared/ThemeToggle.tsx` | New pill toggle component |
| `src/components/layout/Header.tsx` | Add `ThemeToggle` |
| `src/hooks/useThemeColors.ts` | New hook for chart colour resolution |
| 10+ components | Replace `bg-white` → `bg-surface` |
| 5+ components | Replace `text-white` on accent → `text-accent-foreground` |
| 3+ components | Replace hardcoded Tailwind palette classes |
| 6 chart components | Use `useThemeColors()` for colour props |
| Card components | Dark mode shadow adjustments |

## Risks

- **`@theme` layer specificity:** `.dark` class should win over `@theme` layer, but needs a quick local test to confirm.
- **Flash of wrong theme on load:** `next-themes` injects a blocking script to prevent this.
- **Recharts colour bridging:** The `useThemeColors()` hook adds a re-render on theme switch. Acceptable for dashboard use.
- **Scope:** ~25 files touched across the colour audit. Most changes are simple find-and-replace (`bg-white` → `bg-surface`).
