import * as THREE from "three";
import { P, mat } from "../palette";
import { buildSky } from "../sky";
import { rng } from "../util";
import { makeAdd, makeBeaconOrb } from "./kit";
import { addHill, addTree } from "./scenery";
import type { Interior } from "./types";

// Standing on the bridge under construction. The decking ends clean a few steps
// out; ahead the bare frame — beams and cross-joists — runs on over open sky,
// with fresh planks stacked on the frame, a sawhorse, and the next board
// swinging up on a rope hoist, then nothing but horizon and the cloud sea far
// below. Behind you lies the island you came from: its grassy rim, trees, and a
// hill in the distance. There is no door — an open gateway frames the way back,
// and clicking toward the land steps you out onto it.

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

  // Trees across the meadow and a low hill in the distance — the green land you
  // came from, seen from out here.
  const treeSpots: Array<[number, number, number]> = [
    [-4, LAND_Z + 4, 1.2], [5, LAND_Z + 3.5, 1.1], [-8, LAND_Z + 7, 1.3], [9, LAND_Z + 6, 1.2],
    [-2, LAND_Z + 11, 1.4], [7, LAND_Z + 13, 1.3], [-12, LAND_Z + 10, 1.3], [13, LAND_Z + 9, 1.4],
    [3, LAND_Z + 18, 1.5], [-15, LAND_Z + 17, 1.4], [16, LAND_Z + 16, 1.5], [-6, LAND_Z + 24, 1.6],
  ];
  treeSpots.forEach(([tx, tz, ts], i) => addTree(group, geometries, tx, LAND_Y - 0.05, tz, ts, 200 + i));
  addHill(group, geometries, -16, LAND_Y - 0.2, LAND_Z + 30, 13, 7, P.meadowDark);

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
  // Individual boards: each narrower than its spacing so a seam shows between
  // it and the next, and each tinted a slightly different tone with a hair of
  // height jitter so the deck reads as separate planks, not one slab.
  const PLANK_STEP = 0.62;
  const plankGeo = new THREE.BoxGeometry(2.3, 0.09, 0.52);
  geometries.push(plankGeo);
  const NUM_LAID = 11;
  const plankTones = [P.plank, 0xbf8455, 0xd49a67, 0xc0895a];
  const planks = new THREE.InstancedMesh(plankGeo, mat(0xffffff, { flat: true }), NUM_LAID);
  const dummy = new THREE.Object3D();
  const plankColor = new THREE.Color();
  const plankRand = rng(57);
  const DECK_FIRST = LAND_Z - 0.55 - PLANK_STEP; // z of the first laid plank
  let pz = LAND_Z - 0.55;
  for (let i = 0; i < NUM_LAID; i++) {
    pz -= PLANK_STEP;
    dummy.position.set(0, DECK_Y - 0.04 + (LAND_Z - pz) * -0.004 + (plankRand() - 0.5) * 0.012, pz);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    planks.setMatrixAt(i, dummy.matrix);
    planks.setColorAt(i, plankColor.setHex(plankTones[Math.floor(plankRand() * plankTones.length)]));
  }
  const DECK_END = pz; // z of the last laid plank — the working edge
  group.add(planks);

  // Dark sub-deck under the boards, so the seams between planks read as shadow
  // lines rather than gaps onto the void far below.
  add(
    new THREE.BoxGeometry(2.06, 0.08, DECK_FIRST - DECK_END + 0.52),
    mat(P.floorWoodDark, { flat: true }),
    0, DECK_Y - 0.12, (DECK_FIRST + DECK_END) / 2,
  );

  // Cross-joists spanning the beams beyond the decking: the frame laid out and
  // waiting for its planks.
  const joistGeo = new THREE.BoxGeometry(2.3, 0.09, 0.16);
  geometries.push(joistGeo);
  for (const jz of [DECK_END - 0.75, DECK_END - 1.45, DECK_END - 2.15, DECK_END - 2.85, DECK_END - 3.55]) {
    add(joistGeo, mat(P.woodDark, { flat: true }), 0, 0.05, jz);
  }

  // Fresh planks stacked on the frame just past the working edge, ready to lay.
  const stackGeo = new THREE.BoxGeometry(2.0, 0.09, 0.55);
  geometries.push(stackGeo);
  for (let i = 0; i < 4; i++) {
    const board = add(stackGeo, mat(P.plank, { flat: true }), 0, 0.14 + i * 0.1, DECK_END - 1.1);
    board.rotation.y = (i - 1.5) * 0.04;
  }

  // A sawhorse straddling the frame, a plank resting across it mid-work.
  add(new THREE.BoxGeometry(0.16, 0.12, 1.5), mat(P.woodDark, { flat: true }), 0, DECK_Y + 0.5, DECK_END - 2.5);
  for (const [lx, lz] of [[-0.06, 0.55], [0.06, 0.55], [-0.06, -0.55], [0.06, -0.55]] as Array<[number, number]>) {
    const leg = add(new THREE.CylinderGeometry(0.03, 0.035, 0.62, 5), mat(P.woodDark), lx, DECK_Y + 0.25, DECK_END - 2.5 + lz);
    leg.rotation.x = lz > 0 ? 0.28 : -0.28;
    leg.rotation.z = lx > 0 ? -0.12 : 0.12;
  }
  const sawPlank = add(new THREE.BoxGeometry(2.1, 0.08, 0.5), mat(P.plank, { flat: true }), 0.15, DECK_Y + 0.6, DECK_END - 2.5);
  sawPlank.rotation.y = 0.05;

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

  // Guide ropes strung out along the deck, carried on to the hoist pole as the
  // work advances.
  for (const sx of [-1, 1]) {
    const ropeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx * 1.05, DECK_Y + 1.16, LAND_Z - 0.9),
      new THREE.Vector3(sx * 1.08, DECK_Y + 0.88, LAND_Z - 3.1),
      new THREE.Vector3(sx * 1.05, DECK_Y + 1.0, LAND_Z - 5.4),
      new THREE.Vector3(sx * 0.9, DECK_Y + 0.92, DECK_END - 2.0),
      new THREE.Vector3(sx * 0.5, DECK_Y + 1.2, DECK_END - 3.4),
    ]);
    const ropeGeo = new THREE.TubeGeometry(ropeCurve, 24, 0.032, 5);
    geometries.push(ropeGeo);
    group.add(new THREE.Mesh(ropeGeo, mat(P.wood)));
  }

  // The hoist: a leaning gin pole at the far frame end with the next plank
  // swinging up on its line, on its way to being fixed across the frame.
  const hoistPole = add(new THREE.CylinderGeometry(0.08, 0.09, 3.4, 6), mat(P.woodDark, { flat: true }), 0.7, DECK_Y + 1.0, DECK_END - 3.0);
  hoistPole.rotation.x = 0.45;
  const hoistLine = add(new THREE.CylinderGeometry(0.026, 0.026, 2.2, 5), mat(P.wood), 0.35, DECK_Y + 1.0, DECK_END - 2.1);
  hoistLine.rotation.z = 0.1;
  const hoistPlank = add(new THREE.BoxGeometry(2.1, 0.09, 0.6), mat(P.plank, { flat: true }), 0, DECK_Y - 0.2, DECK_END - 2.1);
  hoistPlank.rotation.z = 0.06;

  // Lantern on the near post.
  add(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: P.lanternGlow }), -1.05, DECK_Y + 1.32, LAND_Z - 0.9);

  // Same key/rim lighting recipe as the island, so the vista matches.
  const hemi = new THREE.HemisphereLight(0xbfe8ff, 0xd9c39a, 0.95);
  const sunLight = new THREE.DirectionalLight(0xfff0c0, 1.5);
  sunLight.position.set(30, 60, 40);
  const sunRim = new THREE.DirectionalLight(0xffd79c, 0.55);
  sunRim.position.set(-95, 29, -262);
  group.add(hemi, sunLight, sunRim);

  // A bright-green "My writing" beacon hovering right at the construction
  // frontier, just above the stack of fresh planks waiting to be laid
  // (DECK_END - 1.1) — the next thing being built, floating over where the deck
  // is actively growing rather than far out over the empty void. Clicking it
  // opens the writing section.
  const writing = makeBeaconOrb({
    x: 0, y: DECK_Y + 1.45, z: DECK_END - 1.0,
    title: "My writing",
    faceColor: "#12a046",
    textColor: "#f0fff5",
    glowColor: 0x4ade80,
    glowOpacity: 0.2,
    lightIntensity: 2.2,
  });
  group.add(writing.group);

  return {
    group,
    // A narrow walk: the deck's width, from the island rim out to the working
    // edge where the decking ends. Invisible walls, not railings — the ropes
    // read as the edge, and you stop where the planks do.
    bounds: { kind: "rect", minX: -0.85, maxX: 0.85, minZ: DECK_END - 0.1, maxZ: LAND_Z - 0.35 },
    colliders: [],
    floorY: DECK_Y,
    spawn: { x: 0, z: LAND_Z - 1.3, yaw: 0 },
    doorMeshes: [exitPlane, ...gatePosts, lintel],
    doorGlow: [gateMat],
    links: [{ meshes: [writing.mesh], href: "/writing" }],
    background: P.skyTop,
    fog: { color: P.fog, near: 70, far: 300 },
    far: 700,
    update(t, dt) {
      sky.update?.(t, dt);
      // The hoisted plank sways gently on its line as it swings up.
      const swing = Math.sin(t * 0.9) * 0.09;
      hoistPlank.rotation.z = 0.06 + swing;
      hoistPlank.position.y = DECK_Y - 0.2 + Math.sin(t * 0.7) * 0.05;
      hoistLine.rotation.z = 0.1 + swing * 0.5;
      writing.update(t);
    },
    dispose() {
      sky.dispose();
      writing.dispose();
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      planks.dispose();
    },
  };
}
