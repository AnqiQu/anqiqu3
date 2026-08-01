import * as THREE from "three";
import { valueNoise } from "./util";

// Shared terrain height field. Landmarks, creatures, and scatter placement all
// sample this instead of trusting config Y values, so everything sits on the
// ground no matter how the island is tuned.

export const ISLAND_RX = 26;
export const ISLAND_RZ = 20;

export const HILL_CENTER = { x: -8, z: -14 };
// Hilltop building pad. Must match the observatory's config world3d position.
export const OBSERVATORY_CENTER = { x: -6, z: -14 };
// Radius of the dead-flat pad (drum radius 3.6 + plinth + a margin so the
// meadow never rises inside the walls).
export const OBSERVATORY_PAD = 4.6;
export const POND_CENTER = { x: 2, z: 8 };
export const POND_RADIUS = 4.8; // water radius; rocks/reeds ring just outside

// Normalized elliptical radius: 1 at the island rim.
export function ellipticalRadius(x: number, z: number): number {
  return Math.sqrt((x / ISLAND_RX) ** 2 + (z / ISLAND_RZ) ** 2);
}

export function terrainHeight(x: number, z: number): number {
  const re = ellipticalRadius(x, z);

  // Rolling meadow: two octaves of value noise.
  let h = valueNoise(x * 0.15 + 40, z * 0.15 + 40) * 0.45 + valueNoise(x * 0.4, z * 0.4) * 0.2;

  // Observatory hill.
  const hd = (x - HILL_CENTER.x) ** 2 + (z - HILL_CENTER.z) ** 2;
  h += 8 * Math.exp(-hd / 98);

  // Archive burrow: a low rise centred just behind the door, so the ground
  // climbs into the mound instead of leaving the dome sitting on flat meadow.
  const bd = (x + 14.7) ** 2 + (z + 4.1) ** 2;
  h += 1.6 * Math.exp(-bd / 28);

  // Slight raised lip near the rim, like the painting's mossy edges.
  h += 0.5 * Math.exp(-(((re - 0.9) / 0.06) ** 2));

  // Pond basin.
  const pd = (x - POND_CENTER.x) ** 2 + (z - POND_CENTER.z) ** 2;
  h -= 1.2 * Math.exp(-pd / (2 * 4.8 * 4.8));

  // Flat terraces so the observatory and greenhouse sit level. The hilltop pad
  // is a true plateau — dead flat out to OBSERVATORY_PAD, then blended back
  // into the hill — so the observatory's flat base meets ground all the way
  // round instead of hovering over the downhill side.
  const od = Math.hypot(x - OBSERVATORY_CENTER.x, z - OBSERVATORY_CENTER.z);
  h = THREE.MathUtils.lerp(h, 7.7, 1 - THREE.MathUtils.smoothstep(od, OBSERVATORY_PAD, 9.5));
  const gd = (x - 6) ** 2 + (z + 4) ** 2;
  h = THREE.MathUtils.lerp(h, 0.45, Math.exp(-gd / (2 * 3.2 * 3.2)));

  // Fold the meadow edge down to meet the cliff skirt.
  const droop = THREE.MathUtils.smoothstep(re, 0.94, 1.0);
  return THREE.MathUtils.lerp(h, -2.5, droop);
}

const EPS = 0.35;

export function terrainNormal(x: number, z: number): THREE.Vector3 {
  const hl = terrainHeight(x - EPS, z);
  const hr = terrainHeight(x + EPS, z);
  const hd = terrainHeight(x, z - EPS);
  const hu = terrainHeight(x, z + EPS);
  return new THREE.Vector3(hl - hr, 2 * EPS, hd - hu).normalize();
}
