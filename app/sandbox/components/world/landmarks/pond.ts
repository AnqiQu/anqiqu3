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

  const WATER_R = 4.8; // 1.5× the original pond

  // Water surface + slowly turning sparkle disc above it. The water mesh is
  // exposed so clicks on it can spawn ripples.
  const waterGeo = new THREE.CircleGeometry(WATER_R, 32);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = mat(P.water, { transparent: true, opacity: 0.6, depthWrite: false });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = -0.12;
  water.renderOrder = 1;
  const sparkGeo = new THREE.CircleGeometry(WATER_R - 0.45, 28);
  sparkGeo.rotateX(-Math.PI / 2);
  const sparkMat = new THREE.MeshBasicMaterial({ color: P.waterSpark, transparent: true, opacity: 0.2, depthWrite: false });
  const spark = new THREE.Mesh(sparkGeo, sparkMat);
  spark.position.y = -0.08;
  spark.renderOrder = 2;
  group.add(water, spark);
  geometries.push(waterGeo, sparkGeo);
  materials.push(sparkMat);

  // Pond floor tint so the basin reads deep teal through the water.
  const floorGeo = new THREE.CircleGeometry(WATER_R - 0.1, 32);
  floorGeo.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeo, mat(P.waterDeep));
  floor.position.y = -0.65;
  group.add(floor);
  geometries.push(floorGeo);

  // Rock rim.
  const rimRockGeo = new THREE.DodecahedronGeometry(0.34, 0);
  const rimRocks = new THREE.InstancedMesh(rimRockGeo, mat(P.rock, { flat: true }), 16);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + rand() * 0.3;
    const radius = WATER_R + 0.2 + rand() * 0.5;
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
  for (let i = 0; i < 9; i++) {
    const pad = new THREE.Mesh(padGeo, mat(P.lily));
    const angle = rand() * Math.PI * 2;
    const radius = rand() * 3.4;
    pad.position.set(Math.cos(angle) * radius, -0.06, Math.sin(angle) * radius);
    pad.rotation.y = rand() * Math.PI * 2;
    pad.scale.setScalar(0.7 + rand() * 0.7);
    pad.renderOrder = 3;
    group.add(pad);
    if (i < 3) {
      const blossom = new THREE.Mesh(blossomGeo, mat(P.blossomPink));
      blossom.position.set(pad.position.x, 0.06, pad.position.z);
      group.add(blossom);
    }
  }

  // Click ripples: a small pool of expanding, fading rings on the water.
  const rippleGeo = new THREE.RingGeometry(0.86, 1, 28);
  rippleGeo.rotateX(-Math.PI / 2);
  geometries.push(rippleGeo);
  // Rings expand freely; only the arc that reaches the shore dissolves. The
  // mask fades fragments by world-space distance from the pond center, so the
  // rest of the ring carries on across the water. One shared function keeps
  // all six materials on a single compiled program.
  const maskRippleAtShore: THREE.Material["onBeforeCompile"] = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRippleWorld;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvRippleWorld = (modelMatrix * vec4(position, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRippleWorld;")
      .replace(
        "#include <color_fragment>",
        [
          "#include <color_fragment>",
          `float rippleShore = length(vRippleWorld.xz - vec2(${x.toFixed(1)}, ${z.toFixed(1)}));`,
          `diffuseColor.a *= 1.0 - smoothstep(${(WATER_R - 0.6).toFixed(2)}, ${(WATER_R - 0.15).toFixed(2)}, rippleShore);`,
        ].join("\n"),
      );
  };
  type Ripple = { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial; age: number };
  const ripples: Ripple[] = [];
  for (let i = 0; i < 6; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: P.waterSpark,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    material.onBeforeCompile = maskRippleAtShore;
    const mesh = new THREE.Mesh(rippleGeo, material);
    mesh.position.y = -0.06;
    mesh.renderOrder = 3;
    mesh.visible = false;
    group.add(mesh);
    materials.push(material);
    ripples.push({ mesh, material, age: Infinity });
  }
  let nextRipple = 0;
  const RIPPLE_LIFE = 1.1;
  const startRipple = (lx: number, lz: number, delay: number) => {
    const ripple = ripples[nextRipple];
    nextRipple = (nextRipple + 1) % ripples.length;
    ripple.mesh.position.set(lx, -0.06, lz);
    ripple.age = -delay;
  };

  // Reeds around the rim.
  const reedGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.9, 5);
  const reeds = new THREE.InstancedMesh(reedGeo, mat(P.moss), 14);
  for (let i = 0; i < 14; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = WATER_R + 0.5 + rand() * 0.8;
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
    update(t, dt) {
      spark.rotation.y = t * 0.05;
      sparkMat.opacity = 0.16 + 0.06 * Math.sin(t * 0.7);
      spark.scale.setScalar(1 + 0.015 * Math.sin(t * 0.9));
      for (const ripple of ripples) {
        ripple.age += dt;
        const k = ripple.age / RIPPLE_LIFE;
        if (k < 0 || k >= 1) {
          ripple.mesh.visible = false;
          continue;
        }
        ripple.mesh.visible = true;
        ripple.mesh.scale.setScalar(0.3 + k * 2.6);
        ripple.material.opacity = 0.55 * (1 - k);
      }
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      rimRocks.dispose();
      reeds.dispose();
    },
    // Consumed by the interaction layer: a click on the water lands here.
    waterMesh: water,
    spawnRipple(worldPoint: THREE.Vector3) {
      // Two staggered rings read as a proper "plop".
      const lx = worldPoint.x - x;
      const lz = worldPoint.z - z;
      startRipple(lx, lz, 0);
      startRipple(lx, lz, 0.22);
    },
  } as WorldModule & { waterMesh: THREE.Mesh; spawnRipple: (p: THREE.Vector3) => void };
}
