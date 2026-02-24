import type {
  CompetitorHighlights,
  CompetitorData,
} from "@/lib/api/competitor-types";
import { HighlightCard } from "./HighlightCard";

export function HighlightsBar({
  highlights,
  competitors,
}: {
  highlights: CompetitorHighlights;
  competitors: CompetitorData[];
}) {
  const findTweet = (handle: string, idx: number) => {
    const comp = competitors.find((c) => c.twitterHandle === handle);
    return comp?.tweets[idx];
  };

  const mostLikedTweet = findTweet(
    highlights.mostLiked.twitterHandle,
    highlights.mostLiked.tweetIndex
  );
  const mostBookmarkedTweet = findTweet(
    highlights.mostBookmarked.twitterHandle,
    highlights.mostBookmarked.tweetIndex
  );
  const mostInterestingTweet = findTweet(
    highlights.mostInteresting.twitterHandle,
    highlights.mostInteresting.tweetIndex
  );

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <HighlightCard
        label="Most Liked"
        handle={highlights.mostLiked.twitterHandle}
        metric={`${highlights.mostLiked.likeCount.toLocaleString("en-GB")} likes`}
        tweetPreview={mostLikedTweet?.fullText}
        tweetUrl={mostLikedTweet?.twitterUrl}
      />
      <HighlightCard
        label="Most Bookmarked"
        handle={highlights.mostBookmarked.twitterHandle}
        metric={`${highlights.mostBookmarked.bookmarkCount.toLocaleString("en-GB")} bookmarks`}
        tweetPreview={mostBookmarkedTweet?.fullText}
        tweetUrl={mostBookmarkedTweet?.twitterUrl}
      />
      <HighlightCard
        label="Most Interesting"
        handle={highlights.mostInteresting.twitterHandle}
        metric={highlights.mostInteresting.reason}
        tweetPreview={mostInterestingTweet?.fullText}
        tweetUrl={mostInterestingTweet?.twitterUrl}
      />
    </div>
  );
}
