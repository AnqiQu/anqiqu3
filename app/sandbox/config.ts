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
  // Destination for future content sub-routes; inert until those pages exist.
  href?: string;
  interaction: "navigate" | "open-panel" | "ambient" | "swap-state";
  world3d?: World3DConfig;
};

export const sandboxLocations: SandboxLocation[] = [
  {
    id: "observatory",
    label: "Observatory",
    description: "Papers & research",
    href: "/sandbox/research",
    interaction: "navigate",
    world3d: { position: [-6, 8, -14], labelOffsetY: 5.5, hitRadius: 4.5 },
  },
  {
    id: "archive",
    label: "Archive",
    description: "Old ideas & memories",
    href: "/sandbox/archive",
    interaction: "swap-state",
    world3d: { position: [-16, 2.2, -2], rotationY: -0.55, labelOffsetY: 3.2, hitRadius: 2.6 },
  },
  {
    id: "garden",
    label: "Garden of Preferences",
    description: "Things I like",
    href: "/sandbox/preferences",
    interaction: "navigate",
    world3d: { position: [6, 0, -4], rotationY: -0.25, labelOffsetY: 3.6, hitRadius: 3.4 },
  },
  {
    id: "pond",
    label: "Pond",
    description: "No productivity detected",
    interaction: "ambient",
    world3d: { position: [2, 0, 8], labelOffsetY: 1.8, hitRadius: 4.4 },
  },
  {
    id: "unfinished-bridge",
    label: "Unfinished Bridge",
    description: "Ideas in progress",
    href: "/sandbox/ideas",
    interaction: "navigate",
    world3d: { position: [16, 0.4, 10], rotationY: -0.35, labelOffsetY: 2.4, hitRadius: 3.8 },
  },
];
