// 3D placement for the drag-explorable Three.js world. World units are roughly
// meters: the island plateau spans x ∈ [−26, 26], z ∈ [−20, 20], island surface
// sits near y = 0, and the observatory hill rises to y ≈ 8 in the −x/−z quadrant.
export type World3DConfig = {
  position: [number, number, number];
  rotationY?: number;
  // Height above `position` where the invisible raycast proxy sphere centers.
  hitOffsetY: number;
  // Radius of the invisible raycast proxy sphere.
  hitRadius: number;
};

export type SandboxLocation = {
  id: string;
  label: string;
  description: string;
  // "enter" spots open their walk-around interior when clicked; "open-panel"
  // spots reveal their long-form copy; "ambient" spots are scenery.
  interaction: "enter" | "open-panel" | "ambient";
  // Long-form copy an "open-panel" spot reveals when it is clicked.
  panel?: string;
  world3d?: World3DConfig;
};

export const sandboxLocations: SandboxLocation[] = [
  {
    id: "observatory",
    label: "Observatory",
    description: "Papers & research",
    interaction: "enter",
    world3d: { position: [-6, 8, -14], hitOffsetY: 2.2, hitRadius: 4.5 },
  },
  {
    id: "archive",
    label: "Archive",
    description: "Old ideas & memories",
    interaction: "enter",
    world3d: { position: [-16, 2.2, -2], rotationY: -0.55, hitOffsetY: 1.28, hitRadius: 2.6 },
  },
  {
    id: "garden",
    label: "Garden of Preferences",
    description: "Things I like",
    interaction: "enter",
    world3d: { position: [6, 0, -4], rotationY: -0.25, hitOffsetY: 1.44, hitRadius: 3.4 },
  },
  {
    id: "pond",
    label: "Pond",
    description: "No productivity detected",
    interaction: "ambient",
    world3d: { position: [2, 0, 8], hitOffsetY: 0.72, hitRadius: 4.4 },
  },
  {
    id: "bench-plaque",
    label: "Bench plaque",
    description: "Click to read",
    interaction: "open-panel",
    panel:
      "In loving memory of my dear friend Daniel Li - who is not dead, just generous. He inspired this sandbox. Somewhere in here is an easter egg dedicated to his site. Go find it.",
    // On the front of the bench's backrest, in the north-west tree grove.
    world3d: { position: [-11.43, 0.9, 13.79], hitOffsetY: 0.36, hitRadius: 0.9 },
  },
  {
    id: "unfinished-bridge",
    label: "Unfinished Bridge",
    description: "Ideas in progress",
    interaction: "enter",
    world3d: { position: [16, 0.4, 10], rotationY: -0.35, hitOffsetY: 0.96, hitRadius: 3.8 },
  },
];
