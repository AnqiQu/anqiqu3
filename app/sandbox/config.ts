export type SandboxLocation = {
  id: string;
  label: string;
  description: string;
  href?: string;
  asset: string;
  activeAsset?: string;
  desktop: { left: string; top: string; width: string; zIndex: number };
  mobile: { left: string; top: string; width: string; zIndex: number };
  anchor: "bottom-left" | "bottom-center" | "center";
  interaction: "navigate" | "open-panel" | "ambient" | "swap-state";
  reducedMotion: "static" | "state-only";
};

export const sandboxLocations: SandboxLocation[] = [
  {
    id: "observatory",
    label: "Observatory",
    description: "Papers & research",
    href: "/sandbox/research",
    asset: "/sandbox/assets/landmarks/observatory.webp",
    desktop: { left: "35.7%", top: "4.5%", width: "32%", zIndex: 4 },
    mobile: { left: "20%", top: "12.5%", width: "64%", zIndex: 4 },
    anchor: "bottom-center",
    interaction: "navigate",
    reducedMotion: "static",
  },
  {
    id: "archive",
    label: "Archive",
    description: "Old ideas & memories",
    href: "/sandbox/archive",
    asset: "/sandbox/assets/landmarks/archive-closed.webp",
    activeAsset: "/sandbox/assets/landmarks/archive-open.webp",
    desktop: { left: "8%", top: "36%", width: "25.5%", zIndex: 5 },
    mobile: { left: "7%", top: "32%", width: "43%", zIndex: 5 },
    anchor: "bottom-center",
    interaction: "swap-state",
    reducedMotion: "state-only",
  },
  {
    id: "garden",
    label: "Garden of Preferences",
    description: "Things I like",
    href: "/sandbox/preferences",
    asset: "/sandbox/assets/landmarks/garden.webp",
    desktop: { left: "36%", top: "40.5%", width: "28%", zIndex: 6 },
    mobile: { left: "48%", top: "38.5%", width: "46%", zIndex: 6 },
    anchor: "bottom-center",
    interaction: "navigate",
    reducedMotion: "static",
  },
  {
    id: "pond",
    label: "Pond",
    description: "No productivity detected",
    asset: "/sandbox/assets/landmarks/pond.webp",
    desktop: { left: "30%", top: "66%", width: "38%", zIndex: 7 },
    mobile: { left: "14%", top: "62%", width: "70%", zIndex: 7 },
    anchor: "center",
    interaction: "ambient",
    reducedMotion: "state-only",
  },
  {
    id: "unfinished-bridge",
    label: "Unfinished Bridge",
    description: "Ideas in progress",
    href: "/sandbox/ideas",
    asset: "/sandbox/assets/landmarks/unfinished-bridge.webp",
    desktop: { left: "69%", top: "63%", width: "32%", zIndex: 9 },
    mobile: { left: "49%", top: "77%", width: "54%", zIndex: 9 },
    anchor: "bottom-left",
    interaction: "navigate",
    reducedMotion: "static",
  },
  {
    id: "return-sign",
    label: "Return to the server room",
    description: "Main website",
    href: "/",
    asset: "/sandbox/assets/navigation/return-sign.webp",
    desktop: { left: "5.2%", top: "61%", width: "16%", zIndex: 10 },
    mobile: { left: "2%", top: "78%", width: "38%", zIndex: 10 },
    anchor: "bottom-center",
    interaction: "navigate",
    reducedMotion: "static",
  },
];

export const sandboxDecorations = [
  { id: "golden-dog", asset: "/sandbox/assets/creatures/golden-dog-running.webp", desktop: ["65%", "46%", "13%"], mobile: ["18%", "48%", "29%"], zIndex: 8 },
  { id: "black-white-dog", asset: "/sandbox/assets/creatures/black-white-dog-running.webp", desktop: ["75%", "52%", "13%"], mobile: ["50%", "49.5%", "30%"], zIndex: 8 },
  { id: "large-blimp", asset: "/sandbox/assets/environment/solar-blimp-large.webp", desktop: ["80%", "9%", "17%"], mobile: ["-14%", "0.5%", "64%"], zIndex: 2 },
  { id: "medium-blimp", asset: "/sandbox/assets/environment/solar-blimp-medium.webp", desktop: ["12%", "11%", "10%"], mobile: ["70%", "4%", "24%"], zIndex: 2 },
  { id: "small-blimp", asset: "/sandbox/assets/environment/solar-blimp-small.webp", desktop: ["56%", "5%", "7%"], mobile: ["58%", "10%", "12%"], zIndex: 2 },
] as const;
