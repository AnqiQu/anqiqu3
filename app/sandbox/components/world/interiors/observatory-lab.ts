import * as THREE from "three";
import { P, mat } from "../palette";
import { rng } from "../util";
import { addBookRow, addBookStack, addCandle, makeAdd } from "./kit";
import { addCloudClusters, cloudMaterial } from "./scenery";
import type { Collider, Interior } from "./types";

// Inside the observatory: Faust's study under the glass dome. A stone drum ringed
// with the lab — a cluttered work table of glowing vials, shelves and stacks of
// old books, a cauldron simmering green — and at its heart a central pier you
// climb by a spiral stair to a viewing deck, where a great brass telescope points
// up through the clear dome at the drifting clouds.

const R = 4.6; // room radius
const WALL_H = 3.1;
const R_DECK = 1.3; // central pier / viewing-deck radius
const R_STAIR = 2.5; // outer edge of the spiral stair annulus
const DECK_H = 1.9; // viewing-deck height above the floor
const STAIR_START = Math.PI / 2; // the stair's foot faces +z (toward the door/spawn)

// Floor height under (x, z): the flat outer ring where the lab sits, a one-turn
// spiral ramp climbing the annulus around the pier, and the flat deck on top.
// A single-valued field (one turn only) so the walk rig can follow it.
function observatoryFloor(x: number, z: number): number {
  const r = Math.hypot(x, z);
  if (r <= R_DECK) return DECK_H;
  if (r <= R_STAIR) {
    let a = Math.atan2(z, x) - STAIR_START;
    a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return (a / (Math.PI * 2)) * DECK_H;
  }
  return 0;
}

export function buildObservatoryLab(): Interior {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const instanced: THREE.InstancedMesh[] = [];
  const materials: THREE.Material[] = []; // private (non-cache) materials
  const add = makeAdd(group, geometries);

  // Shell: wood floor, stone drum wall, and a near-clear glass dome so the sky
  // and its drifting clouds read plainly when you look up.
  add(new THREE.CircleGeometry(R + 0.2, 36).rotateX(-Math.PI / 2), mat(P.floorWood, { flat: true }), 0, 0, 0);
  const wall = add(
    new THREE.CylinderGeometry(R, R, WALL_H, 28, 1, true),
    mat(P.stonePale, { flat: true, side: THREE.BackSide }),
    0, WALL_H / 2, 0,
  );
  wall.rotation.y = Math.PI / 28;
  add(
    new THREE.SphereGeometry(R, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(P.glassTeal, { transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }),
    0, WALL_H, 0,
  ).renderOrder = 4;
  const ribGeo = new THREE.TorusGeometry(R - 0.04, 0.05, 6, 24, Math.PI);
  geometries.push(ribGeo);
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(ribGeo, mat(P.brass));
    rib.position.y = WALL_H;
    rib.rotation.y = (i / 3) * Math.PI;
    group.add(rib);
  }
  add(new THREE.TorusGeometry(R - 0.03, 0.07, 6, 28).rotateX(Math.PI / 2), mat(P.brass), 0, WALL_H, 0);
  add(new THREE.TorusGeometry(R - 0.03, 0.06, 6, 28).rotateX(Math.PI / 2), mat(P.woodDark), 0, 0.06, 0);

  // Clouds drifting above the dome, seen through the glass. Kept above the
  // apex (y > 7.7) so they never poke into the room.
  const cloudMat = cloudMaterial(materials);
  const clouds = new THREE.Group();
  addCloudClusters(clouds, geometries, cloudMat, [
    [-6, 10.5, -4, 3], [7, 12, 3.5, 3.4], [1.5, 14, -8, 4], [-9, 11, 6, 3.2], [9, 13, -6, 2.8],
  ]);
  group.add(clouds);

  // Exit: a heavy wooden door in the +z wall. Private materials so hover can
  // lift their emissive without lighting every woodDark mesh in the world.
  const doorMat = new THREE.MeshLambertMaterial({ color: P.woodDark, flatShading: true });
  const frameMat = new THREE.MeshLambertMaterial({ color: P.wood, flatShading: true });
  materials.push(doorMat, frameMat);
  const door = add(new THREE.BoxGeometry(1.15, 2.2, 0.12), doorMat, 0, 1.1, R - 0.18);
  const lintel = add(new THREE.BoxGeometry(1.55, 0.16, 0.2), frameMat, 0, 2.28, R - 0.22);
  const jambGeo = new THREE.BoxGeometry(0.14, 2.2, 0.2);
  geometries.push(jambGeo);
  const jambs = [-0.71, 0.71].map((x) => {
    const jamb = new THREE.Mesh(jambGeo, frameMat);
    jamb.position.set(x, 1.1, R - 0.22);
    group.add(jamb);
    return jamb;
  });
  add(new THREE.SphereGeometry(0.055, 8, 6), mat(P.brass), -0.42, 1.05, R - 0.26);

  // ===== Central pier, spiral stair, and viewing deck =====
  // Stone pier carrying the deck.
  add(new THREE.CylinderGeometry(R_DECK, R_DECK + 0.14, DECK_H, 20), mat(P.stonePale, { flat: true }), 0, DECK_H / 2, 0);
  // Deck top surface + brass rim.
  add(new THREE.CircleGeometry(R_DECK + 0.06, 24).rotateX(-Math.PI / 2), mat(P.stone, { flat: true }), 0, DECK_H + 0.011, 0);
  add(new THREE.TorusGeometry(R_DECK + 0.05, 0.05, 6, 24).rotateX(Math.PI / 2), mat(P.brass), 0, DECK_H + 0.02, 0);

  // Spiral treads winding up the annulus, plus a helical handrail on the outer
  // edge. Tread heights track the floor field so the feet stay on the treads.
  const N_STEPS = 14;
  const rMid = (R_DECK + R_STAIR) / 2;
  const treadGeo = new THREE.BoxGeometry(R_STAIR - R_DECK + 0.1, 0.12, (Math.PI * 2 * rMid) / N_STEPS + 0.18);
  const riserGeo = new THREE.BoxGeometry(R_STAIR - R_DECK + 0.1, DECK_H / N_STEPS + 0.06, 0.08);
  geometries.push(treadGeo, riserGeo);
  const railPts: THREE.Vector3[] = [];
  const postGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.95, 6);
  geometries.push(postGeo);
  for (let i = 0; i < N_STEPS; i++) {
    const frac = (i + 0.5) / N_STEPS;
    const a = STAIR_START + frac * Math.PI * 2;
    const h = frac * DECK_H;
    const cx = Math.cos(a) * rMid;
    const cz = Math.sin(a) * rMid;
    const tread = new THREE.Mesh(treadGeo, mat(P.stonePale, { flat: true }));
    tread.position.set(cx, h, cz);
    tread.rotation.y = -a;
    group.add(tread);
    const riser = new THREE.Mesh(riserGeo, mat(P.wood, { flat: true }));
    riser.position.set(cx, h - (DECK_H / N_STEPS) / 2, cz);
    riser.rotation.y = -a;
    group.add(riser);
    // Outer handrail post + rail sample point.
    const post = new THREE.Mesh(postGeo, mat(P.brass));
    post.position.set(Math.cos(a) * (R_STAIR - 0.06), h + 0.47, Math.sin(a) * (R_STAIR - 0.06));
    group.add(post);
    railPts.push(new THREE.Vector3(Math.cos(a) * (R_STAIR - 0.06), h + 0.92, Math.sin(a) * (R_STAIR - 0.06)));
  }
  const railCurve = new THREE.CatmullRomCurve3(railPts);
  const railGeo = new THREE.TubeGeometry(railCurve, 48, 0.035, 5);
  geometries.push(railGeo);
  group.add(new THREE.Mesh(railGeo, mat(P.brass)));

  // Deck railing: short posts + a ring rail around the perimeter, with a gap on
  // the stair-top side so the way on and off reads clearly.
  const deckPostGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6);
  geometries.push(deckPostGeo);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    // Leave the arc around the stair top (just clockwise of STAIR_START) open.
    if (Math.abs(((a - (STAIR_START - 0.5)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) < 0.9) continue;
    const rp = new THREE.Mesh(deckPostGeo, mat(P.brass));
    rp.position.set(Math.cos(a) * (R_DECK - 0.02), DECK_H + 0.28, Math.sin(a) * (R_DECK - 0.02));
    group.add(rp);
  }

  // The great telescope on the deck, aimed up through the dome.
  const scopeGroup = new THREE.Group();
  scopeGroup.position.set(0, DECK_H, 0);
  const mountGeo = new THREE.CylinderGeometry(0.2, 0.28, 0.5, 12);
  const forkGeo = new THREE.BoxGeometry(0.12, 0.7, 0.12);
  const bigTubeGeo = new THREE.CylinderGeometry(0.17, 0.23, 2.5, 14);
  const eyeGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.35, 10);
  const lensGeo = new THREE.SphereGeometry(0.2, 12, 8);
  geometries.push(mountGeo, forkGeo, bigTubeGeo, eyeGeo, lensGeo);
  const mount = new THREE.Mesh(mountGeo, mat(P.woodDark, { flat: true }));
  mount.position.y = 0.25;
  scopeGroup.add(mount);
  for (const sx of [-1, 1]) {
    const fork = new THREE.Mesh(forkGeo, mat(P.brass));
    fork.position.set(sx * 0.26, 0.8, 0);
    scopeGroup.add(fork);
  }
  const bigTube = new THREE.Mesh(bigTubeGeo, mat(P.brass));
  bigTube.position.set(0, 1.35, -0.1);
  bigTube.rotation.x = 0.42; // lean toward the dome
  scopeGroup.add(bigTube);
  const lens = new THREE.Mesh(lensGeo, mat(P.glassTeal, { transparent: true, opacity: 0.7 }));
  lens.position.set(0, 2.42, 0.42);
  scopeGroup.add(lens);
  const eyepiece = new THREE.Mesh(eyeGeo, mat(P.brassBright));
  eyepiece.position.set(0, 0.42, -0.62);
  eyepiece.rotation.x = 0.42;
  scopeGroup.add(eyepiece);
  group.add(scopeGroup);

  // ===== The lab, ringing the wall at ground level =====
  const glassMat = new THREE.MeshLambertMaterial({
    color: 0xdff2ef, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false,
  });
  materials.push(glassMat);
  const potions = [P.potionGreen, P.potionPurple, P.potionBlue, P.blossomOrange];
  const potionMats = potions.map((c) => {
    const m = new THREE.MeshBasicMaterial({ color: c });
    materials.push(m);
    return m;
  });

  // Work table against the −z wall, groaning under the experiment.
  const TB = { cx: 0, cz: -3.4, y: 0.92 };
  const rug = add(new THREE.CircleGeometry(1.7, 24).rotateX(-Math.PI / 2), mat(P.rugRed), TB.cx, 0.012, TB.cz + 0.1);
  rug.renderOrder = 1;
  add(new THREE.BoxGeometry(2.7, 0.1, 1.15), mat(P.wood, { flat: true }), TB.cx, TB.y, TB.cz);
  const legGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.88, 7);
  geometries.push(legGeo);
  for (const [lx, lz] of [[-1.2, -0.45], [1.2, -0.45], [-1.2, 0.45], [1.2, 0.45]]) {
    const leg = new THREE.Mesh(legGeo, mat(P.woodDark));
    leg.position.set(TB.cx + lx, 0.44, TB.cz + lz);
    group.add(leg);
  }

  // Vials and flasks along the table.
  const tubeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.26, 8, 1, true);
  const liquidGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.12, 8);
  const flaskGeo = new THREE.SphereGeometry(0.13, 10, 8);
  const neckGeo = new THREE.CylinderGeometry(0.035, 0.05, 0.16, 8);
  geometries.push(tubeGeo, liquidGeo, flaskGeo, neckGeo);
  const surf = TB.y + 0.05;
  const vialSpots: Array<[number, number, number]> = [
    [-0.95, -0.2, 0], [-0.7, 0.15, 1], [-0.4, -0.28, 2], [0.05, 0.22, 3],
    [0.5, -0.22, 0], [0.85, 0.18, 2], [1.15, -0.08, 1],
  ];
  for (const [vx, vz, ci] of vialSpots) {
    const tube = new THREE.Mesh(tubeGeo, glassMat);
    tube.position.set(TB.cx + vx, surf + 0.13, TB.cz + vz);
    tube.renderOrder = 3;
    const liquid = new THREE.Mesh(liquidGeo, potionMats[ci]);
    liquid.position.set(TB.cx + vx, surf + 0.06, TB.cz + vz);
    group.add(tube, liquid);
  }
  const flask = new THREE.Mesh(flaskGeo, potionMats[0]);
  flask.position.set(TB.cx - 0.5, surf + 0.12, TB.cz - 0.32);
  flask.scale.y = 0.85;
  const flaskNeck = new THREE.Mesh(neckGeo, glassMat);
  flaskNeck.position.set(TB.cx - 0.5, surf + 0.3, TB.cz - 0.32);
  flaskNeck.renderOrder = 3;
  const flask2 = new THREE.Mesh(flaskGeo, potionMats[1]);
  flask2.position.set(TB.cx + 0.95, surf + 0.1, TB.cz - 0.28);
  flask2.scale.setScalar(0.8);
  group.add(flask, flaskNeck, flask2);
  const bubbleGeo = new THREE.SphereGeometry(0.02, 6, 5);
  geometries.push(bubbleGeo);
  const bubbles = [0, 1, 2].map((i) => {
    const b = new THREE.Mesh(bubbleGeo, potionMats[0]);
    b.position.set(TB.cx - 0.5, surf + 0.32, TB.cz - 0.32);
    b.userData.phase = i / 3;
    group.add(b);
    return b;
  });
  // Open book on the table.
  const leafGeo = new THREE.BoxGeometry(0.24, 0.02, 0.34);
  geometries.push(leafGeo);
  for (const s of [-1, 1]) {
    const pageLeaf = new THREE.Mesh(leafGeo, mat(P.parchment, { flat: true }));
    pageLeaf.position.set(TB.cx + 0.35 + s * 0.115, surf + 0.03, TB.cz + 0.35);
    pageLeaf.rotation.z = -s * 0.22;
    group.add(pageLeaf);
  }
  addBookStack(group, geometries, TB.cx - 1.0, surf, TB.cz + 0.25, 3, 12);

  // Two shelf units on the ±x walls, packed with books.
  const shelfAngles = [Math.PI / 2, -Math.PI / 2];
  const shelfColliders: Collider[] = [];
  shelfAngles.forEach((a, si) => {
    const sx = Math.sin(a) * (R - 0.45);
    const sz = Math.cos(a) * (R - 0.45);
    const unit = new THREE.Group();
    unit.position.set(sx, 0, sz);
    unit.rotation.y = a + Math.PI;
    const sideGeo = new THREE.BoxGeometry(0.16, 2.3, 0.34);
    const boardGeo = new THREE.BoxGeometry(1.9, 0.06, 0.34);
    const capGeo = new THREE.BoxGeometry(1.9, 0.1, 0.34);
    geometries.push(sideGeo, boardGeo, capGeo);
    for (const ex of [-0.95, 0.95]) {
      const side = new THREE.Mesh(sideGeo, mat(P.woodDark, { flat: true }));
      side.position.set(ex, 1.15, 0);
      unit.add(side);
    }
    [0.35, 1.0, 1.65].forEach((sy) => {
      const board = new THREE.Mesh(boardGeo, mat(P.wood, { flat: true }));
      board.position.set(0, sy, 0);
      unit.add(board);
    });
    const cap = new THREE.Mesh(capGeo, mat(P.woodDark, { flat: true }));
    cap.position.set(0, 2.25, 0);
    unit.add(cap);
    group.add(unit);
    [0.35, 1.0, 1.65].forEach((sy, ri) => {
      addBookRow(group, geometries, instanced, {
        x: sx, y: sy + 0.03, z: sz, yaw: a + Math.PI, length: 1.7, seed: 40 + si * 10 + ri,
      });
    });
    shelfColliders.push({ kind: "rect", minX: sx - 1.05, maxX: sx + 1.05, minZ: sz - 0.55, maxZ: sz + 0.55 });
  });

  // The cauldron in the +x/+z corner, simmering green.
  const cauldron = new THREE.Group();
  cauldron.position.set(3.0, 0, 2.4);
  const potGeo = new THREE.SphereGeometry(0.5, 14, 10, 0, Math.PI * 2, Math.PI * 0.25, Math.PI * 0.55);
  const rimGeo = new THREE.TorusGeometry(0.36, 0.05, 6, 16).rotateX(Math.PI / 2);
  const brewGeo = new THREE.CircleGeometry(0.33, 16).rotateX(-Math.PI / 2);
  const stubGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.3, 6);
  geometries.push(potGeo, rimGeo, brewGeo, stubGeo);
  const pot = new THREE.Mesh(potGeo, mat(P.dogBlack, { flat: true }));
  pot.position.y = 0.52;
  const potRim = new THREE.Mesh(rimGeo, mat(P.dogBlack));
  potRim.position.y = 0.88;
  const brew = new THREE.Mesh(brewGeo, potionMats[0]);
  brew.position.y = 0.84;
  cauldron.add(pot, potRim, brew);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const stub = new THREE.Mesh(stubGeo, mat(P.dogBlack));
    stub.position.set(Math.sin(a) * 0.3, 0.15, Math.cos(a) * 0.3);
    cauldron.add(stub);
  }
  group.add(cauldron);
  const brewLight = new THREE.PointLight(P.potionGreen, 4, 5, 2);
  brewLight.position.set(3.0, 1.3, 2.4);
  group.add(brewLight);

  // Book piles and loose papers on the floor of the outer ring.
  addBookStack(group, geometries, -3.4, 0, 1.7, 5, 13);
  addBookStack(group, geometries, 3.3, 0, -1.5, 3, 14);
  addBookStack(group, geometries, 2.9, 0, 2.9, 4, 15);
  const paperGeo = new THREE.PlaneGeometry(0.24, 0.32).rotateX(-Math.PI / 2);
  geometries.push(paperGeo);
  const rand = rng(77);
  for (let i = 0; i < 8; i++) {
    const a = rand() * Math.PI * 2;
    const d = 2.8 + rand() * 1.4;
    const paper = new THREE.Mesh(paperGeo, mat(P.parchment, { side: THREE.DoubleSide }));
    paper.position.set(Math.sin(a) * d, 0.015 + rand() * 0.01, Math.cos(a) * d);
    paper.rotation.y = rand() * Math.PI;
    paper.renderOrder = 1;
    group.add(paper);
  }

  // Candles: on the table, and by the door.
  addCandle(group, geometries, TB.cx + 1.2, surf, TB.cz + 0.2);
  addCandle(group, geometries, TB.cx - 1.15, surf, TB.cz - 0.25, 0.1);
  addCandle(group, geometries, -1.35, 0, 3.4, 0.22);

  // Light: bright daylight pours down through the dome, warmed by the flames.
  const hemi = new THREE.HemisphereLight(0xdfefff, 0x6b543a, 1.5);
  const domeLight = new THREE.DirectionalLight(0xfff2d2, 1.1);
  domeLight.position.set(2, 8, 1);
  const candleLight = new THREE.PointLight(0xffd9a0, 10, 8, 2);
  candleLight.position.set(TB.cx, 1.8, TB.cz + 0.6);
  group.add(hemi, domeLight, candleLight);

  return {
    group,
    bounds: { kind: "circle", x: 0, z: 0, r: R - 0.25 },
    floorHeightAt: observatoryFloor,
    colliders: [
      { kind: "rect", minX: -1.5, maxX: 1.5, minZ: -4.0, maxZ: -2.8 }, // table
      { kind: "circle", x: 3.0, z: 2.4, r: 0.7 }, // cauldron
      ...shelfColliders,
    ],
    floorY: 0,
    spawn: { x: 0, z: 3.35, yaw: 0 },
    doorMeshes: [door, lintel, ...jambs],
    doorGlow: [doorMat, frameMat],
    background: P.skyTop,
    update(t) {
      for (const b of bubbles) {
        const cycle = (t * 0.5 + (b.userData.phase as number)) % 1;
        b.position.y = surf + 0.3 + cycle * 0.22;
        b.scale.setScalar(1 - cycle * 0.6);
      }
      brewLight.intensity = 4 + Math.sin(t * 5.1) * 0.9 + Math.sin(t * 8.7) * 0.5;
      clouds.rotation.y = t * 0.01;
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const im of instanced) im.dispose();
    },
  };
}
