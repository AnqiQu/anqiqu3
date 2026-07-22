import Link from "next/link";
import { navigation } from "../content";

export function LogoMark() {
  return (
    <span className="brand-lockup" aria-label="Anqi Intelligence">
      <span className="brand-mark" aria-hidden="true">
        A<span>/</span>I
      </span>
      <span className="brand-name">ANQI INTELLIGENCE</span>
    </span>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand-link">
          <LogoMark />
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/contact" className="button button-compact header-cta">
          Book a demo
          <span aria-hidden="true">↗</span>
        </Link>

        <details className="mobile-nav">
          <summary aria-label="Open navigation">Menu</summary>
          <nav aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/contact">Book a demo</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-header">
      <p className="eyebrow">{eyebrow}</p>
      <div className="section-heading-row">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link href="/" className="brand-link">
          <LogoMark />
        </Link>
        <div className="footer-meta">
          <span>© {new Date().getFullYear()} Anqi Intelligence</span>
          <span>Built for real-world deployment.</span>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
