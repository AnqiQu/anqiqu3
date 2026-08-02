import * as THREE from "three";
import { P, mat } from "../palette";
import { terrainHeight } from "../terrain";
import type { Perch, WorldModule } from "../types";

export type Bridge = WorldModule & { perch: Perch };

// The Unfinished Bridge: launches off the island rim and stops mid-air —
// planks thin out, the last ones sit askew, and one dangles from a rope.
// Ideas in progress.
export function buildBridge(x: number, z: number, rotationY: number): Bridge {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];

  // Local → world for terrain sampling under the rotated deck.
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  const groundAt = (lx: number, lz: number) =>
    terrainHeight(x + lx * cos + lz * sin, z - lx * sin + lz * cos);

  // The deck must clear the terrain along its whole on-island span — the rim
  // lip rises under the middle of the bridge, so one end-sample isn't enough.
  let deckY = -Infinity;
  for (const lx of [-1.2, 0, 1, 2, 3, 4]) {
    deckY = Math.max(deckY, groundAt(lx, 0));
  }
  deckY += 0.4;
  group.position.set(x, deckY, z);
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
  // Plank the cat naps on: far enough out to be over the drop, well short of
  // the askew ones. Read off the loop rather than hard-coded, so retuning the
  // plank spacing can't leave the cat hovering.
  const PERCH_PLANK = 2;
  const perchPoint = new THREE.Vector3();
  let px = -0.6;
  for (let i = 0; i < 9; i++) {
    px += 0.62 + Math.max(0, i - 4) * 0.16;
    dummy.position.set(px, 0.12 - px * 0.04, 0);
    dummy.rotation.set(0, 0, 0);
    if (i === 7) dummy.rotation.set(0.1, 0.35, 0.12);
    if (i === 8) dummy.rotation.set(-0.06, -0.5, -0.18);
    dummy.updateMatrix();
    planks.setMatrixAt(i, dummy.matrix);
    if (i === PERCH_PLANK) perchPoint.set(px, dummy.position.y + 0.035, 0);
  }
  group.add(planks);
  // Facing out along the deck: the model's forward is +z, the deck runs +x.
  const perch: Perch = { position: group.localToWorld(perchPoint), yaw: rotationY + Math.PI / 2 };

  // Posts at the island end + mid-deck, each stretched down to the actual
  // ground beneath it so nothing floats.
  for (const [postX, postZ] of [
    [-0.4, -0.75], [-0.4, 0.75], [3.2, -0.75], [3.2, 0.75],
  ] as Array<[number, number]>) {
    const groundLocal = groundAt(postX, postZ) - deckY; // negative: below deck
    const top = 1.05;
    const bottom = groundLocal - 0.15;
    add(
      new THREE.CylinderGeometry(0.09, 0.11, top - bottom, 7),
      mat(P.woodDark, { flat: true }),
      postX, (top + bottom) / 2, postZ,
    );
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
    perch,
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
