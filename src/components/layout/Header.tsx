export function Header() {
  const links = [
    { label: "Overview", href: "#overview" },
    { label: "Borrow", href: "#borrow" },
    { label: "Liquidity", href: "#liquidity" },
    { label: "Multiply", href: "#multiply" },
    { label: "Competitors", href: "/competitors" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <a href="#" className="flex items-center gap-2">
          <span className="text-xl font-bold text-foreground">kamino</span>
          <span className="text-xl font-light text-liquidity-blue">opportunities</span>
        </a>
        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="https://kamino.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors"
        >
          Open Kamino
        </a>
      </div>
    </header>
  );
}
