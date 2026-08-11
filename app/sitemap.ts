import type { MetadataRoute } from "next";
import { writingArticles, manifestoArticles } from "./writings/content";

// The canonical origin. Kept in sync with metadataBase in app/layout.tsx.
const BASE_URL = "https://anqiqu.com";

// Static routes that always exist, with a rough sense of how important each is
// and how often it changes. Dynamic article routes are appended below.
const staticRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "monthly", priority: 1.0 },
  { path: "/research", changeFrequency: "monthly", priority: 0.8 },
  { path: "/writing", changeFrequency: "weekly", priority: 0.8 },
  { path: "/manifesto", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
  { path: "/sandbox", changeFrequency: "monthly", priority: 0.5 },
];

// Article dates are free-form frontmatter (e.g. "Summer 2025"), but a sitemap
// <lastmod> must be a W3C datetime. Only pass through strict YYYY-MM-DD values;
// anything else is omitted so crawlers don't reject the entry.
function isoDate(raw?: string): string | undefined {
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Writing and manifesto posts are file-driven, so they appear here
  // automatically the moment a Markdown file is added.
  const writingEntries: MetadataRoute.Sitemap = writingArticles.map((article) => ({
    url: `${BASE_URL}/writing/${article.slug}`,
    lastModified: isoDate(article.dateISO),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const manifestoEntries: MetadataRoute.Sitemap = manifestoArticles.map((article) => ({
    url: `${BASE_URL}/manifesto/${article.slug}`,
    lastModified: isoDate(article.dateISO),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...staticEntries, ...writingEntries, ...manifestoEntries];
}
