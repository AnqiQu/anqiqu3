import * as THREE from "three";
import { P, mat } from "../palette";
import { buildSky } from "../sky";
import { rng } from "../util";
import { makeAdd } from "./kit";
import { addHill, addTree } from "./scenery";
import type { Interior } from "./types";

// Standing on the unfinished bridge. Ahead, the deck runs out over open sky —
// planks thinning, the last ones askew, one dangling from a rope — then nothing
// but horizon and the cloud sea far below. Behind you lies the island you came
// from: its grassy rim, trees, and a hill in the distance. There is no door —
// an open gateway frames the way back, and clicking toward the land steps you
// out onto it.

const DECK_Y = 0.12; // plank walking surface
const LAND_Z = 2.2; // where the island's edge meets the bridge
const LAND_Y = 0.35; // meadow surface just above the deck

export function buildBridgeView(): Interior {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const add = makeAdd(group, geometries);

  // The full sky: dome gradient, sun, drifting clouds, and the cloud sea below
  // — the same module the island uses, so the view out matches the world.
  const sky = buildSky();
  group.add(sky.group);

  // ===== The island behind you =====
  // Grassy top the bridge launches from, stretching back and away.
  add(new THREE.BoxGeometry(60, 0.6, 44), mat(P.meadow, { flat: true }), 0, LAND_Y - 0.3, LAND_Z + 22);
  // Earth cliff under the rim, so the near edge reads as the island floating.
  const earthMat = mat(P.earth, { flat: true, emissive: 0x33261a });
  add(new THREE.BoxGeometry(34, 10, 12), earthMat, 0, -4.7, LAND_Z + 4);
  add(new THREE.BoxGeometry(22, 9, 9), earthMat, 0, -8.5, LAND_Z + 6);
  add(new THREE.BoxGeometry(12, 7, 6), earthMat, -3, -12, LAND_Z + 7);

  const rand = rng(31);
  const rockGeo = new THREE.DodecahedronGeometry(1.3, 0);
  geometries.push(rockGeo);
  for (let i = 0; i < 9; i++) {
    const rock = new THREE.Mesh(rockGeo, mat(i % 3 ? P.rock : P.cliff, { flat: true }));
    rock.position.set(-9 + rand() * 18, -1.5 - rand() * 5, LAND_Z + 1.5 + rand() * 6);
    rock.scale.setScalar(0.6 + rand() * 1.2);
    rock.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    group.add(rock);
  }

  // Grassy rim lip along the near edge, with bushes spilling over it.
  add(new THREE.BoxGeometry(60, 0.5, 1.4), mat(P.moss, { flat: true }), 0, LAND_Y - 0.05, LAND_Z + 0.1);
  const bushGeo = new THREE.IcosahedronGeometry(0.5, 0);
  geometries.push(bushGeo);
  for (const [bx, bs] of [[-5.6, 1.2], [-3.4, 0.9], [-1.6, 1.0], [1.7, 1.1], [3.5, 0.85], [5.8, 1.3]]) {
    if (Math.abs(bx) < 1.3) continue; // keep the gateway mouth clear
    const bush = new THREE.Mesh(bushGeo, mat(bs > 1 ? P.canopy : P.canopyLight, { flat: true }));
    bush.position.set(bx, LAND_Y + 0.25, LAND_Z + 0.15);
    bush.scale.setScalar(bs);
    group.add(bush);
  }

  // Trees across the meadow, and a hill in the distance wearing the observatory
  // dome — the landmarks you left, seen from out here.
  const treeSpots: Array<[number, number, number]> = [
    [-4, LAND_Z + 4, 1.2], [5, LAND_Z + 3.5, 1.1], [-8, LAND_Z + 7, 1.3], [9, LAND_Z + 6, 1.2],
    [-2, LAND_Z + 11, 1.4], [7, LAND_Z + 13, 1.3], [-12, LAND_Z + 10, 1.3], [13, LAND_Z + 9, 1.4],
    [3, LAND_Z + 18, 1.5], [-15, LAND_Z + 17, 1.4], [16, LAND_Z + 16, 1.5], [-6, LAND_Z + 24, 1.6],
  ];
  treeSpots.forEach(([tx, tz, ts], i) => addTree(group, geometries, tx, LAND_Y - 0.05, tz, ts, 200 + i));
  addHill(group, geometries, -16, LAND_Y - 0.2, LAND_Z + 30, 13, 7, P.meadowDark);
  add(new THREE.CylinderGeometry(2.4, 2.7, 1.5, 14), mat(P.stonePale, { flat: true }), -16, LAND_Y + 6.3, LAND_Z + 30);
  add(new THREE.SphereGeometry(2.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(P.glassTeal, { transparent: true, opacity: 0.5 }), -16, LAND_Y + 7.0, LAND_Z + 30);

  // The gateway — the open way back. Wood posts and a lintel framing the rim,
  // with a private-material glow while it's hovered; an invisible plane across
  // the mouth is the click target.
  const gateMat = new THREE.MeshLambertMaterial({ color: P.woodDark, flatShading: true });
  materials.push(gateMat);
  const gatePostGeo = new THREE.BoxGeometry(0.22, 2.5, 0.22);
  geometries.push(gatePostGeo);
  const gatePosts = [-1.05, 1.05].map((x) => {
    const post = new THREE.Mesh(gatePostGeo, gateMat);
    post.position.set(x, LAND_Y + 1.25, LAND_Z + 0.1);
    group.add(post);
    return post;
  });
  const lintel = add(new THREE.BoxGeometry(2.6, 0.26, 0.28), gateMat, 0, LAND_Y + 2.55, LAND_Z + 0.1);
  add(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: P.lanternGlow }), 1.05, LAND_Y + 2.2, LAND_Z + 0.28);
  const exitMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
  materials.push(exitMat);
  const exitPlane = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.4), exitMat);
  geometries.push(exitPlane.geometry);
  exitPlane.position.set(0, LAND_Y + 1.5, LAND_Z + 0.2);
  group.add(exitPlane);

  // ===== The deck, walk-scale =====
  for (const sx of [-1, 1]) {
    const beam = add(new THREE.BoxGeometry(0.22, 0.24, 11.5), mat(P.woodDark, { flat: true }), sx * 1.05, -0.06, LAND_Z - 5.4);
    beam.rotation.x = 0.012;
  }
  const plankGeo = new THREE.BoxGeometry(2.3, 0.09, 0.62);
  geometries.push(plankGeo);
  const planks = new THREE.InstancedMesh(plankGeo, mat(P.plank, { flat: true }), 13);
  const dummy = new THREE.Object3D();
  let pz = LAND_Z - 0.55;
  for (let i = 0; i < 13; i++) {
    pz -= 0.72 + Math.max(0, i - 7) * 0.12;
    dummy.position.set(0, DECK_Y - 0.04 + (LAND_Z - pz) * -0.004, pz);
    dummy.rotation.set(0, 0, 0);
    if (i === 11) dummy.rotation.set(0.12, 0.3, 0.1);
    if (i === 12) dummy.rotation.set(-0.08, -0.45, -0.16);
    dummy.updateMatrix();
    planks.setMatrixAt(i, dummy.matrix);
  }
  group.add(planks);

  const postGeo = new THREE.CylinderGeometry(0.09, 0.11, 1.25, 7);
  geometries.push(postGeo);
  for (const [postZ, h] of [[LAND_Z - 0.9, 0], [LAND_Z - 5.4, -0.02]]) {
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(postGeo, mat(P.woodDark, { flat: true }));
      post.position.set(sx * 1.05, DECK_Y + 0.55 + h, postZ);
      group.add(post);
    }
  }
  for (const sx of [-1, 1]) {
    const strut = add(new THREE.CylinderGeometry(0.08, 0.1, 3.6, 6), mat(P.woodDark), sx * 0.9, -1.4, LAND_Z - 1.3);
    strut.rotation.x = -0.7;
    strut.rotation.z = sx * 0.12;
  }

  // Sagging ropes running out along the deck, fraying past the last post.
  for (const sx of [-1, 1]) {
    const ropeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx * 1.05, DECK_Y + 1.16, LAND_Z - 0.9),
      new THREE.Vector3(sx * 1.08, DECK_Y + 0.88, LAND_Z - 3.1),
      new THREE.Vector3(sx * 1.05, DECK_Y + 1.1, LAND_Z - 5.4),
      new THREE.Vector3(sx * 1.02, DECK_Y + 0.62, LAND_Z - 7.6),
      new THREE.Vector3(sx * 0.98, DECK_Y + 0.78, LAND_Z - 9),
    ]);
    const ropeGeo = new THREE.TubeGeometry(ropeCurve, 24, 0.032, 5);
    geometries.push(ropeGeo);
    group.add(new THREE.Mesh(ropeGeo, mat(P.wood)));
  }

  // The dangling plank at the break, swaying.
  const dangleRope = add(new THREE.CylinderGeometry(0.026, 0.026, 1.1, 5), mat(P.wood), 0.55, DECK_Y - 0.6, LAND_Z - 11.2);
  dangleRope.rotation.z = 0.14;
  const dangler = add(new THREE.BoxGeometry(0.6, 0.08, 1.7), mat(P.plank, { flat: true }), 0.62, DECK_Y - 1.2, LAND_Z - 11.15);
  dangler.rotation.set(0.4, 0.3, 1.2);

  // Lantern on the near post.
  add(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: P.lanternGlow }), -1.05, DECK_Y + 1.32, LAND_Z - 0.9);

  // Same key/rim lighting recipe as the island, so the vista matches.
  const hemi = new THREE.HemisphereLight(0xbfe8ff, 0xd9c39a, 0.95);
  const sunLight = new THREE.DirectionalLight(0xfff0c0, 1.5);
  sunLight.position.set(30, 60, 40);
  const sunRim = new THREE.DirectionalLight(0xffd79c, 0.55);
  sunRim.position.set(-95, 29, -262);
  group.add(hemi, sunLight, sunRim);

  return {
    group,
    // A narrow walk: the deck's width, from the island rim to just shy of the
    // askew planks. Invisible walls, not railings — the ropes read as the edge.
    bounds: { kind: "rect", minX: -0.85, maxX: 0.85, minZ: LAND_Z - 8.6, maxZ: LAND_Z - 0.35 },
    colliders: [],
    floorY: DECK_Y,
    spawn: { x: 0, z: LAND_Z - 1.3, yaw: 0 },
    doorMeshes: [exitPlane, ...gatePosts, lintel],
    doorGlow: [gateMat],
    background: P.skyTop,
    fog: { color: P.fog, near: 70, far: 300 },
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
