export function Footer() {
  return (
    <footer className="border-t border-border mt-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-sm text-muted leading-relaxed max-w-3xl">
          This site is for educational purposes only. All DeFi carries risk
          including smart contract risk, liquidation risk, and loss of funds.
          APYs shown are historical and not guaranteed. Do your own research.
          Nothing here constitutes financial advice.
        </p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <a
            href="https://kamino.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-foreground transition-colors"
          >
            Kamino App
          </a>
          <a
            href="https://docs.kamino.finance"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-foreground transition-colors"
          >
            Kamino Docs
          </a>
          <a
            href="https://x.com/xBartega"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-foreground transition-colors"
          >
            @xBartega
          </a>
        </div>
        <p className="mt-8 text-lg font-semibold text-foreground">
          Tokenise everything.
        </p>
      </div>
    </footer>
  );
}
