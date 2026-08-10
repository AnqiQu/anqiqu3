import { Favicon } from "../components/favicon";
import { manifestoArticles, writingArticles, type Section } from "./content";
import "./writings.css";

export type ActiveNav = { section: "research" | Section; slug?: string };

function navClass(isActive: boolean): string | undefined {
  return isActive ? "wr-link is-active" : "wr-link";
}

// The left-hand contents tree, shared by every page in the section. On desktop
// it is always visible; on mobile it collapses into the <details> fold below.
function ContentsTree({ active }: { active: ActiveNav }) {
  return (
    <ul className="wr-tree">
      <li>
        <a href="/research" className={navClass(active.section === "research")}>
          Research
        </a>
      </li>

      <li>
        <a
          href="/writing"
          className={navClass(active.section === "writing" && !active.slug)}
        >
          Writing
        </a>
        {writingArticles.length > 0 && (
          <ul className="wr-subtree">
            {writingArticles.map((a) => (
              <li key={a.slug}>
                <a
                  href={`/writing/${a.slug}`}
                  className={navClass(active.section === "writing" && active.slug === a.slug)}
                >
                  {a.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </li>

      <li>
        <a
          href="/manifesto"
          className={navClass(active.section === "manifesto" && !active.slug)}
        >
          Manifesto
        </a>
        {manifestoArticles.length > 0 && (
          <ul className="wr-subtree">
            {manifestoArticles.map((a) => (
              <li key={a.slug}>
                <a
                  href={`/manifesto/${a.slug}`}
                  className={navClass(active.section === "manifesto" && active.slug === a.slug)}
                >
                  {a.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </li>
    </ul>
  );
}

export function WritingsShell({
  active,
  children,
}: {
  active: ActiveNav;
  children: React.ReactNode;
}) {
  return (
    <div className="wr-root">
      <Favicon href="/writing-favicon.svg" />
      <aside className="wr-sidebar">
        <a href="/sandbox" className="wr-back" aria-label="Back to the sandbox">
          <span className="wr-back-arrow" aria-hidden="true">
            ←
          </span>
          <span className="wr-back-label">Sandbox</span>
        </a>

        {/* Always visible on desktop (CSS); a pure-CSS fold on mobile via the
            hidden checkbox + label toggle. No client JS. */}
        <input type="checkbox" id="wr-nav-toggle" className="wr-nav-checkbox" />
        <label htmlFor="wr-nav-toggle" className="wr-nav-summary">
          Contents
        </label>
        <nav className="wr-nav-body" aria-label="Writing contents">
          <ContentsTree active={active} />
        </nav>
      </aside>

      <main className="wr-main">{children}</main>
    </div>
  );
}
