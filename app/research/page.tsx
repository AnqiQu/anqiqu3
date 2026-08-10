import type { Metadata } from "next";
import { WritingsShell } from "../writings/shell";
import { getResearch } from "../writings/content";

export const metadata: Metadata = {
  title: "Research | Anqi Qu",
  description: "An index of research, papers, and projects by Anqi Qu.",
};

export default function ResearchPage() {
  const research = getResearch();
  return (
    <WritingsShell active={{ section: "research" }}>
      <article className="wr-paper">
        <h1 className="wr-title">{research.title}</h1>
        {research.dateLabel && <p className="wr-date">{research.dateLabel}</p>}
        <div className="wr-body" dangerouslySetInnerHTML={{ __html: research.html }} />
      </article>
    </WritingsShell>
  );
}
