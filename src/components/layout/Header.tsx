import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function Header() {
  const links = [
    { label: "Overview", href: "/#overview" },
    { label: "Competitors", href: "/competitors" },
    { label: "Analysis", href: "/competitors/analysis" },
    { label: "Archive", href: "/competitors/archive" },
    { label: "Digest", href: "/competitors/digest" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
        <a href="#" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold text-foreground">Kamino</span>
          <span className="text-xl font-light text-liquidity-blue">marketing dashboard</span>
        </a>
        <nav className="hidden md:flex items-center justify-center gap-1 flex-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium px-3 py-1.5 rounded-lg text-foreground hover:bg-accent/15 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <a
            href="https://kamino.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
          >
            Open Kamino
          </a>
        </div>
      </div>
    </header>
  );
}
