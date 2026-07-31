import type { Metadata, Viewport } from "next";
import { SandboxExperience } from "./components/sandbox-experience";
import "./sandbox.css";

export const metadata: Metadata = {
  title: "Sandbox | Anqi Intelligence",
  description: "An interactive solarpunk world of research, writing, preferences, memories, and unfinished ideas.",
  alternates: { canonical: "/sandbox" },
};

export const viewport: Viewport = { themeColor: "#79cfff", colorScheme: "light" };

export default function SandboxPage() {
  return <SandboxExperience />;
}
