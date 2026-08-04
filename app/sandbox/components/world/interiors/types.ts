import type * as THREE from "three";

// Room-scale interiors behind the clickable landmarks. Each is its own tiny
// scene: the island keeps rendering as usual until a landmark is clicked, then
// the engine swaps to the interior's scene + walk camera behind a fade.

// Where the player may stand. Rooms are either rectangular (greenhouse,
// bridge deck) or round (observatory drum, burrow), so bounds come in both
// shapes; the walk rig clamps position inside, minus the player radius.
export type RoomBounds =
  | { kind: "rect"; minX: number; maxX: number; minZ: number; maxZ: number }
  | { kind: "circle"; x: number; z: number; r: number };

// Furniture the player is pushed out of (tables, beds, the hearth).
export type Collider =
  | { kind: "rect"; minX: number; maxX: number; minZ: number; maxZ: number }
  | { kind: "circle"; x: number; z: number; r: number };

export type Interior = {
  group: THREE.Group;
  bounds: RoomBounds;
  colliders: Collider[];
  floorY: number;
  spawn: { x: number; z: number; yaw: number };
  // Raycast targets for the exit door, and the private materials that glow
  // while it is hovered (private so the shared palette cache stays untouched).
  doorMeshes: THREE.Object3D[];
  doorGlow: THREE.MeshLambertMaterial[];
  // Scene dressing the controller applies.
  background: number;
  fog?: { color: number; near: number; far: number };
  far?: number;
  update?: (t: number, dt: number) => void;
  dispose: () => void;
};
