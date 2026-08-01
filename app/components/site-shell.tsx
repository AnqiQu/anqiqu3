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

        <Link href="/contact" className="button button-compact header-cta">
          Book a demo
          <span aria-hidden="true">↗</span>
        </Link>
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
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
