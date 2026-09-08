import type { Metadata, Viewport } from "next";
import { SandboxExperience } from "./components/sandbox-experience";
import { Favicon } from "../components/favicon";
import "./sandbox.css";

// The sandbox shares as "Anqi Qu | Sandbox" with no image — it does not borrow
// the homepage's /og.png. (The browser-tab title stays "Anqi Qu".)
const sandboxShareTitle = "Anqi Qu | Sandbox";
const sandboxDescription =
  "An interactive solarpunk world of research, writing, preferences, memories, and unfinished ideas.";

export const metadata: Metadata = {
  title: "Anqi Qu",
  description: sandboxDescription,
  alternates: { canonical: "/sandbox" },
  openGraph: {
    type: "website",
    url: "/sandbox",
    siteName: "Anqi Qu",
    locale: "en_US",
    title: sandboxShareTitle,
    description: sandboxDescription,
  },
  twitter: {
    // No image, so a plain summary card rather than a large-image one.
    card: "summary",
    site: "@Anqinator",
    creator: "@Anqinator",
    title: sandboxShareTitle,
    description: sandboxDescription,
  },
};

export const viewport: Viewport = { themeColor: "#79cfff", colorScheme: "light" };

export default function SandboxPage() {
  return (
    <>
      <Favicon href="/sandbox-favicon.svg" />
      <SandboxExperience />
    </>
  );
}
