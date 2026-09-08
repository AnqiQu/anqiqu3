import type { Metadata } from "next";
import type { Article, Section } from "./content";

// How each section names itself in a share card. This is deliberately distinct
// from the sidebar/nav labels in views.tsx ("Writing"/"Manifesto"): a shared
// piece reads "Anqi Qu | Writings | <title>".
const SHARE_SECTION_LABEL: Record<Section, string> = {
  writing: "Writings",
  manifesto: "Manifesto",
};

// Brand constants for the article card. Next.js does NOT deep-merge the
// `openGraph`/`twitter` objects down the segment tree, so an article page that
// wants its own card has to emit a complete one rather than inheriting a
// parent's.
const SITE_NAME = "Anqi Qu";
const TWITTER_HANDLE = "@Anqinator";

// Build the share-card (Open Graph + Twitter) metadata for a single article.
//
// Without this, article pages inherit whatever card the tree above them defines
// (only `title`/`description` are overridden per page, and Next.js replaces —
// never merges — the nested `openGraph`/`twitter` objects). Returning a full
// card here makes the preview reflect the piece being shared: "Anqi Qu |
// Writings | <title>", and the piece's own image *only if it defines one*. A
// piece with no image gets a text card with no image at all — the homepage's
// /og.png is never borrowed.
export function articleShareMetadata(article: Article): Metadata {
  const label = SHARE_SECTION_LABEL[article.section];
  const shareTitle = `${SITE_NAME} | ${label} | ${article.title}`;
  const description = article.excerpt || undefined;
  const path = `/${article.section}/${article.slug}`;
  // The piece's own card, if it defines one. No fallback: absent an image, the
  // card carries no image rather than the homepage's.
  const image = article.image;

  return {
    // The browser-tab / SEO title keeps the site's existing "<title> | Anqi Qu"
    // shape; only the share card uses the "Anqi Qu | Writings | <title>" form.
    title: `${article.title} | ${SITE_NAME}`,
    description,
    // Each piece is its own canonical URL rather than inheriting the homepage's.
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
      title: shareTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      // A large-image card only makes sense with an image; without one, a plain
      // summary card carries the title and description.
      card: image ? "summary_large_image" : "summary",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: shareTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
