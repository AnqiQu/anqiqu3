import type * as THREE from "three";

export type WorldModule = {
  group: THREE.Group;
  update?: (t: number, dt: number) => void;
  dispose: () => void;
};
