import type * as THREE from "three";

export type WorldModule = {
  group: THREE.Group;
  update?: (t: number, dt: number) => void;
  dispose: () => void;
};

// A spot the cat can nap on that isn't the ground — a bench seat, a bridge
// plank. Handed back by whichever module builds the thing, so the surface
// height can never drift out of sync with the model standing on it.
export type Perch = {
  position: THREE.Vector3;
  yaw: number;
};
