// 3D placement for the drag-explorable Three.js world. World units are roughly
// meters: the island plateau spans x ∈ [−26, 26], z ∈ [−20, 20], island surface
// sits near y = 0, and the observatory hill rises to y ≈ 8 in the −x/−z quadrant.
export type World3DConfig = {
  position: [number, number, number];
  rotationY?: number;
  // Height above `position` where the HTML label chip anchors.
  labelOffsetY: number;
  // Radius of the invisible raycast proxy sphere.
  hitRadius: number;
};

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
  world3d?: World3DConfig;
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
    world3d: { position: [-6, 8, -14], labelOffsetY: 5.5, hitRadius: 4.5 },
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
    world3d: { position: [-16, 2.2, -2], rotationY: -0.55, labelOffsetY: 3.2, hitRadius: 2.6 },
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
    world3d: { position: [6, 0, -4], rotationY: -0.25, labelOffsetY: 3.6, hitRadius: 3.4 },
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
    world3d: { position: [2, 0, 8], labelOffsetY: 1.8, hitRadius: 4.4 },
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
    world3d: { position: [16, 0.4, 10], rotationY: -0.35, labelOffsetY: 2.4, hitRadius: 3.8 },
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
    world3d: { position: [-9, 0.3, 9], rotationY: 0.35, labelOffsetY: 2.2, hitRadius: 1.8 },
  },
];

export const sandboxDecorations = [
  { id: "golden-dog", asset: "/sandbox/assets/creatures/golden-dog-running.webp", desktop: ["65%", "46%", "13%"], mobile: ["18%", "48%", "29%"], zIndex: 8 },
  { id: "black-white-dog", asset: "/sandbox/assets/creatures/black-white-dog-running.webp", desktop: ["75%", "52%", "13%"], mobile: ["50%", "49.5%", "30%"], zIndex: 8 },
  { id: "large-blimp", asset: "/sandbox/assets/environment/solar-blimp-large.webp", desktop: ["80%", "9%", "17%"], mobile: ["-14%", "0.5%", "64%"], zIndex: 2 },
  { id: "medium-blimp", asset: "/sandbox/assets/environment/solar-blimp-medium.webp", desktop: ["12%", "11%", "10%"], mobile: ["70%", "4%", "24%"], zIndex: 2 },
  { id: "small-blimp", asset: "/sandbox/assets/environment/solar-blimp-small.webp", desktop: ["56%", "5%", "7%"], mobile: ["58%", "10%", "12%"], zIndex: 2 },
] as const;
