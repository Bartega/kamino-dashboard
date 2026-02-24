import { writeFileSync, renameSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
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
const GROQ_API_KEY = process.env.GROQ_API_KEY!;
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
  const parsed =
    typeof body.result === "string" ? JSON.parse(body.result) : body.result;
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
        maxItems: 5,
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
// Groq AI summaries (Llama 3.3 70B, free tier)
// ---------------------------------------------------------------------------

async function callLlm(prompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
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
    `Summarise the key themes from these 5 recent tweets by @${handle} in 30 words or fewer. Be specific about products, features, or metrics. Neutral, analytical tone. Do not exceed 30 words.\n\n${tweetTexts}`
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

  return JSON.parse(result);
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

  // Process each competitor
  const competitors: CompetitorData[] = [];
  for (const comp of config) {
    console.log(`[competitor-scrape] Processing @${comp.twitterHandle}...`);
    try {
      const rawTweets = await fetchTweets(comp.twitterHandle);

      const tweets: CompetitorTweet[] = rawTweets.map((t) => ({
        id: t.id,
        fullText: t.fullText,
        createdAt: t.createdAt,
        twitterUrl: t.twitterUrl,
        likeCount: t.likeCount ?? 0,
        bookmarkCount: t.bookmarkCount ?? 0,
        retweetCount: t.retweetCount ?? 0,
        replyCount: t.replyCount ?? 0,
        viewCount: t.viewCount ?? 0,
      }));

      const profilePicture = rawTweets[0]?.author?.profilePicture || "";
      const displayName = rawTweets[0]?.author?.name || comp.displayName;

      const tvlData = await fetchProtocolTvl(comp.defiLlamaSlug).catch(() => ({
        currentTvl: 0,
        history: [] as TvlDataPoint[],
      }));

      let aiSummary = "";
      try {
        aiSummary = await generateAiSummary(comp.twitterHandle, tweets);
      } catch (e) {
        console.warn(`  AI summary failed for @${comp.twitterHandle}: ${(e as Error).message}`);
        aiSummary = `Recent activity from @${comp.twitterHandle} (AI summary unavailable).`;
      }

      competitors.push({
        twitterHandle: comp.twitterHandle,
        displayName,
        defiLlamaSlug: comp.defiLlamaSlug,
        profilePicture,
        tvl: tvlData.currentTvl,
        tvlHistory: tvlData.history,
        aiSummary,
        tweets,
      });
    } catch (err) {
      console.error(
        `  Error processing @${comp.twitterHandle}:`,
        (err as Error).message
      );
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
  console.log(`[competitor-scrape] Finished at ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("[competitor-scrape] Fatal error:", err);
  process.exit(1);
});
