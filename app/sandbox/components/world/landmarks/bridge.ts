import * as THREE from "three";
import { P, mat } from "../palette";
import { terrainHeight } from "../terrain";
import type { Perch, WorldModule } from "../types";

export type Bridge = WorldModule & { perch: Perch };

// The Bridge Under Construction: launches off the island rim, decked partway,
// then the bare frame carries on over the void — beams and cross-joists laid
// out and waiting, a stack of fresh planks staged on the deck, and the next
// plank swinging up on a rope hoist. A work in progress.
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

  const LEN = 7.5; // deck length along local +x; the tip runs out over the void

  // Side beams, running the full length — bare and level past the decking, the
  // structure the crew is planking outward from.
  for (const sz of [-1, 1]) {
    add(new THREE.BoxGeometry(LEN, 0.2, 0.18), mat(P.woodDark, { flat: true }), LEN / 2 - 1, 0, sz * 0.75);
  }

  // Cross-joists spanning the beams in the undecked stretch: the frame is laid
  // and ready, just waiting for its planks.
  const joistGeo = new THREE.BoxGeometry(0.14, 0.09, 1.62);
  geometries.push(joistGeo);
  for (const jx of [4.2, 4.8, 5.4, 6.0]) {
    add(joistGeo, mat(P.woodDark, { flat: true }), jx, 0.14, 0);
  }

  // Planks, laid neatly from the island end and stopping clean where the work
  // has reached — no gaps, no askew boards.
  const plankGeo = new THREE.BoxGeometry(0.52, 0.07, 1.5);
  geometries.push(plankGeo);
  const NUM_LAID = 7;
  const planks = new THREE.InstancedMesh(plankGeo, mat(P.plank, { flat: true }), NUM_LAID);
  const dummy = new THREE.Object3D();
  // Plank the cat naps on: a laid board near the island, well back from the
  // working end. Read off the loop so retuning the spacing can't leave it
  // hovering.
  const PERCH_PLANK = 1;
  const perchPoint = new THREE.Vector3();
  let px = -0.5;
  for (let i = 0; i < NUM_LAID; i++) {
    px += 0.6;
    dummy.position.set(px, 0.13 - px * 0.02, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    planks.setMatrixAt(i, dummy.matrix);
    if (i === PERCH_PLANK) perchPoint.set(px, dummy.position.y + 0.035, 0);
  }
  group.add(planks);
  // Facing out along the deck: the model's forward is +z, the deck runs +x.
  const perch: Perch = { position: group.localToWorld(perchPoint), yaw: rotationY + Math.PI / 2 };

  // A stack of fresh planks staged on the solid deck, ready to be carried out.
  const stackGeo = new THREE.BoxGeometry(0.5, 0.06, 1.2);
  geometries.push(stackGeo);
  for (let i = 0; i < 3; i++) {
    const board = add(stackGeo, mat(P.plank, { flat: true }), 3.3, 0.19 + i * 0.07, 0);
    board.rotation.y = (i - 1) * 0.05;
  }

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

  // Guide ropes between the post tops, carried on to the hoist pole — strung as
  // the deck advances, not frayed loose.
  for (const sz of [-1, 1]) {
    const ropeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, 1.05, sz * 0.75),
      new THREE.Vector3(1.4, 0.82, sz * 0.78),
      new THREE.Vector3(3.2, 0.98, sz * 0.75),
      new THREE.Vector3(4.8, 0.86, sz * 0.6),
      new THREE.Vector3(5.9, 0.92, sz * 0.45),
    ]);
    const ropeGeo = new THREE.TubeGeometry(ropeCurve, 20, 0.03, 5);
    const rope = new THREE.Mesh(ropeGeo, mat(P.wood));
    group.add(rope);
    geometries.push(ropeGeo);
  }

  // The hoist: a leaning gin pole at the working end with a fresh plank swinging
  // up on its line, on its way to being fixed onto the frame.
  const pole = add(new THREE.CylinderGeometry(0.06, 0.07, 1.9, 6), mat(P.woodDark, { flat: true }), 5.9, 0.85, 0.42);
  pole.rotation.z = 0.55;
  const hoistLine = add(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 5), mat(P.wood), 5.25, 1.02, 0);
  const hoistPlank = add(new THREE.BoxGeometry(0.52, 0.07, 1.4), mat(P.plank, { flat: true }), 5.2, 0.55, 0);

  // A lantern on the near post pair, like the painting's bridge lamp.
  add(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: P.lanternGlow }), -0.4, 1.22, 0.75);

  return {
    group,
    perch,
    update(t) {
      // The hoisted plank sways gently on its line as it swings up.
      const swing = Math.sin(t * 0.9) * 0.12;
      hoistPlank.rotation.z = swing;
      hoistPlank.rotation.x = Math.sin(t * 0.7) * 0.06;
      hoistLine.rotation.z = swing * 0.6;
    },
    dispose() {
      for (const g of geometries) g.dispose();
      planks.dispose();
    },
  };
}
