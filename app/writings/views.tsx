import type { Article, Section } from "./content";

// A single piece rendered as plain writing on paper: Philosopher heading, the
// date beneath it, then the Markdown body in Open Sans.
export function ArticleView({ article }: { article: Article }) {
  return (
    <article className="wr-paper">
      <h1 className="wr-title">{article.title}</h1>
      {article.dateLabel && <p className="wr-date">{article.dateLabel}</p>}
      <div className="wr-body" dangerouslySetInnerHTML={{ __html: article.html }} />
    </article>
  );
}

const SECTION_TITLE: Record<Section, string> = {
  writing: "Writing",
  manifesto: "Manifesto",
};

const SECTION_LEDE: Record<Section, string> = {
  writing: "Essays, notes, and other things worth keeping.",
  manifesto: "Things I believe about how to work and live.",
};

// The landing page for a section: a quiet list linking to each piece.
export function SectionIndex({
  section,
  articles,
}: {
  section: Section;
  articles: Article[];
}) {
  return (
    <div className="wr-paper">
      <h1 className="wr-title">{SECTION_TITLE[section]}</h1>
      <p className="wr-lede">{SECTION_LEDE[section]}</p>

      {articles.length === 0 ? (
        <p className="wr-empty">Nothing here yet.</p>
      ) : (
        <ul className="wr-index-list">
          {articles.map((a) => (
            <li key={a.slug} className="wr-index-item">
              <a href={`/${section}/${a.slug}`} className="wr-index-link">
                {a.title}
              </a>
              {a.dateLabel && <p className="wr-index-date">{a.dateLabel}</p>}
              {a.excerpt && <p className="wr-index-excerpt">{a.excerpt}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
