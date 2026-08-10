import * as THREE from "three";
import { P, mat } from "../palette";
import { rng } from "../util";
import { addBookRow, addBookStack, addCandle, makeAdd, makeBeaconOrb } from "./kit";
import { addCloudClusters, cloudMaterial } from "./scenery";
import type { Collider, Interior } from "./types";

// Inside the observatory: Faust's study under the glass dome. A stone drum ringed
// with the lab — a cluttered work table of glowing vials, shelves and stacks of
// old books, a cauldron simmering green — and off to one side a small wrought-iron
// spiral stair climbing to a gallery, where a great brass telescope rises from the
// landing up and out through the glass dome at the drifting clouds.

const R = 4.6; // room radius
const WALL_H = 3.1;

// A brighter, more welcoming palette than the island's dark timber, so the
// study reads as a sunlit room rather than a dim den: a pale honey floor and
// lighter warm wood for the furniture. (Local to the lab — the shared palette,
// and every other interior, is untouched.)
const FLOOR = 0xe4cc9e;
const LAB_WOOD = 0xcaa06e; // tabletops, shelf boards, door frame
const LAB_WOOD_DARK = 0xa87c52; // legs, shelf sides, trim, treads, the door

// A small wrought-iron spiral stair set against the −x wall, winding up to a
// modest side gallery. Kept off to one side so the room floor stays open.
const STAIR_CX = -2.85;
const STAIR_CZ = 2.0;
const R_LAND = 0.62; // top landing radius
const R_STAIR = 1.02; // outer edge of the tread annulus
const PLAT_H = 1.65; // gallery height above the floor
const STAIR_START = 0; // the foot faces +x, toward the open room

// Floor height under (x, z): flat everywhere the lab sits, rising only within the
// little stair — a one-turn spiral ramp around the newel and a flat landing on
// top. A single-valued field (one turn) so the walk rig can follow it.
function observatoryFloor(x: number, z: number): number {
  const dx = x - STAIR_CX;
  const dz = z - STAIR_CZ;
  const r = Math.hypot(dx, dz);
  if (r <= R_LAND) return PLAT_H;
  if (r <= R_STAIR) {
    let a = Math.atan2(dz, dx) - STAIR_START;
    a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return (a / (Math.PI * 2)) * PLAT_H;
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
  add(new THREE.CircleGeometry(R + 0.2, 36).rotateX(-Math.PI / 2), mat(FLOOR, { flat: true }), 0, 0, 0);
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
  add(new THREE.TorusGeometry(R - 0.03, 0.06, 6, 28).rotateX(Math.PI / 2), mat(LAB_WOOD_DARK), 0, 0.06, 0);

  // A fun celestial rug in the middle of the floor: a golden sunburst on a
  // night-blue field, ringed with teal and little gold stars. Thin discs stacked
  // a hair apart with rising renderOrder so they layer cleanly over the boards.
  const navy = 0x3f72b0;
  const navyLight = 0x5f93cf;
  add(new THREE.CircleGeometry(1.7, 48).rotateX(-Math.PI / 2), mat(navy, { flat: true }), 0, 0.012, 0).renderOrder = 1;
  add(new THREE.RingGeometry(1.54, 1.7, 48).rotateX(-Math.PI / 2), mat(P.gold, { flat: true }), 0, 0.015, 0).renderOrder = 2;
  add(new THREE.RingGeometry(1.2, 1.36, 48).rotateX(-Math.PI / 2), mat(P.blimpTeal, { flat: true }), 0, 0.015, 0).renderOrder = 2;
  add(new THREE.CircleGeometry(1.04, 48).rotateX(-Math.PI / 2), mat(navyLight, { flat: true }), 0, 0.018, 0).renderOrder = 2;
  add(new THREE.RingGeometry(1.0, 1.04, 48).rotateX(-Math.PI / 2), mat(P.gold, { flat: true }), 0, 0.022, 0).renderOrder = 3;
  const rayGeo = new THREE.BoxGeometry(0.07, 0.006, 0.55);
  geometries.push(rayGeo);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const ray = new THREE.Mesh(rayGeo, mat(P.blossomYellow, { flat: true }));
    ray.position.set(Math.sin(a) * 0.52, 0.024, Math.cos(a) * 0.52);
    ray.rotation.y = a;
    ray.renderOrder = 3;
    group.add(ray);
  }
  add(new THREE.CircleGeometry(0.34, 28).rotateX(-Math.PI / 2), mat(P.gold, { flat: true }), 0, 0.027, 0).renderOrder = 3;
  const starGeo = new THREE.CircleGeometry(0.05, 12).rotateX(-Math.PI / 2);
  geometries.push(starGeo);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const star = new THREE.Mesh(starGeo, mat(P.blossomYellow, { flat: true }));
    star.position.set(Math.sin(a) * 1.28, 0.021, Math.cos(a) * 1.28);
    star.renderOrder = 3;
    group.add(star);
  }

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
  const doorMat = new THREE.MeshLambertMaterial({ color: LAB_WOOD_DARK, flatShading: true });
  const frameMat = new THREE.MeshLambertMaterial({ color: LAB_WOOD, flatShading: true });
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

  // ===== A small wrought-iron spiral stair up to the telescope gallery =====
  const N_STEPS = 12;
  const rMid = (R_LAND + R_STAIR) / 2;
  add(new THREE.CylinderGeometry(0.06, 0.06, PLAT_H, 10), mat(P.brass), STAIR_CX, PLAT_H / 2, STAIR_CZ); // newel, up to the landing
  const treadGeo = new THREE.BoxGeometry(R_STAIR - R_LAND + 0.06, 0.05, (Math.PI * 2 * rMid) / N_STEPS + 0.02);
  const balGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.6, 6);
  geometries.push(treadGeo, balGeo);
  const railPts: THREE.Vector3[] = [];
  for (let i = 0; i < N_STEPS; i++) {
    const frac = (i + 0.5) / N_STEPS;
    const a = STAIR_START + frac * Math.PI * 2;
    const h = frac * PLAT_H;
    const cx = STAIR_CX + Math.cos(a) * rMid;
    const cz = STAIR_CZ + Math.sin(a) * rMid;
    const tread = new THREE.Mesh(treadGeo, mat(LAB_WOOD_DARK, { flat: true }));
    tread.position.set(cx, h, cz);
    tread.rotation.y = -a;
    group.add(tread);
    const ox = STAIR_CX + Math.cos(a) * (R_STAIR - 0.02);
    const oz = STAIR_CZ + Math.sin(a) * (R_STAIR - 0.02);
    const bal = new THREE.Mesh(balGeo, mat(P.brass));
    bal.position.set(ox, h + 0.29, oz);
    group.add(bal);
    railPts.push(new THREE.Vector3(ox, h + 0.58, oz));
  }
  const railCurve = new THREE.CatmullRomCurve3(railPts);
  const railGeo = new THREE.TubeGeometry(railCurve, 64, 0.02, 5);
  geometries.push(railGeo);
  group.add(new THREE.Mesh(railGeo, mat(P.brass)));

  // Small landing platform at the top, with a wiry guard ring.
  add(new THREE.CylinderGeometry(R_LAND + 0.1, R_LAND + 0.1, 0.06, 18), mat(LAB_WOOD_DARK, { flat: true }), STAIR_CX, PLAT_H, STAIR_CZ);
  const gpGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.6, 6);
  geometries.push(gpGeo);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const gp = new THREE.Mesh(gpGeo, mat(P.brass));
    gp.position.set(STAIR_CX + Math.cos(a) * (R_LAND + 0.04), PLAT_H + 0.3, STAIR_CZ + Math.sin(a) * (R_LAND + 0.04));
    group.add(gp);
  }
  add(new THREE.TorusGeometry(R_LAND + 0.04, 0.02, 6, 22).rotateX(Math.PI / 2), mat(P.brass), STAIR_CX, PLAT_H + 0.58, STAIR_CZ);

  // The telescope stands on the gallery at the top of the stair — its long brass
  // tube rising from the landing up and out through the glass dome at the sky.
  const scope = new THREE.Group();
  scope.position.set(STAIR_CX, PLAT_H + 0.05, STAIR_CZ);
  scope.rotation.z = 0.16; // lean the tube outward, over the −x edge of the gallery
  const mountGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.3, 12);
  const forkGeo = new THREE.BoxGeometry(0.07, 0.55, 0.07);
  const scopeTubeGeo = new THREE.CylinderGeometry(0.17, 0.2, 4.8, 16);
  const finderGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.7, 10);
  const eyeGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.34, 10);
  const objGeo = new THREE.SphereGeometry(0.19, 14, 10);
  geometries.push(mountGeo, forkGeo, scopeTubeGeo, finderGeo, eyeGeo, objGeo);
  const mount = new THREE.Mesh(mountGeo, mat(LAB_WOOD_DARK, { flat: true }));
  mount.position.y = 0.15;
  scope.add(mount);
  for (const sx of [-1, 1]) {
    const fork = new THREE.Mesh(forkGeo, mat(P.brass));
    fork.position.set(sx * 0.17, 0.48, 0);
    scope.add(fork);
  }
  const tube = new THREE.Mesh(scopeTubeGeo, mat(P.brass));
  tube.position.set(0, 2.6, 0);
  scope.add(tube);
  // Objective at the high end (out through the dome); eyepiece + finder down low.
  const objective = new THREE.Mesh(objGeo, mat(P.glassTeal, { transparent: true, opacity: 0.6 }));
  objective.position.set(0, 4.9, 0);
  scope.add(objective);
  const eyepiece = new THREE.Mesh(eyeGeo, mat(P.brassBright));
  eyepiece.position.set(0, 0.5, 0.26);
  eyepiece.rotation.x = 1.0;
  scope.add(eyepiece);
  const finder = new THREE.Mesh(finderGeo, mat(P.brassBright));
  finder.position.set(0.15, 1.15, 0.1);
  scope.add(finder);
  group.add(scope);

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
  add(new THREE.BoxGeometry(2.7, 0.1, 1.15), mat(LAB_WOOD, { flat: true }), TB.cx, TB.y, TB.cz);
  const legGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.88, 7);
  geometries.push(legGeo);
  for (const [lx, lz] of [[-1.2, -0.45], [1.2, -0.45], [-1.2, 0.45], [1.2, 0.45]]) {
    const leg = new THREE.Mesh(legGeo, mat(LAB_WOOD_DARK));
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

  // One shelf unit on the −x wall (the visitor's left), packed with books.
  const shelfAngles = [-Math.PI / 2];
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
      const side = new THREE.Mesh(sideGeo, mat(LAB_WOOD_DARK, { flat: true }));
      side.position.set(ex, 1.15, 0);
      unit.add(side);
    }
    [0.35, 1.0, 1.65].forEach((sy) => {
      const board = new THREE.Mesh(boardGeo, mat(LAB_WOOD, { flat: true }));
      board.position.set(0, sy, 0);
      unit.add(board);
    });
    const cap = new THREE.Mesh(capGeo, mat(LAB_WOOD_DARK, { flat: true }));
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

  // The cauldron to the left of the table, in the gap between it and the
  // bookshelf, simmering green.
  const cauldron = new THREE.Group();
  cauldron.position.set(-2.6, 0, -2.4);
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

  // Book piles and loose papers on the floor of the outer ring.
  addBookStack(group, geometries, -3.6, 0, -1.9, 5, 13);
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

  // The study's one clickable-looking object: a glowing "My research" orb
  // floating by the +x wall on the right (built by makeBeaconOrb).
  const orb = makeBeaconOrb({
    x: 3.6, y: 1.5, z: -0.5,
    title: "My research",
    faceColor: "#1f7ce8",
    textColor: "#eef4ff",
    glowColor: 0x6ab0ff,
  });
  group.add(orb.group);

  // Light: bright daylight pours down through the dome.
  const hemi = new THREE.HemisphereLight(0xeaf4ff, 0xd8c4a2, 1.9);
  const domeLight = new THREE.DirectionalLight(0xfff4dc, 1.3);
  domeLight.position.set(2, 8, 1);
  group.add(hemi, domeLight);

  return {
    group,
    bounds: { kind: "circle", x: 0, z: 0, r: R - 0.25 },
    floorHeightAt: observatoryFloor,
    colliders: [
      { kind: "rect", minX: -1.5, maxX: 1.5, minZ: -4.0, maxZ: -2.8 }, // table
      { kind: "circle", x: -2.6, z: -2.4, r: 0.7 }, // cauldron
      ...shelfColliders,
    ],
    floorY: 0,
    spawn: { x: 0, z: 3.35, yaw: 0 },
    doorMeshes: [door, lintel, ...jambs],
    doorGlow: [doorMat, frameMat],
    links: [{ meshes: [orb.mesh], href: "/research" }],
    background: P.skyTop,
    update(t) {
      for (const b of bubbles) {
        const cycle = (t * 0.5 + (b.userData.phase as number)) % 1;
        b.position.y = surf + 0.3 + cycle * 0.22;
        b.scale.setScalar(1 - cycle * 0.6);
      }
      clouds.rotation.y = t * 0.01;
      orb.update(t);
    },
    dispose() {
      orb.dispose();
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const im of instanced) im.dispose();
    },
  };
}
