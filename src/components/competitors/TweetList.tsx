import type { CompetitorTweet } from "@/lib/api/competitor-types";
import { TweetItem } from "./TweetItem";

export function TweetList({ tweets }: { tweets: CompetitorTweet[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted">Latest tweets</p>
      {tweets.map((tweet) => (
        <TweetItem key={tweet.id} tweet={tweet} />
      ))}
    </div>
  );
}
