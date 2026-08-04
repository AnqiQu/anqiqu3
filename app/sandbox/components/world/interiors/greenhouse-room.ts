import * as THREE from "three";
import { P, mat } from "../palette";
import { rng } from "../util";
import { addPottedPlant, makeAdd } from "./kit";
import { addCloudClusters, addHill, addTree, cloudMaterial } from "./scenery";
import type { Collider, Interior } from "./types";

// Inside the greenhouse: what the glass promises from outside. Raised wooden
// beds in neat rows of flowers, a centre aisle of warm planks, tall potted
// plants where the roof is highest, hanging baskets swaying from the ridge,
// and daylight everywhere — the walls are glass, so the meadow and sky show
// through all around.

const W = 7; // room width (x)
const D = 10; // room depth (z); the door is at +z
const WALL_H = 2.7;
const RIDGE_H = 4.1;

export function buildGreenhouseRoom(): Interior {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const instanced: THREE.InstancedMesh[] = [];
  const materials: THREE.Material[] = [];
  const add = makeAdd(group, geometries);

  // Deck and centre aisle.
  add(new THREE.BoxGeometry(W + 0.6, 0.16, D + 0.6), mat(P.plank, { flat: true }), 0, -0.08, 0);
  const aisle = add(new THREE.BoxGeometry(1.5, 0.03, D + 0.2), mat(P.path, { flat: true }), 0, 0.005, 0);
  aisle.renderOrder = 1;

  // Brass frame: corner + mid posts, eave beams, ridge, and rafter pairs.
  const postGeo = new THREE.BoxGeometry(0.1, WALL_H, 0.1);
  geometries.push(postGeo);
  for (const sx of [-1, 1]) {
    for (const pz of [-D / 2, -D / 4, 0, D / 4, D / 2]) {
      const post = new THREE.Mesh(postGeo, mat(P.brass));
      post.position.set((sx * W) / 2, WALL_H / 2, pz);
      group.add(post);
    }
    add(new THREE.BoxGeometry(0.1, 0.1, D), mat(P.brass), (sx * W) / 2, WALL_H, 0);
  }
  add(new THREE.BoxGeometry(0.12, 0.12, D), mat(P.brass), 0, RIDGE_H, 0);
  const rafterLen = Math.hypot(W / 2, RIDGE_H - WALL_H);
  const rafterGeo = new THREE.BoxGeometry(rafterLen, 0.08, 0.08);
  geometries.push(rafterGeo);
  const rafterPitch = Math.atan2(RIDGE_H - WALL_H, W / 2);
  for (const pz of [-D / 2, -D / 4, 0, D / 4, D / 2]) {
    for (const sx of [-1, 1]) {
      const rafter = new THREE.Mesh(rafterGeo, mat(P.brass));
      rafter.position.set((sx * W) / 4, (WALL_H + RIDGE_H) / 2, pz);
      rafter.rotation.z = -sx * rafterPitch;
      group.add(rafter);
    }
  }

  // Glass: side and end walls plus the two roof planes, all double-sided so
  // they read from within. The world outside is scene dressing further down.
  const glassMat = () =>
    mat(P.glassTeal, { transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  const sideGeo = new THREE.PlaneGeometry(D, WALL_H);
  const backGeo = new THREE.PlaneGeometry(W, WALL_H);
  const frontGeo = new THREE.PlaneGeometry(W / 2 - 0.75, WALL_H);
  const gableGeo = new THREE.BufferGeometry();
  gableGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [-W / 2, WALL_H, 0, W / 2, WALL_H, 0, 0, RIDGE_H, 0],
      3,
    ),
  );
  gableGeo.computeVertexNormals();
  geometries.push(sideGeo, backGeo, frontGeo, gableGeo);
  for (const sx of [-1, 1]) {
    const wall = new THREE.Mesh(sideGeo, glassMat());
    wall.position.set((sx * W) / 2, WALL_H / 2, 0);
    wall.rotation.y = (sx * Math.PI) / 2;
    wall.renderOrder = 4;
    group.add(wall);
  }
  const back = new THREE.Mesh(backGeo, glassMat());
  back.position.set(0, WALL_H / 2, -D / 2);
  back.renderOrder = 4;
  group.add(back);
  for (const sx of [-1, 1]) {
    const pane = new THREE.Mesh(frontGeo, glassMat());
    pane.position.set(sx * (W / 4 + 0.38), WALL_H / 2, D / 2);
    pane.rotation.y = Math.PI;
    pane.renderOrder = 4;
    group.add(pane);
  }
  for (const sz of [-1, 1]) {
    const gable = new THREE.Mesh(gableGeo, glassMat());
    gable.position.z = (sz * D) / 2;
    gable.renderOrder = 4;
    group.add(gable);
  }
  const roofGeo = new THREE.BoxGeometry(rafterLen, 0.04, D);
  geometries.push(roofGeo);
  for (const sx of [-1, 1]) {
    const roof = new THREE.Mesh(roofGeo, glassMat());
    roof.position.set((sx * W) / 4, (WALL_H + RIDGE_H) / 2, 0);
    roof.rotation.z = -sx * rafterPitch;
    roof.renderOrder = 4;
    group.add(roof);
  }

  // Exit: an open doorway in the front (+z) wall — no door, just a framed gap in
  // the glass onto the meadow. The brass jambs and lintel glow while it's
  // hovered; an invisible plane across the gap is the click target.
  const jambMat = new THREE.MeshLambertMaterial({ color: P.brass });
  materials.push(jambMat);
  const jambGeo = new THREE.BoxGeometry(0.12, WALL_H, 0.12);
  geometries.push(jambGeo);
  for (const x of [-0.85, 0.85]) {
    const jamb = new THREE.Mesh(jambGeo, jambMat);
    jamb.position.set(x, WALL_H / 2, D / 2);
    group.add(jamb);
  }
  add(new THREE.BoxGeometry(1.94, 0.12, 0.14), jambMat, 0, WALL_H - 0.06, D / 2); // lintel
  add(new THREE.BoxGeometry(1.72, 0.06, 0.5), mat(P.plank, { flat: true }), 0, 0.02, D / 2 - 0.12); // threshold
  const exitMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
  materials.push(exitMat);
  const exitPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.7, WALL_H - 0.1), exitMat);
  geometries.push(exitPlane.geometry);
  exitPlane.position.set(0, (WALL_H - 0.1) / 2, D / 2 - 0.05);
  group.add(exitPlane);

  // Raised beds: two columns, three rows, each with neat ranks of flowers.
  // Stems and blossoms are instanced across all beds.
  const bedW = 2.2;
  const bedD = 1.8;
  const bedH = 0.55;
  const bedXs = [-1.95, 1.95];
  const bedZs = [-3.3, -0.6, 2.1];
  const colliders: Collider[] = [];
  const wallGeoX = new THREE.BoxGeometry(bedW, bedH, 0.09);
  const wallGeoZ = new THREE.BoxGeometry(0.09, bedH, bedD);
  const soilGeo = new THREE.BoxGeometry(bedW - 0.14, 0.08, bedD - 0.14);
  geometries.push(wallGeoX, wallGeoZ, soilGeo);
  const flowerSpots: Array<{ x: number; z: number; c: number }> = [];
  const rowColors = [P.blossomPink, P.blossomYellow, P.blossomOrange, P.blossomPink, P.potionBlue, P.blossomYellow];
  let bedIndex = 0;
  for (const bx of bedXs) {
    for (const bz of bedZs) {
      for (const sz of [-1, 1]) {
        const wallX = new THREE.Mesh(wallGeoX, mat(P.wood, { flat: true }));
        wallX.position.set(bx, bedH / 2, bz + (sz * bedD) / 2);
        group.add(wallX);
        const wallZ = new THREE.Mesh(wallGeoZ, mat(P.wood, { flat: true }));
        wallZ.position.set(bx + (sz * bedW) / 2, bedH / 2, bz);
        group.add(wallZ);
      }
      const soilTop = new THREE.Mesh(soilGeo, mat(P.soil, { flat: true }));
      soilTop.position.set(bx, bedH - 0.05, bz);
      group.add(soilTop);
      // Neat rows: 3 ranks along z, 5 flowers per rank, one color per rank.
      for (let row = 0; row < 3; row++) {
        const color = rowColors[(bedIndex + row) % rowColors.length];
        for (let col = 0; col < 5; col++) {
          flowerSpots.push({
            x: bx - bedW / 2 + 0.35 + col * ((bedW - 0.7) / 4),
            z: bz - bedD / 2 + 0.4 + row * ((bedD - 0.8) / 2),
            c: color,
          });
        }
      }
      colliders.push({
        kind: "rect",
        minX: bx - bedW / 2, maxX: bx + bedW / 2,
        minZ: bz - bedD / 2, maxZ: bz + bedD / 2,
      });
      bedIndex++;
    }
  }
  const stemGeo = new THREE.CylinderGeometry(0.014, 0.02, 0.34, 5);
  const bloomGeo = new THREE.SphereGeometry(0.075, 7, 6);
  geometries.push(stemGeo, bloomGeo);
  const stems = new THREE.InstancedMesh(stemGeo, mat(P.canopyDark), flowerSpots.length);
  const blooms = new THREE.InstancedMesh(bloomGeo, mat(0xffffff), flowerSpots.length);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const rand = rng(2026);
  flowerSpots.forEach((f, i) => {
    const h = 0.9 + rand() * 0.25;
    dummy.position.set(f.x, bedH + 0.15 * h, f.z);
    dummy.scale.set(1, h, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);
    dummy.position.set(f.x, bedH + 0.32 * h, f.z);
    dummy.scale.setScalar(0.9 + rand() * 0.3);
    dummy.updateMatrix();
    blooms.setMatrixAt(i, dummy.matrix);
    blooms.setColorAt(i, color.setHex(f.c));
  });
  group.add(stems, blooms);
  instanced.push(stems, blooms);

  // Potting bench along the back wall: pots, a watering can, seed trays.
  add(new THREE.BoxGeometry(3.4, 0.09, 0.8), mat(P.wood, { flat: true }), 0, 0.85, -D / 2 + 0.55);
  const benchLegGeo = new THREE.BoxGeometry(0.09, 0.82, 0.09);
  geometries.push(benchLegGeo);
  for (const [lx, lz] of [[-1.55, 0.25], [1.55, 0.25], [-1.55, 0.85], [1.55, 0.85]]) {
    const leg = new THREE.Mesh(benchLegGeo, mat(P.woodDark));
    leg.position.set(lx, 0.41, -D / 2 + lz);
    group.add(leg);
  }
  const potGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.18, 8);
  geometries.push(potGeo);
  for (const px of [-1.2, -0.9, -0.6]) {
    const pot = new THREE.Mesh(potGeo, mat(P.wood, { flat: true }));
    pot.position.set(px, 0.99, -D / 2 + 0.5);
    group.add(pot);
  }
  add(new THREE.BoxGeometry(0.6, 0.07, 0.4), mat(P.woodDark, { flat: true }), 0.35, 0.94, -D / 2 + 0.5);
  // Watering can: body, spout, arched handle.
  add(new THREE.CylinderGeometry(0.14, 0.16, 0.26, 10), mat(P.glassTeal, { flat: true }), 1.15, 1.03, -D / 2 + 0.5);
  const spout = add(new THREE.CylinderGeometry(0.02, 0.035, 0.3, 6), mat(P.glassTeal), 1.33, 1.08, -D / 2 + 0.5);
  spout.rotation.z = -0.9;
  add(new THREE.TorusGeometry(0.1, 0.018, 5, 10, Math.PI), mat(P.glassTeal), 1.15, 1.16, -D / 2 + 0.5);

  // Tall potted plants under the ridge, and small ones by the door.
  addPottedPlant(group, geometries, -0.95, 0, -4.15, 1.7);
  addPottedPlant(group, geometries, 0.95, 0, -4.2, 1.45);
  addPottedPlant(group, geometries, -1.05, 0, 4.35, 1.1);
  addPottedPlant(group, geometries, 1.05, 0, 4.35, 1.1);

  // Hanging baskets from the ridge, swaying gently.
  const baskets: THREE.Group[] = [];
  const ropeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.75, 5);
  const basketGeo = new THREE.CylinderGeometry(0.2, 0.13, 0.18, 8);
  const puffGeo = new THREE.IcosahedronGeometry(0.16, 0);
  const dropGeo = new THREE.SphereGeometry(0.05, 6, 5);
  geometries.push(ropeGeo, basketGeo, puffGeo, dropGeo);
  [-3.2, -1.1, 1.1, 3.2].forEach((bz, i) => {
    const basket = new THREE.Group();
    basket.position.set(0, RIDGE_H - 0.06, bz);
    const rope = new THREE.Mesh(ropeGeo, mat(P.wood));
    rope.position.y = -0.38;
    const bowl = new THREE.Mesh(basketGeo, mat(P.woodDark, { flat: true }));
    bowl.position.y = -0.8;
    const puff = new THREE.Mesh(puffGeo, mat(i % 2 ? P.canopyLight : P.canopy, { flat: true }));
    puff.position.y = -0.68;
    const drop = new THREE.Mesh(dropGeo, mat(i % 2 ? P.blossomPink : P.blossomOrange));
    drop.position.set(0.16, -0.85, 0.06);
    basket.add(rope, bowl, puff, drop);
    basket.userData.phase = i * 1.7;
    group.add(basket);
    baskets.push(basket);
  });

  // The world outside the glass: the island landscape, matching the meadow you
  // stand on out there — rolling green ground, low hills, scattered trees, and
  // cloud banks in the sky, so the view through the panes reads as the island.
  add(new THREE.CircleGeometry(80, 36).rotateX(-Math.PI / 2), mat(P.meadow), 0, -0.18, 0);
  // Low hills for relief; the far one wears a hint of the observatory dome.
  addHill(group, geometries, -34, -0.18, -20, 14, 6, P.meadowDark);
  addHill(group, geometries, 40, -0.18, 12, 12, 5, P.meadowDark);
  addHill(group, geometries, 22, -0.18, -34, 16, 8, P.meadowDark);
  add(new THREE.SphereGeometry(2.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(P.glassTeal, { transparent: true, opacity: 0.5 }), 22, 7.2, -34);
  add(new THREE.CylinderGeometry(2.4, 2.6, 1.4, 14), mat(P.stonePale, { flat: true }), 22, 6.2, -34);

  const cloudMat = cloudMaterial(materials);
  addCloudClusters(group, geometries, cloudMat, [
    [-26, 9, -20, 3.4], [24, 11, -26, 4], [30, 8, 14, 3], [-22, 10, 22, 3.6], [6, 13, -40, 4.6], [-40, 12, 8, 4],
  ]);

  // Trees ringing the greenhouse, beyond the glass. Deterministic scatter.
  const treeSpots: Array<[number, number, number]> = [
    [-7, -3, 1.2], [8, 2, 1.1], [-6.5, 5, 1], [7.5, -5, 1.3], [-3, -9, 1.1], [4, 9, 1.2],
    [-12, 1, 1.4], [13, -2, 1.3], [-10, -8, 1.2], [11, 7, 1.1], [0, -14, 1.5], [-16, 9, 1.3], [17, 4, 1.4],
  ];
  treeSpots.forEach(([tx, tz, ts], i) => addTree(group, geometries, tx, -0.1, tz, ts, 100 + i));

  // A handful of shrubs just outside the glass so the near ground isn't bare.
  const shrubGeo = new THREE.IcosahedronGeometry(0.55, 0);
  geometries.push(shrubGeo);
  for (const [sx, sz, s] of [[-5.4, -2, 1], [5.6, 1.5, 1.2], [-5, 4.5, 0.8], [5.2, -4.4, 0.9], [-4.2, -6, 1.1], [4.6, 6.4, 1]]) {
    const shrub = new THREE.Mesh(shrubGeo, mat(P.canopy, { flat: true }));
    shrub.position.set(sx, 0.25 * s, sz);
    shrub.scale.setScalar(s);
    group.add(shrub);
  }

  // Daylight: bright and even, with a warm sun slant.
  const hemi = new THREE.HemisphereLight(0xdff2ff, 0x9bc27a, 1.5);
  const sun = new THREE.DirectionalLight(0xfff0c0, 1.6);
  sun.position.set(14, 22, 8);
  group.add(hemi, sun);

  return {
    group,
    bounds: { kind: "rect", minX: -W / 2 + 0.35, maxX: W / 2 - 0.35, minZ: -D / 2 + 0.35, maxZ: D / 2 - 0.35 },
    colliders: [
      ...colliders,
      { kind: "rect", minX: -1.75, maxX: 1.75, minZ: -D / 2, maxZ: -D / 2 + 0.95 }, // bench
      { kind: "circle", x: -0.95, z: -4.15, r: 0.4 },
      { kind: "circle", x: 0.95, z: -4.2, r: 0.4 },
      { kind: "circle", x: -1.05, z: 4.35, r: 0.3 },
      { kind: "circle", x: 1.05, z: 4.35, r: 0.3 },
    ],
    floorY: 0,
    spawn: { x: 0, z: 3.9, yaw: 0 },
    doorMeshes: [exitPlane],
    doorGlow: [jambMat],
    background: P.skyHorizon,
    fog: { color: P.fog, near: 55, far: 120 },
    update(t) {
      for (const basket of baskets) {
        const phase = basket.userData.phase as number;
        basket.rotation.z = Math.sin(t * 0.9 + phase) * 0.06;
        basket.rotation.x = Math.cos(t * 0.7 + phase) * 0.05;
      }
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const im of instanced) im.dispose();
    },
  };
}
