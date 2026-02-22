import { chromium, type Browser, type Page } from "playwright";

const CHROMIUM_PATH =
  process.env.CHROMIUM_PATH ||
  "/home/julian/.cache/ms-playwright/chromium-1209/chrome-linux64/chrome";

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
}

export async function waitForTable(page: Page, timeoutMs = 30_000): Promise<void> {
  await page.waitForSelector("table tbody tr", {
    state: "visible",
    timeout: timeoutMs,
  });
  await page.waitForTimeout(3000);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 5000
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(
        `Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`,
        (err as Error).message
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("Unreachable");
}

export function parseDollarValue(text: string): number {
  const cleaned = text.replace(/[$,\s]/g, "");
  if (cleaned.endsWith("B")) return parseFloat(cleaned) * 1_000_000_000;
  if (cleaned.endsWith("M")) return parseFloat(cleaned) * 1_000_000;
  if (cleaned.endsWith("K")) return parseFloat(cleaned) * 1_000;
  return parseFloat(cleaned) || 0;
}

export function parsePercent(text: string): number {
  if (text.includes("<0%")) return 0;
  return parseFloat(text.replace(/[^0-9.]/g, "")) || 0;
}
