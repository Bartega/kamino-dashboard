export function HighlightCard({
  label,
  handle,
  metric,
  tweetPreview,
  tweetUrl,
}: {
  label: string;
  handle: string;
  metric: string;
  tweetPreview?: string;
  tweetUrl?: string;
}) {
  return (
    <div className="bg-card rounded-xl p-5">
      <p className="text-xs font-medium text-accent mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground mb-1">@{handle}</p>
      <p className="text-sm text-muted mb-2">{metric}</p>
      {tweetPreview && (
        <p className="text-xs text-muted line-clamp-2">{tweetPreview}</p>
      )}
      {tweetUrl && (
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:text-foreground transition-colors mt-1 inline-block"
        >
          View tweet
        </a>
      )}
    </div>
  );
}
