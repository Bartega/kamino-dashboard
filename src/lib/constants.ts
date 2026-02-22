export const KAMINO_API_BASE =
  process.env.KAMINO_API_BASE || "https://api.kamino.finance";

export const DEFILLAMA_API_BASE =
  process.env.DEFILLAMA_API_BASE || "https://api.llama.fi";

export const REVALIDATE_SECONDS = Number(
  process.env.REVALIDATE_SECONDS || "300"
);

export const FETCH_TIMEOUT_MS = 8000;

export const KAMINO_APP_URL = "https://kamino.com";
export const KAMINO_DOCS_URL = "https://docs.kamino.finance";

export const KNOWN_MARKETS: Record<string, string> = {
  "7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF": "Main Market",
};
