import type {
  ArchivedTweet,
  CompetitorConfig,
} from "../src/lib/api/competitor-types.js";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const KV_REST_API_URL = process.env.KV_REST_API_URL!;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const DEFILLAMA_BASE = process.env.DEFILLAMA_API_BASE || "https://api.llama.fi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DailyDigest {
  date: string;
  generatedAt: string;
  aiSummary: string;
  topTweets: {
    id: string;
    fullText: string;
    twitterHandle: string;
    displayName: string;
    likeCount: number;
    bookmarkCount: number;
    retweetCount: number;
    viewCount: number;
    engagementRate: number;
    createdAt: string;
    twitterUrl: string;
    category?: string;
  }[];
  tvlMovers: {
    handle: string;
    displayName: string;
    slug: string;
    currentTvl: number;
    change24h: number;
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
    avgEngagement: number;
  }[];
  stats: {
    totalTweets: number;
    totalCompetitors: number;
    avgEngagement: number;
  };
}

// ---------------------------------------------------------------------------
// Redis helpers (raw REST API for GitHub Actions compatibility)
// ---------------------------------------------------------------------------

async function redisCmd(cmd: unknown[]): Promise<unknown> {
  const res = await fetch(KV_REST_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) throw new Error(`Redis ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.result;
}

async function redisPipeline(cmds: unknown[][]): Promise<unknown[]> {
  const res = await fetch(`${KV_REST_API_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmds),
  });
  if (!res.ok)
    throw new Error(`Redis pipeline ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.map((r: { result: unknown }) => r.result);
}

// ---------------------------------------------------------------------------
// LLM helper
// ---------------------------------------------------------------------------

async function callLlm(prompt: string, retries = 2): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    if (res.status === 429 && retries > 0) {
      await new Promise((r) => setTimeout(r, 2000));
      return callLlm(prompt, retries - 1);
    }
    const err = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

// ---------------------------------------------------------------------------
// Step 1: Determine target date
// ---------------------------------------------------------------------------

function getTargetDate(): string {
  const override = process.argv.find((a) => a.startsWith("--date="));
  if (override) return override.split("=")[1];

  const now = new Date();
  return now.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Step 2: Fetch all tweets from the last 24 hours
// ---------------------------------------------------------------------------

async function fetchRecentTweets(): Promise<ArchivedTweet[]> {
  console.log("[digest] Fetching tweet archive keys...");

  // Scan for all tweet-archive:* keys
  const keys: string[] = [];
  let cursor = "0";
  do {
    const result = (await redisCmd([
      "SCAN",
      cursor,
      "MATCH",
      "tweet-archive:*",
      "COUNT",
      "100",
    ])) as [string, string[]];
    cursor = result[0];
    keys.push(...result[1]);
  } while (cursor !== "0");

  // Filter out non-tweet sorted sets
  const archiveKeys = keys.filter(
    (k) => k !== "tweet-archive:ids" && !k.startsWith("tweet-archive:ai-analysis:")
  );

  if (archiveKeys.length === 0) {
    console.log("[digest] No archive keys found.");
    return [];
  }

  console.log(`[digest] Found ${archiveKeys.length} archive keys.`);

  const nowSeconds = Math.floor(Date.now() / 1000);
  const oneDayAgo = nowSeconds - 86400;

  // Fetch tweets from each key using ZRANGEBYSCORE
  const allTweets: ArchivedTweet[] = [];

  // Batch the ZRANGEBYSCORE commands in groups of 20
  const BATCH = 20;
  for (let i = 0; i < archiveKeys.length; i += BATCH) {
    const batch = archiveKeys.slice(i, i + BATCH);
    const cmds = batch.map((key) => [
      "ZRANGEBYSCORE",
      key,
      String(oneDayAgo),
      String(nowSeconds),
    ]);
    const results = await redisPipeline(cmds);

    for (const members of results) {
      if (!Array.isArray(members)) continue;
      for (const raw of members) {
        try {
          const tweet: ArchivedTweet =
            typeof raw === "string" ? JSON.parse(raw) : raw;
          allTweets.push(tweet);
        } catch {
          // Skip malformed entries
        }
      }
    }
  }

  console.log(`[digest] Found ${allTweets.length} tweets from the last 24 hours.`);
  return allTweets;
}

// ---------------------------------------------------------------------------
// Step 3: Top tweets by engagement
// ---------------------------------------------------------------------------

function getTopTweets(
  tweets: ArchivedTweet[]
): DailyDigest["topTweets"] {
  return tweets
    .slice()
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 10)
    .map((t) => ({
      id: t.id,
      fullText: t.fullText,
      twitterHandle: t.twitterHandle,
      displayName: t.displayName,
      likeCount: t.likeCount,
      bookmarkCount: t.bookmarkCount,
      retweetCount: t.retweetCount,
      viewCount: t.viewCount,
      engagementRate: t.engagementRate,
      createdAt: t.createdAt,
      twitterUrl: `https://twitter.com/${t.twitterHandle}/status/${t.id}`,
      ...(t.category ? { category: t.category } : {}),
    }));
}

// ---------------------------------------------------------------------------
// Step 4: TVL movers
// ---------------------------------------------------------------------------

async function fetchCompetitorConfig(): Promise<CompetitorConfig[]> {
  console.log("[digest] Fetching competitor config...");
  const result = await redisCmd(["GET", "competitors"]);
  if (!result) return [];

  let parsed = result;
  while (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }
  return parsed as CompetitorConfig[];
}

async function fetchTvlMover(
  slug: string,
  handle: string,
  displayName: string
): Promise<DailyDigest["tvlMovers"][number] | null> {
  try {
    const res = await fetch(`${DEFILLAMA_BASE}/protocol/${slug}`);
    if (!res.ok) throw new Error(`DeFi Llama ${slug}: ${res.status}`);
    const data = await res.json();

    // Current TVL: prefer Solana chain, fall back to sum of non-borrowed chains, then last tvl entry
    let currentTvl = data.currentChainTvls?.Solana ?? 0;
    if (!currentTvl && data.currentChainTvls) {
      currentTvl = Object.entries(data.currentChainTvls)
        .filter(([k]) => !k.includes("-"))
        .reduce((sum, [, v]) => sum + (v as number), 0);
    }
    if (!currentTvl && data.tvl?.length) {
      currentTvl = data.tvl[data.tvl.length - 1]?.totalLiquidityUSD ?? 0;
    }

    // 24h ago TVL: find the closest entry to 24h ago
    const tvlArray: { date: number; totalLiquidityUSD: number }[] =
      data.chainTvls?.Solana?.tvl || data.tvl || [];
    const targetTs = Date.now() / 1000 - 86400;

    let previousTvl = 0;
    let closestDiff = Infinity;
    for (const entry of tvlArray) {
      const diff = Math.abs(entry.date - targetTs);
      if (diff < closestDiff) {
        closestDiff = diff;
        previousTvl = entry.totalLiquidityUSD;
      }
    }

    const change24h =
      previousTvl > 0 ? ((currentTvl - previousTvl) / previousTvl) * 100 : 0;

    return { handle, displayName, slug, currentTvl, change24h };
  } catch (err) {
    console.warn(`[digest] TVL fetch failed for ${slug}: ${(err as Error).message}`);
    return null;
  }
}

async function getTvlMovers(
  config: CompetitorConfig[]
): Promise<DailyDigest["tvlMovers"]> {
  console.log("[digest] Fetching TVL data...");

  // Build the list: all competitors + Kamino
  const entries = [
    { slug: "kamino", handle: "KaminoFinance", displayName: "Kamino" },
    ...config.map((c) => ({
      slug: c.defiLlamaSlug,
      handle: c.twitterHandle,
      displayName: c.displayName,
    })),
  ];

  // Fetch in parallel batches of 5
  const BATCH = 5;
  const movers: DailyDigest["tvlMovers"] = [];
  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((e) => fetchTvlMover(e.slug, e.handle, e.displayName))
    );
    for (const r of results) {
      if (r) movers.push(r);
    }
  }

  // Sort by absolute change descending
  movers.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));

  console.log(`[digest] Got TVL data for ${movers.length} protocols.`);
  return movers;
}

// ---------------------------------------------------------------------------
// Step 5: Category breakdown
// ---------------------------------------------------------------------------

function getCategoryBreakdown(
  tweets: ArchivedTweet[]
): DailyDigest["categoryBreakdown"] {
  const groups = new Map<string, { count: number; totalEngagement: number }>();

  for (const tweet of tweets) {
    if (!tweet.category) continue;
    const existing = groups.get(tweet.category);
    if (existing) {
      existing.count++;
      existing.totalEngagement += tweet.engagementRate;
    } else {
      groups.set(tweet.category, {
        count: 1,
        totalEngagement: tweet.engagementRate,
      });
    }
  }

  return Array.from(groups.entries())
    .map(([category, { count, totalEngagement }]) => ({
      category,
      count,
      avgEngagement: +(totalEngagement / count).toFixed(4),
    }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Step 6: AI narrative summary
// ---------------------------------------------------------------------------

async function generateNarrativeSummary(
  topTweets: DailyDigest["topTweets"],
  tvlMovers: DailyDigest["tvlMovers"],
  categoryBreakdown: DailyDigest["categoryBreakdown"]
): Promise<string> {
  console.log("[digest] Generating AI narrative summary...");

  const top5 = topTweets.slice(0, 5);
  const tweetSection = top5
    .map(
      (t) =>
        `@${t.twitterHandle}: "${t.fullText.slice(0, 200)}" (${t.engagementRate}% engagement, ${t.likeCount} likes, ${t.viewCount} views)`
    )
    .join("\n");

  const gainers = tvlMovers
    .filter((m) => m.change24h > 0)
    .slice(0, 3)
    .map((m) => `${m.displayName}: +${m.change24h.toFixed(2)}% ($${(m.currentTvl / 1e6).toFixed(1)}M)`)
    .join(", ");
  const losers = tvlMovers
    .filter((m) => m.change24h < 0)
    .slice(0, 3)
    .map((m) => `${m.displayName}: ${m.change24h.toFixed(2)}% ($${(m.currentTvl / 1e6).toFixed(1)}M)`)
    .join(", ");

  const categories = categoryBreakdown
    .slice(0, 5)
    .map((c) => `${c.category}: ${c.count} tweets (${c.avgEngagement}% avg engagement)`)
    .join(", ");

  const prompt = `You are a DeFi market analyst. Based on the following data from the last 24 hours, write a concise 3-4 sentence summary of the day's key developments. Focus on notable competitor moves, trending topics, and standout content. Be specific about protocols and metrics. Neutral, analytical tone.

TOP TWEETS:
${tweetSection || "No tweets in the last 24 hours."}

TVL MOVERS (top gainers): ${gainers || "None"}
TVL MOVERS (top losers): ${losers || "None"}

CONTENT CATEGORIES: ${categories || "None"}`;

  return callLlm(prompt);
}

// ---------------------------------------------------------------------------
// Step 7: Store digest in Redis
// ---------------------------------------------------------------------------

async function storeDigest(digest: DailyDigest): Promise<void> {
  console.log(`[digest] Storing digest for ${digest.date}...`);

  const dateTs = Math.floor(new Date(digest.date + "T00:00:00Z").getTime() / 1000);

  await redisPipeline([
    ["SET", `daily-digest:${digest.date}`, JSON.stringify(digest)],
    ["ZADD", "daily-digest:dates", String(dateTs), digest.date],
  ]);

  console.log("[digest] Digest stored successfully.");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const targetDate = getTargetDate();
  console.log(`[digest] Starting daily digest for ${targetDate} at ${new Date().toISOString()}`);

  // Fetch tweets and competitor config in parallel
  const [tweets, competitorConfig] = await Promise.all([
    fetchRecentTweets(),
    fetchCompetitorConfig(),
  ]);

  // Compute sections
  const topTweets = getTopTweets(tweets);
  const categoryBreakdown = getCategoryBreakdown(tweets);

  // TVL movers (requires network calls)
  const tvlMovers = await getTvlMovers(competitorConfig);

  // AI summary
  const aiSummary = await generateNarrativeSummary(
    topTweets,
    tvlMovers,
    categoryBreakdown
  );

  // Compute stats
  const uniqueHandles = new Set(tweets.map((t) => t.twitterHandle));
  const totalEngagement = tweets.reduce((sum, t) => sum + t.engagementRate, 0);
  const avgEngagement =
    tweets.length > 0 ? +(totalEngagement / tweets.length).toFixed(4) : 0;

  const digest: DailyDigest = {
    date: targetDate,
    generatedAt: new Date().toISOString(),
    aiSummary,
    topTweets,
    tvlMovers,
    categoryBreakdown,
    stats: {
      totalTweets: tweets.length,
      totalCompetitors: uniqueHandles.size,
      avgEngagement,
    },
  };

  await storeDigest(digest);

  console.log(`[digest] Finished at ${new Date().toISOString()}`);
  console.log(
    `[digest] Summary: ${tweets.length} tweets, ${tvlMovers.length} protocols, ${categoryBreakdown.length} categories`
  );
}

main().catch((err) => {
  console.error("[digest] Fatal error:", err);
  process.exit(1);
});
