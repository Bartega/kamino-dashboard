export function TweetSummary({ summary }: { summary: string }) {
  const isFallback = !summary || summary.startsWith("I don't have access") || summary.startsWith("I don't have") || summary.length < 10;
  const lines = summary.split("\n").slice(0, 6).join("\n");
  return (
    <div className="bg-background rounded-lg p-3">
      <p className="text-xs font-medium text-accent mb-1">Tweet Summary</p>
      <p className="text-sm text-foreground leading-relaxed line-clamp-6">
        {isFallback ? "No recent tweet activity to summarise." : lines}
      </p>
    </div>
  );
}
