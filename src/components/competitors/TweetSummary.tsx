export function TweetSummary({ summary }: { summary: string }) {
  const lines = summary.split("\n").slice(0, 6).join("\n");
  return (
    <div className="bg-background rounded-lg p-3">
      <p className="text-xs font-medium text-accent mb-1">AI Summary</p>
      <p className="text-sm text-foreground leading-relaxed line-clamp-6">{lines}</p>
    </div>
  );
}
