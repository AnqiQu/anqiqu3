import * as THREE from "three";
import { P } from "./palette";
import type { WorldModule } from "./types";
import { rng } from "./util";

// Sky dome, sun, and two cloud layers: drifting puff clusters overhead and a
// cloud sea below the island so it reads as floating.
export function buildSky(): WorldModule {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // Dome: vertex-colored gradient, zenith → horizon. Fog must not apply or the
  // whole dome would flatten to the fog color.
  const domeGeo = new THREE.SphereGeometry(300, 24, 12);
  const top = new THREE.Color(P.skyTop);
  const horizon = new THREE.Color(P.skyHorizon);
  const domeColors: number[] = [];
  const pos = domeGeo.attributes.position;
  const scratch = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    // y ranges -300..300; blend on height so below-horizon stays bright too
    // (the camera looks down past the island at a cloud sea).
    const h = THREE.MathUtils.clamp(pos.getY(i) / 300, -1, 1);
    scratch.copy(horizon).lerp(top, THREE.MathUtils.smoothstep(h, -0.05, 0.6));
    domeColors.push(scratch.r, scratch.g, scratch.b);
  }
  domeGeo.setAttribute("color", new THREE.Float32BufferAttribute(domeColors, 3));
  const domeMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false });
  group.add(new THREE.Mesh(domeGeo, domeMat));
  geometries.push(domeGeo);
  materials.push(domeMat);

  // Sun high in the back-left sky (visible in the opening vista) with a soft
  // halo. Lighting direction is a painterly cheat and does not match — see
  // engine.ts.
  const sunPos = new THREE.Vector3(-120, 150, -200);
  const sunGeo = new THREE.CircleGeometry(9, 24);
  const haloGeo = new THREE.CircleGeometry(16, 24);
  const sunMat = new THREE.MeshBasicMaterial({ color: P.sun, fog: false });
  const haloMat = new THREE.MeshBasicMaterial({ color: P.sun, fog: false, transparent: true, opacity: 0.35, depthWrite: false });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  const halo = new THREE.Mesh(haloGeo, haloMat);
  sun.position.copy(sunPos);
  halo.position.copy(sunPos).add(new THREE.Vector3(0, 0, -1));
  // Face the midpoint of the camera rail; close enough for a static billboard.
  sun.lookAt(0, 15, 60);
  halo.lookAt(0, 15, 60);
  group.add(halo, sun);
  geometries.push(sunGeo, haloGeo);
  materials.push(sunMat, haloMat);

  // Cloud puffs: one InstancedMesh, cluster offsets baked into the matrices.
  // Lambert + a warm emissive floor keeps them cream and softly shaded rather
  // than gray on the unlit side.
  const puffGeo = new THREE.SphereGeometry(1, 10, 8);
  const puffMat = new THREE.MeshLambertMaterial({ color: P.cloud });
  // High emissive floor: clouds should stay cream even on unlit faces.
  puffMat.emissive.setHex(0x9d9587);
  geometries.push(puffGeo);
  materials.push(puffMat);

  const rand = rng(20260728);
  const matrices: THREE.Matrix4[] = [];
  const dummy = new THREE.Object3D();

  const addCluster = (cx: number, cy: number, cz: number, scale: number, puffs: number) => {
    for (let i = 0; i < puffs; i++) {
      const spread = scale * 1.6;
      dummy.position.set(
        cx + (rand() - 0.5) * spread * 2.2,
        cy + (rand() - 0.5) * spread * 0.55,
        cz + (rand() - 0.5) * spread,
      );
      const s = scale * (0.55 + rand() * 0.75);
      dummy.scale.set(s * (1.1 + rand() * 0.5), s * 0.62, s);
      dummy.rotation.y = rand() * Math.PI;
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    }
  };

  // Overhead / mid-height clusters around (not over) the island.
  const upperClusters: Array<[number, number, number, number]> = [
    [-70, 26, -60, 4.2], [65, 32, -85, 5], [30, 22, -130, 6], [-110, 18, -30, 5],
    [95, 24, 20, 4.4], [-55, 34, 60, 4], [55, 16, 75, 3.6], [-30, 40, -110, 5.5],
  ];
  for (const [x, y, z, s] of upperClusters) addCluster(x, y, z, s, 4);

  // Cloud sea: a broad ring of larger puffs well below and away from the rim,
  // so the island reads as floating high instead of beached on cloud banks.
  for (let i = 0; i < 22; i++) {
    const angle = (i / 22) * Math.PI * 2;
    const radius = 50 + rand() * 45;
    addCluster(Math.cos(angle) * radius, -22 - rand() * 9, Math.sin(angle) * radius * 0.85, 7 + rand() * 4, 3);
  }

  const puffs = new THREE.InstancedMesh(puffGeo, puffMat, matrices.length);
  matrices.forEach((m, i) => puffs.setMatrixAt(i, m));
  puffs.instanceMatrix.needsUpdate = true;
  puffs.renderOrder = 0;
  group.add(puffs);

  return {
    group,
    update(t) {
      // Whole-layer drift: rotating the instanced mesh costs nothing per puff.
      puffs.rotation.y = t * 0.004;
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      puffs.dispose();
    },
  };
}
