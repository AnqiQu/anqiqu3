import type { Metadata } from "next";
import { WritingsShell } from "../writings/shell";
import { getResearch } from "../writings/content";

export const metadata: Metadata = {
  title: "Research | Anqi Qu",
  description: "Anqi's research, papers, and projects.",
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
