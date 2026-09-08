import type { Metadata } from "next";
import { WritingsShell } from "../writings/shell";
import { getResearch } from "../writings/content";

// Research shares as "Anqi Qu | Research" with no image — it does not borrow
// the homepage's /og.png. (The browser-tab title stays "Research | Anqi Qu".)
const researchShareTitle = "Anqi Qu | Research";
const researchDescription = "Anqi's research, papers, and projects.";

export const metadata: Metadata = {
  title: "Research | Anqi Qu",
  description: researchDescription,
  alternates: { canonical: "/research" },
  openGraph: {
    type: "website",
    url: "/research",
    siteName: "Anqi Qu",
    locale: "en_US",
    title: researchShareTitle,
    description: researchDescription,
  },
  twitter: {
    // No image, so a plain summary card rather than a large-image one.
    card: "summary",
    site: "@Anqinator",
    creator: "@Anqinator",
    title: researchShareTitle,
    description: researchDescription,
  },
};

export default function ResearchPage() {
  const research = getResearch();
  return (
    <WritingsShell active={{ section: "research" }}>
      <article className="wr-paper">
        <h1 className="wr-title">{research.title}</h1>
        {research.subtitle && <p className="wr-subtitle">{research.subtitle}</p>}
        {research.dateLabel && <p className="wr-date">{research.dateLabel}</p>}
        <div className="wr-body" dangerouslySetInnerHTML={{ __html: research.html }} />
      </article>
    </WritingsShell>
  );
}
