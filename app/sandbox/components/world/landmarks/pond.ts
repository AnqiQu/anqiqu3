import * as THREE from "three";
import { P, mat } from "../palette";
import { POND_CENTER, terrainHeight } from "../terrain";
import type { WorldModule } from "../types";
import { rng } from "../util";

// The pond: still water in the terrain basin, lily pads, reeds, and a rock
// rim. "No productivity detected."
export function buildPond(): WorldModule {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const rand = rng(88);
  const { x, z } = POND_CENTER;
  group.position.set(x, 0, z);

  // Water surface + slowly turning sparkle disc above it.
  const waterGeo = new THREE.CircleGeometry(3.2, 28);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = mat(P.water, { transparent: true, opacity: 0.6, depthWrite: false });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = -0.12;
  water.renderOrder = 1;
  const sparkGeo = new THREE.CircleGeometry(2.9, 24);
  sparkGeo.rotateX(-Math.PI / 2);
  const sparkMat = new THREE.MeshBasicMaterial({ color: P.waterSpark, transparent: true, opacity: 0.2, depthWrite: false });
  const spark = new THREE.Mesh(sparkGeo, sparkMat);
  spark.position.y = -0.08;
  spark.renderOrder = 2;
  group.add(water, spark);
  geometries.push(waterGeo, sparkGeo);
  materials.push(sparkMat);

  // Pond floor tint so the basin reads deep teal through the water.
  const floorGeo = new THREE.CircleGeometry(3.15, 28);
  floorGeo.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeo, mat(P.waterDeep));
  floor.position.y = -0.55;
  group.add(floor);
  geometries.push(floorGeo);

  // Rock rim.
  const rimRockGeo = new THREE.DodecahedronGeometry(0.34, 0);
  const rimRocks = new THREE.InstancedMesh(rimRockGeo, mat(P.rock, { flat: true }), 12);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + rand() * 0.3;
    const radius = 3.3 + rand() * 0.4;
    const px = Math.cos(angle) * radius;
    const pz = Math.sin(angle) * radius;
    dummy.position.set(px, terrainHeight(x + px, z + pz) + 0.12, pz);
    dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, 0);
    dummy.scale.setScalar(0.6 + rand() * 0.9);
    dummy.updateMatrix();
    rimRocks.setMatrixAt(i, dummy.matrix);
  }
  group.add(rimRocks);
  geometries.push(rimRockGeo);

  // Lily pads — notched discs; two carry pink blossom cones.
  const padGeo = new THREE.CircleGeometry(0.34, 9, 0.4, 5.5);
  padGeo.rotateX(-Math.PI / 2);
  const blossomGeo = new THREE.ConeGeometry(0.12, 0.22, 7);
  geometries.push(padGeo, blossomGeo);
  for (let i = 0; i < 6; i++) {
    const pad = new THREE.Mesh(padGeo, mat(P.lily));
    const angle = rand() * Math.PI * 2;
    const radius = rand() * 2.2;
    pad.position.set(Math.cos(angle) * radius, -0.06, Math.sin(angle) * radius);
    pad.rotation.y = rand() * Math.PI * 2;
    pad.scale.setScalar(0.7 + rand() * 0.7);
    pad.renderOrder = 3;
    group.add(pad);
    if (i < 2) {
      const blossom = new THREE.Mesh(blossomGeo, mat(P.blossomPink));
      blossom.position.set(pad.position.x, 0.06, pad.position.z);
      group.add(blossom);
    }
  }

  // Reeds around the rim.
  const reedGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.9, 5);
  const reeds = new THREE.InstancedMesh(reedGeo, mat(P.moss), 10);
  for (let i = 0; i < 10; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 3.5 + rand() * 0.7;
    const px = Math.cos(angle) * radius;
    const pz = Math.sin(angle) * radius;
    dummy.position.set(px, terrainHeight(x + px, z + pz) + 0.4, pz);
    dummy.rotation.set((rand() - 0.5) * 0.2, 0, (rand() - 0.5) * 0.2);
    dummy.scale.setScalar(0.7 + rand() * 0.6);
    dummy.updateMatrix();
    reeds.setMatrixAt(i, dummy.matrix);
  }
  group.add(reeds);
  geometries.push(reedGeo);

  return {
    group,
    update(t) {
      spark.rotation.y = t * 0.05;
      sparkMat.opacity = 0.16 + 0.06 * Math.sin(t * 0.7);
      spark.scale.setScalar(1 + 0.015 * Math.sin(t * 0.9));
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      rimRocks.dispose();
      reeds.dispose();
    },
  };
}
