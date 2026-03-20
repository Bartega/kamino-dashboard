import type {
  ArchivedTweet,
} from "../src/lib/api/competitor-types.js";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const KV_REST_API_URL = process.env.KV_REST_API_URL!;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

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
    thumbnailUrl?: string;
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
      model: "claude-sonnet-4-6",
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
      ...(t.thumbnailUrl ? { thumbnailUrl: t.thumbnailUrl } : {}),
    }));
}

// ---------------------------------------------------------------------------
// Step 4: Category breakdown
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
// Step 5: AI narrative summary
// ---------------------------------------------------------------------------

async function generateNarrativeSummary(
  topTweets: DailyDigest["topTweets"],
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

  const categories = categoryBreakdown
    .slice(0, 5)
    .map((c) => `${c.category}: ${c.count} tweets (${c.avgEngagement}% avg engagement)`)
    .join(", ");

  const prompt = `You are a DeFi market analyst. Based on the following competitor tweet data from the last 24 hours, write a concise 3-4 sentence summary of the day's key developments. Focus on what competitors are talking about, trending topics, and standout content. Be specific about protocols and metrics. Neutral, analytical tone.

TOP TWEETS:
${tweetSection || "No tweets in the last 24 hours."}

CONTENT CATEGORIES: ${categories || "None"}`;

  return callLlm(prompt);
}

// ---------------------------------------------------------------------------
// Step 6: Store digest in Redis
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

  // Fetch tweets
  const tweets = await fetchRecentTweets();

  // Compute sections
  const topTweets = getTopTweets(tweets);
  const categoryBreakdown = getCategoryBreakdown(tweets);

  // AI summary
  const aiSummary = await generateNarrativeSummary(
    topTweets,
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
    `[digest] Summary: ${tweets.length} tweets, ${categoryBreakdown.length} categories`
  );
}

main().catch((err) => {
  console.error("[digest] Fatal error:", err);
  process.exit(1);
});
