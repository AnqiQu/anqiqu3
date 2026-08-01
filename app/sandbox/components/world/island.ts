import * as THREE from "three";
import { P, mat } from "./palette";
import type { WorldModule } from "./types";
import { rng, valueNoise } from "./util";
import {
  ISLAND_RX,
  ISLAND_RZ,
  OBSERVATORY_CENTER,
  POND_CENTER,
  ellipticalRadius,
  terrainHeight,
  terrainNormal,
} from "./terrain";

// The stepping-stone path winds bench → pond → greenhouse → archive →
// observatory steps so every landmark reads as connected. Lanterns and flower
// clusters hang off it. The first two points are the spur up to the north-west
// tree grove, ending facing the bench (see BENCH below); the last four climb
// the hill's south-east flank to the foot of the observatory stair, keeping
// clear of the solar array on the north-west side.
const PATH_POINTS: Array<[number, number]> = [
  [-10.1, 13.3], [-10.3, 11.3],
  [-9, 9.5], [-4.5, 13.5], [2, 14.4], [8, 10.5], [8.5, 4], [6, -1.5],
  [-2, -3], [-9, -3.5], [-14, -2.5], [-13.6, -5.4], [-9.6, -6], [-7.2, -6.6],
  [-6.1, -8.1],
];

// Note: keep the corridor around (5..7, 16..20) clear — the final camera
// keyframe sits there looking at the pond and bridge.
const TREE_SPOTS: Array<[number, number]> = [
  [-22, -8], [-19, 7], [-12, 14], [13, 15], [21, 3], [18, -8],
  [10, -16], [-2, -18], [24, -2], [12, 16.5], [-14, 13], [14, -13],
];

const LANTERN_SPOTS: Array<[number, number]> = [
  [-10.6, 8.2], [-3.5, 13.3], [4, 13.8], [8.8, 5], [3, -4.5], [-11, -4.8],
];

// Bench at the end of the grove spur: back to the trunk of TREE_SPOTS[2],
// facing back down the path across the meadow toward the pond.
const BENCH = { x: -11.2, z: 13.71, rotationY: 1.92 };

// The bench plaque is handed back separately: engine.ts registers it as a
// hover/click target of its own, independent of the island it rides on.
export type Island = WorldModule & { plaque: THREE.Group };

export function buildIsland(): Island {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const instanced: THREE.InstancedMesh[] = [];
  const rand = rng(710);
  const dummy = new THREE.Object3D();

  // ===== Meadow cap =====
  // A grid plane clamped to the island ellipse: outside vertices snap to the
  // boundary (duplicates are fine for flat shading), then everything gets the
  // shared height field and painterly vertex colors.
  const capGeo = new THREE.PlaneGeometry(ISLAND_RX * 2, ISLAND_RZ * 2, 44, 36);
  capGeo.rotateX(-Math.PI / 2);
  const capPos = capGeo.attributes.position;
  const capColors: number[] = [];
  const cMeadow = new THREE.Color(P.meadow);
  const cDark = new THREE.Color(P.meadowDark);
  const cLight = new THREE.Color(P.meadowLight);
  const cMoss = new THREE.Color(P.moss);
  const cSand = new THREE.Color(P.path);
  const scratch = new THREE.Color();
  for (let i = 0; i < capPos.count; i++) {
    let x = capPos.getX(i);
    let z = capPos.getZ(i);
    const re = ellipticalRadius(x, z);
    if (re > 1) {
      x /= re;
      z /= re;
      capPos.setX(i, x);
      capPos.setZ(i, z);
    }
    capPos.setY(i, terrainHeight(x, z));

    // Color: broad noise patches between the three meadow greens, moss near the
    // rim lip, sand ringing the pond.
    const n = valueNoise(x * 0.22 + 7, z * 0.22 - 3);
    if (n < 0.4) scratch.copy(cDark).lerp(cMeadow, n / 0.4);
    else scratch.copy(cMeadow).lerp(cLight, (n - 0.4) / 0.6);
    const reNow = ellipticalRadius(x, z);
    if (reNow > 0.82) scratch.lerp(cMoss, THREE.MathUtils.smoothstep(reNow, 0.82, 1));
    // Blend the folded-down rim into the rock so the meadow/cliff seam doesn't
    // read as a dark ring.
    const droop = THREE.MathUtils.smoothstep(reNow, 0.94, 1);
    if (droop > 0) scratch.lerp(new THREE.Color(P.earth), droop * 0.8);
    const pondDist = Math.hypot(x - POND_CENTER.x, z - POND_CENTER.z);
    if (pondDist < 6.6) scratch.lerp(cSand, THREE.MathUtils.smoothstep(6.6 - pondDist, 0, 2));
    capColors.push(scratch.r, scratch.g, scratch.b);
  }
  capGeo.setAttribute("color", new THREE.Float32BufferAttribute(capColors, 3));
  capGeo.computeVertexNormals();
  const capMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const cap = new THREE.Mesh(capGeo, capMat);
  // The terrain participates in the hover raycast so landmarks behind the
  // hill can't be hovered through it.
  cap.userData.occluder = true;
  group.add(cap);
  geometries.push(capGeo);
  materials.push(capMat);

  // ===== Cliff skirt + rocky underside =====
  // The top ring sits slightly INSIDE the meadow ellipse and just below its
  // drooping rim, with displacement noise faded to zero at the join — a wider
  // or noisy top ring reads as a brown sheet sticking out past the grass.
  const cliffGeo = new THREE.CylinderGeometry(ISLAND_RX - 0.4, 4.5, 16, 26, 4, true);
  const cliffPos = cliffGeo.attributes.position;
  for (let i = 0; i < cliffPos.count; i++) {
    const x = cliffPos.getX(i);
    const y = cliffPos.getY(i);
    const z = cliffPos.getZ(i);
    const len = Math.hypot(x, z) || 1;
    const fade = (8 - y) / 16; // 0 at the top ring, 1 at the bottom tip
    const bump = (valueNoise(x * 0.35 + 9, z * 0.35 + y * 0.3) - 0.5) * 2.4 * fade;
    cliffPos.setX(i, x + (x / len) * bump);
    cliffPos.setZ(i, z + (z / len) * bump);
    cliffPos.setY(i, y + (valueNoise(x * 0.5, z * 0.5) - 0.5) * 1.2 * fade);
  }
  cliffGeo.computeVertexNormals();
  // Warm emissive floor: the skirt faces mostly downward and would otherwise
  // render near-black.
  const cliff = new THREE.Mesh(cliffGeo, mat(P.earth, { flat: true, emissive: 0x33261a }));
  cliff.position.y = -9.9; // top ring at y ≈ −1.9, tucked under the grass rim
  cliff.scale.z = ISLAND_RZ / ISLAND_RX;
  cliff.userData.occluder = true;
  group.add(cliff);
  geometries.push(cliffGeo);

  const rockGeo = new THREE.DodecahedronGeometry(1.4, 0);
  const rocks = new THREE.InstancedMesh(rockGeo, mat(P.rock, { flat: true }), 14);
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + rand() * 0.4;
    const radius = 20 + rand() * 5;
    dummy.position.set(Math.cos(angle) * radius, -2.5 - rand() * 6, Math.sin(angle) * radius * 0.8);
    dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    const s = 0.8 + rand() * 1.6;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  }
  group.add(rocks);
  geometries.push(rockGeo);
  instanced.push(rocks);

  // Hanging vines off the rim.
  const vineGeo = new THREE.CapsuleGeometry(0.09, 2.6, 3, 6);
  const vines = new THREE.InstancedMesh(vineGeo, mat(P.moss), 6);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.5;
    dummy.position.set(Math.cos(angle) * (ISLAND_RX - 1.5), -2.6 - rand(), Math.sin(angle) * (ISLAND_RZ - 1.2));
    dummy.rotation.set((rand() - 0.5) * 0.3, 0, (rand() - 0.5) * 0.3);
    dummy.scale.setScalar(0.8 + rand() * 0.8);
    dummy.updateMatrix();
    vines.setMatrixAt(i, dummy.matrix);
  }
  group.add(vines);
  geometries.push(vineGeo);
  instanced.push(vines);

  // Distant floating islets give the sky depth. Bare rock, no grass cap: the
  // caps read as flat green discs pasted on at this distance.
  const isletRockGeo = new THREE.DodecahedronGeometry(2.2, 0);
  geometries.push(isletRockGeo);
  for (const [x, y, z] of [
    [-40, -5, -14], [38, -9, 8], [-30, -13, 24],
  ] as Array<[number, number, number]>) {
    const rock = new THREE.Mesh(isletRockGeo, mat(P.rock, { flat: true }));
    rock.position.set(x, y, z);
    rock.scale.set(1, 0.75, 1);
    rock.rotation.y = rand() * Math.PI;
    group.add(rock);
  }

  // ===== Trees =====
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.6, 7);
  const trunks = new THREE.InstancedMesh(trunkGeo, mat(P.woodDark, { flat: true }), TREE_SPOTS.length);
  const canopyGeo = new THREE.IcosahedronGeometry(1.1, 1);
  const canopyColors = [P.canopy, P.canopyLight, P.canopyDark];
  const canopyMatrices: Array<{ m: THREE.Matrix4; c: number }> = [];
  TREE_SPOTS.forEach(([x, z], i) => {
    const y = terrainHeight(x, z);
    dummy.position.set(x, y + 0.7, z);
    dummy.rotation.set(0, rand() * Math.PI, (rand() - 0.5) * 0.12);
    dummy.scale.setScalar(0.85 + rand() * 0.5);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    const puffCount = 2 + (i % 2);
    for (let pIdx = 0; pIdx < puffCount; pIdx++) {
      dummy.position.set(
        x + (rand() - 0.5) * 0.9,
        y + 1.7 + pIdx * 0.75 + rand() * 0.3,
        z + (rand() - 0.5) * 0.9,
      );
      dummy.rotation.set(rand(), rand(), rand());
      dummy.scale.setScalar((1 - pIdx * 0.22) * (0.8 + rand() * 0.5));
      dummy.updateMatrix();
      canopyMatrices.push({ m: dummy.matrix.clone(), c: canopyColors[(i + pIdx) % 3] });
    }
  });
  const canopies = new THREE.InstancedMesh(canopyGeo, mat(0xffffff), canopyMatrices.length);
  canopyMatrices.forEach(({ m, c }, i) => {
    canopies.setMatrixAt(i, m);
    canopies.setColorAt(i, scratch.setHex(c));
  });
  group.add(trunks, canopies);
  geometries.push(trunkGeo, canopyGeo);
  instanced.push(trunks, canopies);

  // ===== Flowers =====
  // Two instanced meshes (green stems, colored heads) so heads can carry
  // per-instance blossom colors without tinting stems.
  const clusters: Array<[number, number, number, number]> = [
    // [cx, cz, radius, count] — around landmarks, plus scatter below.
    [6, -4, 4, 34], [-16, -2, 3.5, 26], [-9, 9, 2.5, 20], [2, 8, 7, 26],
    [-6, -14, 5, 30], [16, 9, 2.5, 14], [-13, -15, 3, 10],
  ];
  // Blossoms keep off the pond water and out of the observatory's stone
  // footprint, where they would poke up through the plinth ring.
  const flowerBlocked = (x: number, z: number) =>
    Math.hypot(x - POND_CENTER.x, z - POND_CENTER.z) < 5.6 ||
    Math.hypot(x - OBSERVATORY_CENTER.x, z - OBSERVATORY_CENTER.z) < 4.2;
  const flowerSpots: Array<[number, number]> = [];
  for (const [cx, cz, radius, count] of clusters) {
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = Math.sqrt(rand()) * radius;
      const x = cx + Math.cos(angle) * dist;
      const z = cz + Math.sin(angle) * dist;
      if (ellipticalRadius(x, z) > 0.95) continue;
      if (flowerBlocked(x, z)) continue;
      flowerSpots.push([x, z]);
    }
  }
  for (let i = 0; i < 60; i++) {
    const x = (rand() * 2 - 1) * ISLAND_RX * 0.9;
    const z = (rand() * 2 - 1) * ISLAND_RZ * 0.9;
    if (ellipticalRadius(x, z) > 0.92) continue;
    if (flowerBlocked(x, z)) continue;
    flowerSpots.push([x, z]);
  }

  const stemGeo = new THREE.ConeGeometry(0.025, 0.24, 5);
  const headGeo = new THREE.SphereGeometry(0.075, 6, 5);
  const stems = new THREE.InstancedMesh(stemGeo, mat(P.moss), flowerSpots.length);
  const heads = new THREE.InstancedMesh(headGeo, mat(0xffffff), flowerSpots.length);
  const blossoms = [P.blossomPink, P.blossomOrange, P.blossomYellow, P.koiWhite];
  flowerSpots.forEach(([x, z], i) => {
    const y = terrainHeight(x, z);
    const s = 0.8 + rand() * 0.9;
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(x, y + 0.12 * s, z);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);
    dummy.position.y = y + 0.27 * s;
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
    heads.setColorAt(i, scratch.setHex(blossoms[Math.floor(rand() * blossoms.length)]));
  });
  group.add(stems, heads);
  geometries.push(stemGeo, headGeo);
  instanced.push(stems, heads);

  // ===== Stepping-stone path =====
  const curve = new THREE.CatmullRomCurve3(
    PATH_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  );
  const stoneGeo = new THREE.CylinderGeometry(0.42, 0.5, 0.09, 7);
  const stoneCount = 48; // tracks the curve length: ~1.4 units of spacing
  const stones = new THREE.InstancedMesh(stoneGeo, mat(P.stone, { flat: true }), stoneCount);
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < stoneCount; i++) {
    const p = curve.getPointAt(i / (stoneCount - 1));
    const x = p.x + (rand() - 0.5) * 0.5;
    const z = p.z + (rand() - 0.5) * 0.5;
    dummy.position.set(x, terrainHeight(x, z) + 0.05, z);
    dummy.quaternion.setFromUnitVectors(up, terrainNormal(x, z));
    dummy.rotateY(rand() * Math.PI);
    const s = 0.7 + rand() * 0.5;
    dummy.scale.set(s, 1, s * (0.8 + rand() * 0.4));
    dummy.updateMatrix();
    stones.setMatrixAt(i, dummy.matrix);
  }
  group.add(stones);
  geometries.push(stoneGeo);
  instanced.push(stones);

  // ===== Lanterns =====
  const lanternGlows: THREE.Mesh[] = [];
  const postGeo = new THREE.CylinderGeometry(0.06, 0.09, 1.5, 7);
  const capGeoL = new THREE.ConeGeometry(0.18, 0.22, 6);
  const glowGeo = new THREE.SphereGeometry(0.13, 10, 8);
  const glowMat = new THREE.MeshBasicMaterial({ color: P.lanternGlow });
  geometries.push(postGeo, capGeoL, glowGeo);
  materials.push(glowMat);
  for (const [x, z] of LANTERN_SPOTS) {
    const y = terrainHeight(x, z);
    const post = new THREE.Mesh(postGeo, mat(P.woodDark, { flat: true }));
    post.position.set(x, y + 0.75, z);
    const cap = new THREE.Mesh(capGeoL, mat(P.brass));
    cap.position.set(x, y + 1.62, z);
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(x, y + 1.38, z);
    lanternGlows.push(glow);
    group.add(post, cap, glow);
  }

  // ===== Bench =====
  // Plank seat on dark legs, laid flush to the slope (same up→normal trick the
  // stepping stones use) so it never hovers on the meadow's rolls.
  const bench = new THREE.Group();
  bench.position.set(BENCH.x, terrainHeight(BENCH.x, BENCH.z) - 0.04, BENCH.z);
  bench.quaternion.setFromUnitVectors(up, terrainNormal(BENCH.x, BENCH.z));
  bench.rotateY(BENCH.rotationY);
  const benchLegGeo = new THREE.BoxGeometry(0.14, 0.46, 0.52);
  const benchPostGeo = new THREE.BoxGeometry(0.12, 0.66, 0.12);
  const benchSeatGeo = new THREE.BoxGeometry(1.85, 0.1, 0.56);
  const benchRailGeo = new THREE.BoxGeometry(1.85, 0.16, 0.08);
  geometries.push(benchLegGeo, benchPostGeo, benchSeatGeo, benchRailGeo);
  const benchWood = mat(P.woodDark, { flat: true });
  const benchPlank = mat(P.plank, { flat: true });
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(benchLegGeo, benchWood);
    leg.position.set(side * 0.74, 0.23, 0.02);
    const post = new THREE.Mesh(benchPostGeo, benchWood);
    post.position.set(side * 0.74, 0.8, -0.26);
    post.rotation.x = -0.14; // backrest leans back
    bench.add(leg, post);
  }
  const seat = new THREE.Mesh(benchSeatGeo, benchPlank);
  seat.position.set(0, 0.51, 0.02);
  bench.add(seat);
  for (const [ry, rz] of [[0.78, -0.29], [1.0, -0.32]] as Array<[number, number]>) {
    const rail = new THREE.Mesh(benchRailGeo, benchPlank);
    rail.position.set(0, ry, rz);
    rail.rotation.x = -0.14;
    bench.add(rail);
  }

  // Memorial plaque: gold plate on the front of the backrest, facing whoever
  // walks up to the bench. Its own group so the hover glow and the raycast can
  // target just this, and so it reads as a separate thing to click.
  const plaque = new THREE.Group();
  const plaqueGeo = new THREE.BoxGeometry(0.6, 0.22, 0.03);
  const plaqueInsetGeo = new THREE.BoxGeometry(0.48, 0.13, 0.014);
  geometries.push(plaqueGeo, plaqueInsetGeo);
  const plate = new THREE.Mesh(plaqueGeo, mat(P.gold, { flat: true, emissive: 0x2a2210 }));
  plate.position.set(0, 0.995, -0.245);
  plate.rotation.x = -0.14;
  const engraving = new THREE.Mesh(plaqueInsetGeo, mat(P.brass, { flat: true }));
  engraving.position.set(0, 0.995, -0.231);
  engraving.rotation.x = -0.14;
  plaque.add(plate, engraving);
  bench.add(plaque);

  group.add(bench);

  // ===== Blob shadows (trees + lanterns + bench) =====
  const shadowGeo = new THREE.CircleGeometry(1, 14);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x1c3020,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  });
  const shadowSpots: Array<[number, number, number]> = [
    ...TREE_SPOTS.map(([x, z]) => [x, z, 1.5] as [number, number, number]),
    ...LANTERN_SPOTS.map(([x, z]) => [x, z, 0.35] as [number, number, number]),
    [BENCH.x, BENCH.z, 1.0],
  ];
  const shadows = new THREE.InstancedMesh(shadowGeo, shadowMat, shadowSpots.length);
  shadowSpots.forEach(([x, z, r], i) => {
    dummy.position.set(x, terrainHeight(x, z) + 0.04, z);
    dummy.quaternion.setFromUnitVectors(up, terrainNormal(x, z));
    dummy.scale.setScalar(r);
    dummy.updateMatrix();
    shadows.setMatrixAt(i, dummy.matrix);
  });
  shadows.renderOrder = 1;
  group.add(shadows);
  geometries.push(shadowGeo);
  materials.push(shadowMat);
  instanced.push(shadows);

  return {
    group,
    plaque,
    update(t) {
      // Lantern glow pulse, offset per lantern so they don't blink in sync.
      lanternGlows.forEach((glow, i) => {
        glow.scale.setScalar(1 + 0.06 * Math.sin(t * 1.4 + i * 1.7));
      });
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const im of instanced) im.dispose();
    },
  };
}
