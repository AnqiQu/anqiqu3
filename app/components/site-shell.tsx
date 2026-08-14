import Link from "next/link";

export function LogoMark() {
  return <span className="brand-wordmark">Anqi Qu</span>;
}

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand-link">
          <LogoMark />
        </Link>

        <div className="header-actions">
          <Link href="/writing" className="header-link">
            Writing
          </Link>
          <Link href="/contact" className="header-link">
            Book a demo
          </Link>
          <Link href="/sandbox" className="button button-compact">
            Sandbox
            <span aria-hidden="true" className="button-square" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SectionHeader({
  title,
}: {
  title: string;
}) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-background-word" aria-hidden="true">
        Anqi Qu
      </div>
      <div className="footer-inner">
        <div className="footer-meta">
          <span>© {new Date().getFullYear()} Anqi Qu</span>
          <span>Built for real-world deployment.</span>
          <Link href="/writing">Writing</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
