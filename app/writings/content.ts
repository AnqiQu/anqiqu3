import { marked } from "marked";

// The writing section is file-driven: drop a Markdown file into
// content/writing/ or content/manifesto/ and it shows up automatically. Vite's
// import.meta.glob inlines every matching file's raw text at build time, so
// there is no filesystem read at runtime (this ships to a Cloudflare Worker).
//
// Each file may start with a small frontmatter block:
//
//   ---
//   title: On Building Slowly
//   date: 2026-08-10
//   ---
//
//   Body text in Markdown...
//
// `title` and `date` are both optional — the title falls back to the first
// heading (or the filename), and the date is simply omitted if absent.

export type Section = "writing" | "manifesto";

export type Article = {
  slug: string;
  title: string;
  subtitle?: string;
  dateISO?: string;
  dateLabel?: string;
  sortKey: number;
  html: string;
  excerpt: string;
  section: Section;
};

const writingFiles = import.meta.glob("./content/writing/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const manifestoFiles = import.meta.glob("./content/manifesto/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const researchFiles = import.meta.glob("./content/research.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

marked.setOptions({ gfm: true, breaks: false });

function slugFromPath(path: string): string {
  const file = path.split("/").pop() ?? path;
  return file.replace(/\.md$/i, "");
}

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = /^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) data[key] = value;
  }
  return { data, body: raw.slice(match[0].length) };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Format YYYY-MM-DD without touching Date/Intl (kept deterministic and
// timezone-proof). Non-matching strings are shown verbatim.
function formatDate(raw?: string): { label?: string; sortKey: number } {
  if (!raw) return { sortKey: 0 };
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!m) return { label: raw, sortKey: 0 };
  const [, y, mo, d] = m;
  const month = MONTHS[Number(mo) - 1] ?? mo;
  const sortKey = Number(y) * 10000 + Number(mo) * 100 + Number(d);
  return { label: `${month} ${Number(d)}, ${y}`, sortKey };
}

function deriveTitle(body: string, fallback: string): string {
  const heading = /^#{1,6}[ \t]+(.+)$/m.exec(body);
  if (heading) return heading[1].trim();
  return fallback;
}

// A short plain-text preview for the index listings: first real paragraph,
// stripped of the most common inline Markdown so it reads as prose.
function makeExcerpt(body: string): string {
  const para = body
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith("#") && !block.startsWith("---"));
  if (!para) return "";
  const text = para
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 200 ? `${text.slice(0, 197).trimEnd()}…` : text;
}

function buildArticle(path: string, raw: string, section: Section): Article {
  const { data, body } = parseFrontmatter(raw);
  const slug = slugFromPath(path);
  const { label, sortKey } = formatDate(data.date);
  return {
    slug,
    title: data.title?.trim() || deriveTitle(body, slug),
    subtitle: data.subtitle?.trim() || undefined,
    dateISO: data.date,
    dateLabel: label,
    sortKey,
    html: marked.parse(body) as string,
    excerpt: makeExcerpt(body),
    section,
  };
}

// Newest first (by date), then alphabetical by title as a stable tiebreaker.
function byRecency(a: Article, b: Article): number {
  if (b.sortKey !== a.sortKey) return b.sortKey - a.sortKey;
  return a.title.localeCompare(b.title);
}

function collect(files: Record<string, string>, section: Section): Article[] {
  return Object.entries(files)
    .map(([path, raw]) => buildArticle(path, raw, section))
    .sort(byRecency);
}

export const writingArticles: Article[] = collect(writingFiles, "writing");
export const manifestoArticles: Article[] = collect(manifestoFiles, "manifesto");

export function articlesFor(section: Section): Article[] {
  return section === "writing" ? writingArticles : manifestoArticles;
}

export function getArticle(section: Section, slug: string): Article | undefined {
  return articlesFor(section).find((a) => a.slug === slug);
}

// The Research page is a single editable Markdown file (content/research.md).
export type ResearchPage = { title: string; subtitle?: string; dateLabel?: string; html: string };

export function getResearch(): ResearchPage {
  const entry = Object.entries(researchFiles)[0];
  if (!entry) {
    return {
      title: "Research",
      html: "<p>Nothing here yet.</p>",
    };
  }
  const { data, body } = parseFrontmatter(entry[1]);
  const { label } = formatDate(data.date);
  return {
    title: data.title?.trim() || deriveTitle(body, "Research"),
    subtitle: data.subtitle?.trim() || undefined,
    dateLabel: label,
    html: marked.parse(body) as string,
  };
}
