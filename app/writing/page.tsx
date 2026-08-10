import type { Metadata } from "next";
import { WritingsShell } from "../writings/shell";
import { SectionIndex } from "../writings/views";
import { writingArticles } from "../writings/content";

export const metadata: Metadata = {
  title: "Writing | Anqi Qu",
  description: "Essays, notes, and other writing by Anqi Qu.",
};

export default function WritingPage() {
  return (
    <WritingsShell active={{ section: "writing" }}>
      <SectionIndex section="writing" articles={writingArticles} />
    </WritingsShell>
  );
}
