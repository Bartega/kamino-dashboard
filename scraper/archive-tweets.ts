import type {
  CompetitorData,
  CompetitorTweet,
  ArchivedTweet,
} from "../src/lib/api/competitor-types.js";

const KV_REST_API_URL = process.env.KV_REST_API_URL!;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN!;
const GROQ_API_KEY = process.env.GROQ_API_KEY!;

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
  if (!res.ok) throw new Error(`Redis pipeline ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.map((r: { result: unknown }) => r.result);
}

// ---------------------------------------------------------------------------
// Engagement rate calculation
// ---------------------------------------------------------------------------

function engagementRate(tweet: CompetitorTweet): number {
  if (!tweet.viewCount) return 0;
  return (
    (tweet.likeCount + tweet.bookmarkCount + tweet.retweetCount) /
    tweet.viewCount
  );
}

// ---------------------------------------------------------------------------
// Archive tweets to Redis
// ---------------------------------------------------------------------------

export async function archiveTweets(
  competitors: CompetitorData[],
  callLlm: (prompt: string) => Promise<string>,
): Promise<void> {
  console.log("[archive] Starting tweet archival...");

  // Collect all tweets with metadata
  const allTweets: ArchivedTweet[] = [];
  const now = new Date().toISOString();

  for (const comp of competitors) {
    for (const tweet of comp.tweets) {
      allTweets.push({
        ...tweet,
        twitterHandle: comp.twitterHandle,
        displayName: comp.displayName,
        scrapedAt: now,
        engagementRate: +(engagementRate(tweet) * 100).toFixed(4),
      });
    }
  }

  // Check which tweets are already archived
  const existingIds = (await redisCmd([
    "SMEMBERS",
    "tweet-archive:ids",
  ])) as string[];
  const existingSet = new Set(existingIds ?? []);

  const newTweets = allTweets.filter((t) => !existingSet.has(t.id));

  if (newTweets.length === 0) {
    console.log("[archive] No new tweets to archive.");
    return;
  }

  console.log(`[archive] Archiving ${newTweets.length} new tweets...`);

  // Pipeline: add each tweet to its handle's sorted set + add ID to the dedup set
  const cmds: unknown[][] = [];
  for (const tweet of newTweets) {
    const score = new Date(tweet.createdAt).getTime() / 1000;
    const key = `tweet-archive:${tweet.twitterHandle}`;
    cmds.push(["ZADD", key, score, JSON.stringify(tweet)]);
    cmds.push(["SADD", "tweet-archive:ids", tweet.id]);
  }

  // Execute in batches of 40 commands (20 tweets) to stay within Upstash limits
  const BATCH_SIZE = 40;
  for (let i = 0; i < cmds.length; i += BATCH_SIZE) {
    const batch = cmds.slice(i, i + BATCH_SIZE);
    await redisPipeline(batch);
  }

  console.log(`[archive] Archived ${newTweets.length} tweets.`);

  // Generate AI analysis for top 5 performers
  const top5 = [...newTweets]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 5);

  console.log("[archive] Generating AI analysis for top 5 performers...");

  for (const tweet of top5) {
    try {
      const analysis = await callLlm(
        `Analyse why this tweet by @${tweet.twitterHandle} performed well (${tweet.likeCount} likes, ${tweet.bookmarkCount} bookmarks, ${tweet.viewCount.toLocaleString()} views, ${tweet.engagementRate}% engagement rate).\n\nTweet: "${tweet.fullText}"\n\nIn 2-3 sentences, identify: (1) the content hook or format that drove engagement, (2) whether this signals a product launch, partnership, metric milestone, or community play. Be specific and analytical.`,
      );
      await redisCmd([
        "SET",
        `tweet-archive:ai-analysis:${tweet.id}`,
        analysis,
      ]);
      console.log(`  Analysed @${tweet.twitterHandle}: ${tweet.id}`);
    } catch (e) {
      console.warn(
        `  AI analysis failed for ${tweet.id}: ${(e as Error).message}`,
      );
    }
  }

  console.log("[archive] Done.");
}
