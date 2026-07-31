import * as THREE from "three";
import { P, mat } from "../palette";
import { terrainHeight } from "../terrain";
import type { WorldModule } from "../types";

// The Unfinished Bridge: launches off the island rim and stops mid-air —
// planks thin out, the last ones sit askew, and one dangles from a rope.
// Ideas in progress.
export function buildBridge(x: number, z: number, rotationY: number): WorldModule {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const y = terrainHeight(x, z);
  group.position.set(x, y + 0.3, z);
  group.rotation.y = rotationY;

  const add = (geo: THREE.BufferGeometry, material: THREE.Material, px: number, py: number, pz: number) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(px, py, pz);
    group.add(mesh);
    geometries.push(geo);
    return mesh;
  };

  const LEN = 7.5; // deck length along local +x, tip hangs over the void

  // Side beams, dipping slightly toward the unfinished end.
  for (const sz of [-1, 1]) {
    const beam = add(new THREE.BoxGeometry(LEN, 0.2, 0.18), mat(P.woodDark, { flat: true }), LEN / 2 - 1, 0, sz * 0.75);
    beam.rotation.z = -0.04;
  }

  // Planks: full and tight near the island, gaps growing outward, the last
  // two knocked askew.
  const plankGeo = new THREE.BoxGeometry(0.52, 0.07, 1.5);
  geometries.push(plankGeo);
  const planks = new THREE.InstancedMesh(plankGeo, mat(P.plank, { flat: true }), 9);
  const dummy = new THREE.Object3D();
  let px = -0.6;
  for (let i = 0; i < 9; i++) {
    px += 0.62 + Math.max(0, i - 4) * 0.16;
    dummy.position.set(px, 0.12 - px * 0.04, 0);
    dummy.rotation.set(0, 0, 0);
    if (i === 7) dummy.rotation.set(0.1, 0.35, 0.12);
    if (i === 8) dummy.rotation.set(-0.06, -0.5, -0.18);
    dummy.updateMatrix();
    planks.setMatrixAt(i, dummy.matrix);
  }
  group.add(planks);

  // Posts at the island end + mid-deck.
  for (const [postX, postZ] of [
    [-0.4, -0.75], [-0.4, 0.75], [3.2, -0.75], [3.2, 0.75],
  ] as Array<[number, number]>) {
    add(new THREE.CylinderGeometry(0.09, 0.11, 1.1, 7), mat(P.woodDark, { flat: true }), postX, 0.55, postZ);
  }

  // Sagging ropes between post tops, continuing past the last post to fray
  // into the air.
  for (const sz of [-1, 1]) {
    const ropeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, 1.05, sz * 0.75),
      new THREE.Vector3(1.4, 0.82, sz * 0.78),
      new THREE.Vector3(3.2, 0.98, sz * 0.75),
      new THREE.Vector3(4.8, 0.55, sz * 0.72),
      new THREE.Vector3(5.9, 0.72, sz * 0.7),
    ]);
    const ropeGeo = new THREE.TubeGeometry(ropeCurve, 20, 0.03, 5);
    const rope = new THREE.Mesh(ropeGeo, mat(P.wood));
    group.add(rope);
    geometries.push(ropeGeo);
  }

  // The loose plank, dangling from the beam end on a short rope.
  const dangleRope = add(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 5), mat(P.wood), LEN - 1.15, -0.5, 0.5);
  dangleRope.rotation.z = 0.15;
  const dangler = add(new THREE.BoxGeometry(0.5, 0.07, 1.4), mat(P.plank, { flat: true }), LEN - 1.05, -1, 0.55);
  dangler.rotation.set(0.4, 0.3, 1.25);

  // A lantern on the near post pair, like the painting's bridge lamp.
  add(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: P.lanternGlow }), -0.4, 1.22, 0.75);

  return {
    group,
    update(t) {
      // The dangling plank sways gently.
      dangler.rotation.x = 0.4 + Math.sin(t * 0.9) * 0.12;
      dangleRope.rotation.x = Math.sin(t * 0.9) * 0.08;
    },
    dispose() {
      for (const g of geometries) g.dispose();
      planks.dispose();
    },
  };
}
