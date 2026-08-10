import type { Metadata } from "next";
import { WritingsShell } from "../writings/shell";
import { SectionIndex } from "../writings/views";
import { manifestoArticles } from "../writings/content";

export const metadata: Metadata = {
  title: "Manifesto | Anqi Qu",
  description: "Things Anqi Qu believes about how to work and live.",
};

export default function ManifestoPage() {
  return (
    <WritingsShell active={{ section: "manifesto" }}>
      <SectionIndex section="manifesto" articles={manifestoArticles} />
    </WritingsShell>
  );
}
