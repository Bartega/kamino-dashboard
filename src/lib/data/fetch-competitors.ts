import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { CompetitorDataFile } from "../api/competitor-types";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const DATA_PATH = resolve(process.cwd(), "src/lib/data/competitor-data.json");

export function getCompetitorData(): CompetitorDataFile | null {
  if (!existsSync(DATA_PATH)) return null;

  try {
    const data: CompetitorDataFile = JSON.parse(
      readFileSync(DATA_PATH, "utf-8")
    );
    const ageMs = Date.now() - new Date(data.timestamp).getTime();
    if (ageMs > MAX_AGE_MS) return null;
    return data;
  } catch {
    return null;
  }
}
