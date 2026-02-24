import type { CompetitorData } from "@/lib/api/competitor-types";
import { CompetitorCardHeader } from "./CompetitorCardHeader";
import { TweetSummary } from "./TweetSummary";
import { TweetList } from "./TweetList";

export function CompetitorCard({
  competitor,
}: {
  competitor: CompetitorData;
}) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <CompetitorCardHeader
        displayName={competitor.displayName}
        handle={competitor.twitterHandle}
        profilePicture={competitor.profilePicture}
        tvl={competitor.tvl}
      />
      <div className="p-5 space-y-4">
        <TweetSummary summary={competitor.aiSummary} />
        <TweetList tweets={competitor.tweets} />
      </div>
    </div>
  );
}
