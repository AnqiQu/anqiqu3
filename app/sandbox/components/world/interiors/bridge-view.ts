import * as THREE from "three";
import { P, mat } from "../palette";
import { buildSky } from "../sky";
import { rng } from "../util";
import { makeAdd } from "./kit";
import type { Interior } from "./types";

// Standing on the unfinished bridge. Behind you, the island's cliff face with
// the door you came through; ahead, the deck runs out over open sky — planks
// thinning, the last ones askew, one dangling from a rope — and then nothing
// but horizon and the cloud sea far below. The walkable stretch ends where
// the sound planks do.

const DECK_Y = 0.12; // plank walking surface
const CLIFF_Z = 2.2; // where the cliff face stands

export function buildBridgeView(): Interior {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const add = makeAdd(group, geometries);

  // The full sky: dome gradient, sun, drifting clouds, and the cloud sea
  // below — same module the island uses, so the view out matches the world.
  const sky = buildSky();
  group.add(sky.group);

  // Cliff face behind the door: a broad rock wall with a mossy meadow lip,
  // dropping away below the deck so looking down reads as the island's edge.
  const cliffMat = mat(P.cliff, { flat: true });
  add(new THREE.BoxGeometry(14, 9, 2.4), cliffMat, 0, 1.5, CLIFF_Z + 1.3);
  add(new THREE.BoxGeometry(9, 7, 2), cliffMat, 0, -4.4, CLIFF_Z + 1.6);
  add(new THREE.BoxGeometry(4.5, 4.5, 1.8), cliffMat, 0, -8.2, CLIFF_Z + 1.9);
  const rand = rng(31);
  const boulderGeo = new THREE.IcosahedronGeometry(1, 0);
  geometries.push(boulderGeo);
  for (let i = 0; i < 10; i++) {
    const boulder = new THREE.Mesh(boulderGeo, mat(i % 3 ? P.cliff : P.rock, { flat: true }));
    boulder.position.set(-6 + rand() * 12, -2.5 + rand() * 7.5, CLIFF_Z + 0.15 - rand() * 0.3);
    boulder.scale.set(0.7 + rand() * 1.1, 0.5 + rand() * 0.9, 0.45 + rand() * 0.4);
    boulder.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    if (Math.abs(boulder.position.x) < 1.4 && boulder.position.y > -0.4 && boulder.position.y < 2.6) {
      boulder.position.x += boulder.position.x < 0 ? -1.6 : 1.6; // keep the doorway clear
    }
    group.add(boulder);
  }
  // Meadow lip along the top, with a few bushes leaning over the edge.
  add(new THREE.BoxGeometry(14, 0.9, 2.6), mat(P.meadow, { flat: true }), 0, 6.2, CLIFF_Z + 1.2);
  const bushGeo = new THREE.IcosahedronGeometry(0.5, 0);
  geometries.push(bushGeo);
  for (const [bx, bs] of [[-4.6, 1.2], [-1.8, 0.9], [0.9, 1.1], [3.4, 0.8], [5.6, 1.3]]) {
    const bush = new THREE.Mesh(bushGeo, mat(bs > 1 ? P.canopy : P.canopyLight, { flat: true }));
    bush.position.set(bx, 6.7, CLIFF_Z + 0.1);
    bush.scale.setScalar(bs);
    group.add(bush);
  }

  // The door in the rock — the way back.
  const doorMat = new THREE.MeshLambertMaterial({ color: P.woodDark, flatShading: true });
  const frameMat = new THREE.MeshLambertMaterial({ color: P.wood, flatShading: true });
  materials.push(doorMat, frameMat);
  const door = add(new THREE.BoxGeometry(1.15, 2.25, 0.14), doorMat, 0, DECK_Y + 1.12, CLIFF_Z + 0.05);
  const lintel = add(new THREE.BoxGeometry(1.6, 0.18, 0.24), frameMat, 0, DECK_Y + 2.33, CLIFF_Z + 0.02);
  const jambGeo = new THREE.BoxGeometry(0.16, 2.25, 0.24);
  geometries.push(jambGeo);
  const jambs = [-0.73, 0.73].map((x) => {
    const jamb = new THREE.Mesh(jambGeo, frameMat);
    jamb.position.set(x, DECK_Y + 1.12, CLIFF_Z + 0.02);
    group.add(jamb);
    return jamb;
  });
  add(new THREE.SphereGeometry(0.06, 8, 6), mat(P.brass), 0.42, DECK_Y + 1.05, CLIFF_Z - 0.05);

  // The deck, walk-scale: side beams, planks tightening near the island and
  // thinning toward the break, posts with sagging ropes, a lantern.
  for (const sx of [-1, 1]) {
    const beam = add(new THREE.BoxGeometry(0.22, 0.24, 11.5), mat(P.woodDark, { flat: true }), sx * 1.05, -0.06, CLIFF_Z - 5.4);
    beam.rotation.x = 0.012;
  }
  const plankGeo = new THREE.BoxGeometry(2.3, 0.09, 0.62);
  geometries.push(plankGeo);
  const planks = new THREE.InstancedMesh(plankGeo, mat(P.plank, { flat: true }), 13);
  const dummy = new THREE.Object3D();
  let pz = CLIFF_Z - 0.55;
  for (let i = 0; i < 13; i++) {
    pz -= 0.72 + Math.max(0, i - 7) * 0.12;
    dummy.position.set(0, DECK_Y - 0.04 + (CLIFF_Z - pz) * -0.004, pz);
    dummy.rotation.set(0, 0, 0);
    if (i === 11) dummy.rotation.set(0.12, 0.3, 0.1);
    if (i === 12) dummy.rotation.set(-0.08, -0.45, -0.16);
    dummy.updateMatrix();
    planks.setMatrixAt(i, dummy.matrix);
  }
  group.add(planks);

  // Posts at the island end and mid-deck; struts anchoring back to the cliff.
  const postGeo = new THREE.CylinderGeometry(0.09, 0.11, 1.25, 7);
  geometries.push(postGeo);
  for (const [postZ, h] of [[CLIFF_Z - 0.9, 0], [CLIFF_Z - 5.4, -0.02]]) {
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(postGeo, mat(P.woodDark, { flat: true }));
      post.position.set(sx * 1.05, DECK_Y + 0.55 + h, postZ);
      group.add(post);
    }
  }
  for (const sx of [-1, 1]) {
    const strut = add(new THREE.CylinderGeometry(0.08, 0.1, 3.6, 6), mat(P.woodDark), sx * 0.9, -1.4, CLIFF_Z - 1.3);
    strut.rotation.x = -0.7;
    strut.rotation.z = sx * 0.12;
  }

  // Sagging ropes running out along the deck, fraying past the last post.
  for (const sx of [-1, 1]) {
    const ropeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx * 1.05, DECK_Y + 1.16, CLIFF_Z - 0.9),
      new THREE.Vector3(sx * 1.08, DECK_Y + 0.88, CLIFF_Z - 3.1),
      new THREE.Vector3(sx * 1.05, DECK_Y + 1.1, CLIFF_Z - 5.4),
      new THREE.Vector3(sx * 1.02, DECK_Y + 0.62, CLIFF_Z - 7.6),
      new THREE.Vector3(sx * 0.98, DECK_Y + 0.78, CLIFF_Z - 9),
    ]);
    const ropeGeo = new THREE.TubeGeometry(ropeCurve, 24, 0.032, 5);
    geometries.push(ropeGeo);
    group.add(new THREE.Mesh(ropeGeo, mat(P.wood)));
  }

  // The dangling plank at the break, swaying.
  const dangleRope = add(new THREE.CylinderGeometry(0.026, 0.026, 1.1, 5), mat(P.wood), 0.55, DECK_Y - 0.6, CLIFF_Z - 11.2);
  dangleRope.rotation.z = 0.14;
  const dangler = add(new THREE.BoxGeometry(0.6, 0.08, 1.7), mat(P.plank, { flat: true }), 0.62, DECK_Y - 1.2, CLIFF_Z - 11.15);
  dangler.rotation.set(0.4, 0.3, 1.2);

  // Lantern on the near post.
  add(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: P.lanternGlow }), -1.05, DECK_Y + 1.32, CLIFF_Z - 0.9);

  // Same key/rim lighting recipe as the island, so the vista matches.
  const hemi = new THREE.HemisphereLight(0xbfe8ff, 0xd9c39a, 0.95);
  const sunLight = new THREE.DirectionalLight(0xfff0c0, 1.5);
  sunLight.position.set(30, 60, 40);
  const sunRim = new THREE.DirectionalLight(0xffd79c, 0.55);
  sunRim.position.set(-95, 29, -262);
  group.add(hemi, sunLight, sunRim);

  return {
    group,
    // A narrow walk: the deck's width, from the door to just shy of the askew
    // planks. Invisible walls, not railings — the ropes read as the barrier.
    bounds: { kind: "rect", minX: -0.85, maxX: 0.85, minZ: CLIFF_Z - 8.6, maxZ: CLIFF_Z - 0.35 },
    colliders: [],
    floorY: DECK_Y,
    spawn: { x: 0, z: CLIFF_Z - 1.3, yaw: 0 },
    doorMeshes: [door, lintel, ...jambs],
    doorGlow: [doorMat, frameMat],
    background: P.skyTop,
    fog: { color: P.fog, near: 60, far: 260 },
    far: 700,
    update(t, dt) {
      sky.update?.(t, dt);
      dangler.rotation.x = 0.4 + Math.sin(t * 0.9) * 0.14;
      dangleRope.rotation.x = Math.sin(t * 0.9) * 0.09;
    },
    dispose() {
      sky.dispose();
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      planks.dispose();
    },
  };
}
