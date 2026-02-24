export function TweetSummary({ summary }: { summary: string }) {
  return (
    <div className="bg-background rounded-lg p-3">
      <p className="text-xs font-medium text-accent mb-1">AI Summary</p>
      <p className="text-sm text-foreground leading-relaxed">{summary}</p>
    </div>
  );
}
