import { writeFileSync, renameSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { archiveTweets, archiveFollowerSnapshots } from "./archive-tweets.js";
import type {
  CompetitorConfig,
  CompetitorDataFile,
  CompetitorData,
  CompetitorTweet,
  CompetitorHighlights,
  ApifyTweet,
  TvlDataPoint,
} from "../src/lib/api/competitor-types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../src/lib/data/competitor-data.json");

const APIFY_TOKEN = process.env.APIFY_TOKEN!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const DEFILLAMA_BASE = process.env.DEFILLAMA_API_BASE || "https://api.llama.fi";
const KV_REST_API_URL = process.env.KV_REST_API_URL!;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN!;

// ---------------------------------------------------------------------------
// Vercel KV (Upstash Redis REST API) - read competitor list
// ---------------------------------------------------------------------------

async function fetchCompetitorConfig(): Promise<CompetitorConfig[]> {
  const res = await fetch(`${KV_REST_API_URL}/get/competitors`, {
    headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
  });
  if (!res.ok) throw new Error(`KV fetch failed: ${res.status}`);
  const body = await res.json();
  if (!body.result) return [];
  let parsed = body.result;
  // Upstash may double-encode - keep parsing until we get an array
  while (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }
  return parsed as CompetitorConfig[];
}

// ---------------------------------------------------------------------------
// Apify tweet scraper
// ---------------------------------------------------------------------------

async function fetchTweets(handle: string): Promise<ApifyTweet[]> {
  console.log(`  Fetching tweets for @${handle}...`);

  const runRes = await fetch(
    `https://api.apify.com/v2/acts/apidojo~tweet-scraper/runs?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: handle,
        maxItems: 40,
        sort: "Latest",
      }),
    }
  );
  if (!runRes.ok) throw new Error(`Apify run failed: ${runRes.status}`);
  const runData = await runRes.json();
  const runId: string = runData.data.id;
  const datasetId: string = runData.data.defaultDatasetId;

  // Poll for completion (max ~5 minutes)
  let status = "RUNNING";
  let attempts = 0;
  while ((status === "RUNNING" || status === "READY") && attempts < 60) {
    await new Promise((r) => setTimeout(r, 5000));
    attempts++;
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );
    const statusData = await statusRes.json();
    status = statusData.data.status;
  }

  if (status !== "SUCCEEDED") {
    throw new Error(`Apify run ${runId} ended with status: ${status}`);
  }

  const itemsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`
  );
  return itemsRes.json();
}

// ---------------------------------------------------------------------------
// DeFi Llama TVL
// ---------------------------------------------------------------------------

async function fetchProtocolTvl(
  slug: string
): Promise<{ currentTvl: number; history: TvlDataPoint[] }> {
  console.log(`  Fetching TVL for ${slug}...`);
  const res = await fetch(`${DEFILLAMA_BASE}/protocol/${slug}`);
  if (!res.ok) throw new Error(`DeFi Llama ${slug}: ${res.status}`);
  const data = await res.json();

  // Try Solana-specific TVL, then sum all non-borrowed chains, then fall back to tvl array
  let currentTvl = data.currentChainTvls?.Solana ?? 0;
  if (!currentTvl && data.currentChainTvls) {
    currentTvl = Object.entries(data.currentChainTvls)
      .filter(([k]) => !k.includes("-"))
      .reduce((sum, [, v]) => sum + (v as number), 0);
  }
  if (!currentTvl && data.tvl?.length) {
    currentTvl = data.tvl[data.tvl.length - 1]?.totalLiquidityUSD ?? 0;
  }

  const allTvl = data.chainTvls?.Solana?.tvl || data.tvl || [];
  const thirtyDaysAgo = Date.now() / 1000 - 30 * 86400;
  const history: TvlDataPoint[] = allTvl
    .filter((p: { date: number }) => p.date >= thirtyDaysAgo)
    .map((p: { date: number; totalLiquidityUSD: number }) => ({
      date: p.date,
      tvl: p.totalLiquidityUSD,
    }));

  return { currentTvl, history };
}

// ---------------------------------------------------------------------------
// AI summaries via Anthropic
// ---------------------------------------------------------------------------

// Simple retry with backoff for rate limits
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
      max_tokens: 300,
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

async function generateAiSummary(
  handle: string,
  tweets: CompetitorTweet[]
): Promise<string> {
  console.log(`  Generating AI summary for @${handle}...`);
  const tweetTexts = tweets
    .map((t, i) => `Tweet ${i + 1}: ${t.fullText}`)
    .join("\n\n");

  return callLlm(
    `Summarise the key themes from these 5 recent tweets by @${handle} in 50 words or fewer. Be specific about products, features, or metrics. Neutral, analytical tone. Do not exceed 50 words.\n\n${tweetTexts}`
  );
}

async function determineMostInteresting(
  competitors: CompetitorData[]
): Promise<{ handle: string; tweetIndex: number; reason: string }> {
  console.log("  Determining most interesting tweet...");
  const allTweets = competitors.flatMap((c) =>
    c.tweets.map((t, i) => ({
      handle: c.twitterHandle,
      index: i,
      text: t.fullText,
    }))
  );

  const tweetList = allTweets
    .map((t) => `@${t.handle} [${t.index}]: ${t.text}`)
    .join("\n\n");

  const result = await callLlm(
    `From these competitor tweets, which single tweet is most strategically interesting for Kamino Finance (a Solana DeFi lending/liquidity protocol) to be aware of? Consider new product launches, competitive moves, partnerships, or metric announcements.\n\nRespond ONLY with valid JSON, no other text: {"handle": "...", "tweetIndex": 0, "reason": "..."}\n\n${tweetList}`
  );

  // Strip markdown code fences if present
  const cleaned = result.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`[competitor-scrape] Starting at ${new Date().toISOString()}`);

  const config = await fetchCompetitorConfig();
  console.log(`[competitor-scrape] Found ${config.length} competitors`);

  if (config.length === 0) {
    console.log("[competitor-scrape] No competitors configured, exiting.");
    return;
  }

  // Fetch Kamino TVL
  console.log("[competitor-scrape] Fetching Kamino TVL...");
  const kaminoTvlData = await fetchProtocolTvl("kamino");

  // Process competitors in parallel batches
  const BATCH_SIZE = 5;
  const competitors: CompetitorData[] = [];
  const followerCounts: Map<string, { twitterHandle: string; displayName: string; followerCount: number }> = new Map();

  // Helper: process a single competitor
  async function processCompetitor(comp: CompetitorConfig): Promise<{ data: CompetitorData; followerCount?: number } | null> {
    console.log(`[competitor-scrape] Processing @${comp.twitterHandle}...`);
    try {
      const [rawTweets, tvlData] = await Promise.all([
        fetchTweets(comp.twitterHandle),
        fetchProtocolTvl(comp.defiLlamaSlug).catch(() => ({
          currentTvl: 0,
          history: [] as TvlDataPoint[],
        })),
      ]);

      const nonReplyTweets = rawTweets
        .filter((t) => t.id && t.fullText && t.twitterUrl && !t.isReply)
        .slice(0, 5);

      const tweets: CompetitorTweet[] = nonReplyTweets.map((t) => {
        const thumbnailUrl =
          t.media?.[0] ||
          t.extendedEntities?.media?.find((m) => m.type === "photo")?.media_url_https ||
          t.entities?.media?.find((m) => m.type === "photo")?.media_url_https ||
          undefined;

        return {
          id: t.id,
          fullText: t.fullText,
          createdAt: t.createdAt,
          twitterUrl: t.twitterUrl,
          likeCount: t.likeCount ?? 0,
          bookmarkCount: t.bookmarkCount ?? 0,
          retweetCount: t.retweetCount ?? 0,
          replyCount: t.replyCount ?? 0,
          viewCount: t.viewCount ?? 0,
          ...(thumbnailUrl ? { thumbnailUrl } : {}),
        };
      });

      const profilePicture = rawTweets[0]?.author?.profilePicture || "";
      const displayName = rawTweets[0]?.author?.name || comp.displayName;
      const followerCount = rawTweets[0]?.author?.followersCount;

      // AI summary + per-tweet analysis in parallel
      let aiSummary = "";
      if (tweets.length > 0) {
        const aiPromises: Promise<void>[] = [];

        aiPromises.push(
          generateAiSummary(comp.twitterHandle, tweets)
            .then((s) => { aiSummary = s; })
            .catch((e) => { console.warn(`  AI summary failed for @${comp.twitterHandle}: ${(e as Error).message}`); })
        );

        for (const tweet of tweets) {
          aiPromises.push(
            callLlm(
              `This tweet by @${comp.twitterHandle} got ${tweet.likeCount} likes, ${tweet.bookmarkCount} bookmarks, ${tweet.retweetCount} retweets, and ${tweet.viewCount.toLocaleString()} views. In 1-2 sentences, explain WHY it performed the way it did - what content hook, format, or timing drove engagement (or lack of it)? Consider: emotional triggers, specificity of claims, use of metrics, visual content, community relevance, newsworthiness. Do NOT summarise the tweet content.\n\nTweet: "${tweet.fullText}"`,
            ).then((a) => { tweet.aiAnalysis = a; }).catch(() => {})
          );
        }

        await Promise.all(aiPromises);
      }

      return {
        data: {
          twitterHandle: comp.twitterHandle,
          displayName,
          defiLlamaSlug: comp.defiLlamaSlug,
          profilePicture,
          tvl: tvlData.currentTvl,
          tvlHistory: tvlData.history,
          aiSummary,
          tweets,
        },
        followerCount,
      };
    } catch (err) {
      console.error(`  Error processing @${comp.twitterHandle}:`, (err as Error).message);
      return null;
    }
  }

  // Run in batches of BATCH_SIZE to avoid overwhelming Apify
  for (let i = 0; i < config.length; i += BATCH_SIZE) {
    const batch = config.slice(i, i + BATCH_SIZE);
    console.log(`[competitor-scrape] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(config.length / BATCH_SIZE)} (${batch.map(c => c.twitterHandle).join(", ")})`);
    const results = await Promise.all(batch.map(processCompetitor));
    for (const r of results) {
      if (r) {
        competitors.push(r.data);
        if (r.followerCount != null) {
          followerCounts.set(r.data.twitterHandle, {
            twitterHandle: r.data.twitterHandle,
            displayName: r.data.displayName,
            followerCount: r.followerCount,
          });
        }
      }
    }
  }

  if (competitors.length === 0) {
    console.log("[competitor-scrape] No competitors processed successfully.");
    return;
  }

  // Compute highlights
  let mostLiked = { twitterHandle: "", tweetIndex: 0, likeCount: 0 };
  let mostBookmarked = { twitterHandle: "", tweetIndex: 0, bookmarkCount: 0 };

  for (const comp of competitors) {
    for (let i = 0; i < comp.tweets.length; i++) {
      if (comp.tweets[i].likeCount > mostLiked.likeCount) {
        mostLiked = {
          twitterHandle: comp.twitterHandle,
          tweetIndex: i,
          likeCount: comp.tweets[i].likeCount,
        };
      }
      if (comp.tweets[i].bookmarkCount > mostBookmarked.bookmarkCount) {
        mostBookmarked = {
          twitterHandle: comp.twitterHandle,
          tweetIndex: i,
          bookmarkCount: comp.tweets[i].bookmarkCount,
        };
      }
    }
  }

  let mostInterestingHighlight = {
    twitterHandle: mostLiked.twitterHandle,
    tweetIndex: mostLiked.tweetIndex,
    reason: "Highest engagement tweet",
  };
  try {
    const aiPick = await determineMostInteresting(competitors);
    mostInterestingHighlight = {
      twitterHandle: aiPick.handle,
      tweetIndex: aiPick.tweetIndex,
      reason: aiPick.reason,
    };
  } catch (e) {
    console.warn(`  Most interesting determination failed: ${(e as Error).message}`);
  }

  const highlights: CompetitorHighlights = {
    mostLiked,
    mostBookmarked,
    mostInteresting: mostInterestingHighlight,
  };

  const output: CompetitorDataFile = {
    timestamp: new Date().toISOString(),
    version: 1,
    kaminoTvl: kaminoTvlData.currentTvl,
    kaminoTvlHistory: kaminoTvlData.history,
    competitors,
    highlights,
  };

  // Atomic write
  const tmpPath = OUTPUT_PATH + ".tmp";
  writeFileSync(tmpPath, JSON.stringify(output, null, 2));
  renameSync(tmpPath, OUTPUT_PATH);

  console.log(`[competitor-scrape] Written to ${OUTPUT_PATH}`);

  // Archive tweets to Redis
  try {
    await archiveTweets(competitors, callLlm);
  } catch (e) {
    console.warn(`[competitor-scrape] Archive failed: ${(e as Error).message}`);
  }

  // Archive follower snapshots
  try {
    await archiveFollowerSnapshots(Array.from(followerCounts.values()));
  } catch (e) {
    console.warn(`[competitor-scrape] Follower snapshot failed: ${(e as Error).message}`);
  }

  console.log(`[competitor-scrape] Finished at ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("[competitor-scrape] Fatal error:", err);
  process.exit(1);
});
