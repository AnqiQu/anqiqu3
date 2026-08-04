import * as THREE from "three";
import { P, mat } from "../palette";
import { rng } from "../util";

// Shared outdoor dressing for the interiors whose walls open onto the island —
// low-poly trees and puffy clouds, built to match the world outside so the view
// through a greenhouse pane or off the bridge reads as the same landscape.

const CANOPY = [P.canopy, P.canopyLight, P.canopyDark];

// A low-poly tree — trunk plus a couple of canopy puffs — grounded at (x,y,z).
// Cheap per-call geometry; the interiors only ever place a handful.
export function addTree(
  group: THREE.Group,
  geometries: THREE.BufferGeometry[],
  x: number,
  y: number,
  z: number,
  scale: number,
  seed: number,
): void {
  const rand = rng(seed);
  const trunkGeo = new THREE.CylinderGeometry(0.16 * scale, 0.26 * scale, 1.5 * scale, 6);
  const puffGeo = new THREE.IcosahedronGeometry(0.95 * scale, 0);
  geometries.push(trunkGeo, puffGeo);
  const trunk = new THREE.Mesh(trunkGeo, mat(P.woodDark, { flat: true }));
  trunk.position.set(x, y + 0.72 * scale, z);
  group.add(trunk);
  const puffs = 2 + Math.floor(rand() * 2);
  for (let p = 0; p < puffs; p++) {
    const puff = new THREE.Mesh(puffGeo, mat(CANOPY[(p + seed) % 3], { flat: true }));
    puff.position.set(
      x + (rand() - 0.5) * 0.7 * scale,
      y + (1.45 + p * 0.5) * scale,
      z + (rand() - 0.5) * 0.7 * scale,
    );
    puff.scale.setScalar(1 - p * 0.18);
    group.add(puff);
  }
}

// White cloud material with a neutral emissive floor so unlit faces stay white.
// The caller owns disposal via the list it passes in.
export function cloudMaterial(materials: THREE.Material[]): THREE.MeshLambertMaterial {
  const m = new THREE.MeshLambertMaterial({ color: P.cloud });
  m.emissive.setHex(0xa8a6a2);
  materials.push(m);
  return m;
}

// Puffy cloud clusters — three squashed spheres per spot [cx, cy, cz, scale].
export function addCloudClusters(
  group: THREE.Group,
  geometries: THREE.BufferGeometry[],
  cloudMat: THREE.Material,
  spots: Array<[number, number, number, number]>,
): void {
  const puffGeo = new THREE.SphereGeometry(1, 9, 7);
  geometries.push(puffGeo);
  for (const [cx, cy, cz, s] of spots) {
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(cx + (i - 1) * s * 1.1, cy + (i % 2) * s * 0.25, cz + (i % 2 ? -1 : 1) * s * 0.2);
      puff.scale.set(s * 1.3, s * 0.6, s);
      group.add(puff);
    }
  }
}

// A basic low rolling hill — a wide, squashed green dome — to give the distant
// ground some relief without the cost of a real terrain mesh.
export function addHill(
  group: THREE.Group,
  geometries: THREE.BufferGeometry[],
  x: number,
  y: number,
  z: number,
  radius: number,
  height: number,
  color: number = P.meadow,
): void {
  const geo = new THREE.SphereGeometry(radius, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  geometries.push(geo);
  const hill = new THREE.Mesh(geo, mat(color, { flat: true }));
  hill.position.set(x, y - radius + height, z);
  hill.scale.y = height / radius;
  group.add(hill);
}
