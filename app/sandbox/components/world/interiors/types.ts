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
  // Optional standing-height field: when present the walk rig follows it (with
  // step-up / fall behaviour) instead of a flat floor, so a room can have a
  // climbable spiral stair up to a raised deck. Returns the floor height under
  // (x, z). When omitted the floor is flat at `floorY`.
  floorHeightAt?: (x: number, z: number) => number;
  spawn: { x: number; z: number; yaw: number };
  // Raycast targets for the way out — a door, an open doorway, or the land you
  // step back onto — plus the private materials that glow while it is hovered
  // (private so the shared palette cache stays untouched). May be empty glow.
  doorMeshes: THREE.Object3D[];
  doorGlow: THREE.MeshLambertMaterial[];
  // Clickable objects inside the room that navigate elsewhere (the beacon orbs
  // that open the writing / research / manifesto pages). A click on any of a
  // link's meshes sends the browser to `href` — in a new tab when `newTab`.
  links?: { meshes: THREE.Object3D[]; href: string; newTab?: boolean }[];
  // Called each frame with the link mesh currently under the pointer (or null),
  // so a room can add hover feedback beyond the pointer cursor — e.g. a flower's
  // bulb glowing only while it is aimed at.
  onHoverLink?: (mesh: THREE.Object3D | null) => void;
  // Scene dressing the controller applies.
  background: number;
  fog?: { color: number; near: number; far: number };
  far?: number;
  update?: (t: number, dt: number) => void;
  dispose: () => void;
};
