import * as THREE from "three";
import { P, mat } from "../palette";
import { rng } from "../util";
import { addPottedPlant, makeAdd } from "./kit";
import { addCloudClusters, addHill, addTree, cloudMaterial } from "./scenery";
import type { Collider, Interior } from "./types";

// Inside the greenhouse: what the glass promises from outside. A wide-fronted
// glasshouse entered through an opening in the long (+z) wall — the same face
// the door sits on outside — with the ridge running left-to-right across that
// front. Two small raised beds hold neat rows of flowers running the width of
// the house, one behind the other, low enough and short enough to walk around.
// The walls are glass, so the island meadow and sky show through all around.

const W = 8.6; // room width (x): the wide front the door sits on
const D = 5.4; // room depth (z)
const WALL_H = 2.7;
const RIDGE_H = 3.9;
const DOOR_HALF = 0.9; // half-width of the doorway gap in the front wall

export function buildGreenhouseRoom(): Interior {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const instanced: THREE.InstancedMesh[] = [];
  const materials: THREE.Material[] = [];
  const add = makeAdd(group, geometries);

  // Deck.
  add(new THREE.BoxGeometry(W + 0.6, 0.16, D + 0.6), mat(P.plank, { flat: true }), 0, -0.08, 0);

  // Brass frame. The wall mullions are spaced so the doorway gap in the front
  // stays clear — corner posts plus one mullion each side of the door, giving
  // two glass panels on each side and nothing down the middle — with eave beams,
  // a ridge along x (parallel to the front), and rafter pairs down to each eave.
  const MULLION_X = 2.6; // the mullion each side of the door
  const postGeo = new THREE.BoxGeometry(0.1, WALL_H, 0.1);
  geometries.push(postGeo);
  const postXs = [-W / 2, -MULLION_X, MULLION_X, W / 2];
  for (const sz of [-1, 1]) {
    for (const px of postXs) {
      const post = new THREE.Mesh(postGeo, mat(P.brass));
      post.position.set(px, WALL_H / 2, (sz * D) / 2);
      group.add(post);
    }
    add(new THREE.BoxGeometry(W, 0.1, 0.1), mat(P.brass), 0, WALL_H, (sz * D) / 2); // eave beam
  }
  for (const sx of [-1, 1]) {
    add(new THREE.BoxGeometry(0.1, 0.1, D), mat(P.brass), (sx * W) / 2, WALL_H, 0); // side top beam
  }
  add(new THREE.BoxGeometry(W, 0.12, 0.12), mat(P.brass), 0, RIDGE_H, 0); // ridge along x

  const rafterLen = Math.hypot(D / 2, RIDGE_H - WALL_H);
  const rafterGeo = new THREE.BoxGeometry(0.08, 0.08, rafterLen);
  geometries.push(rafterGeo);
  const rafterPitch = Math.atan2(RIDGE_H - WALL_H, D / 2);
  const rafterXs = [-W / 2, -MULLION_X, -1.3, 1.3, MULLION_X, W / 2]; // none over the door's centre
  for (const px of rafterXs) {
    for (const sz of [-1, 1]) {
      const rafter = new THREE.Mesh(rafterGeo, mat(P.brass));
      rafter.position.set(px, (WALL_H + RIDGE_H) / 2, (sz * D) / 4);
      rafter.rotation.x = sz * rafterPitch;
      group.add(rafter);
    }
  }

  // Glass: the two side (±x) walls, the back (−z) wall, two front (+z) panes
  // flanking the door gap, the ±x gable triangles, and the two roof planes —
  // all double-sided so they read from within.
  const glassMat = () =>
    mat(P.glassTeal, { transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  const sideGeo = new THREE.PlaneGeometry(D, WALL_H);
  const backGeo = new THREE.PlaneGeometry(W, WALL_H);
  // Two equal panes each side of the door: [DOOR_HALF, MULLION_X] and
  // [MULLION_X, W/2] are both this wide.
  const frontPaneW = MULLION_X - DOOR_HALF;
  const frontGeo = new THREE.PlaneGeometry(frontPaneW, WALL_H);
  geometries.push(sideGeo, backGeo, frontGeo);
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
  for (const px of [DOOR_HALF + frontPaneW / 2, MULLION_X + frontPaneW / 2]) {
    for (const sx of [-1, 1]) {
      const pane = new THREE.Mesh(frontGeo, glassMat());
      pane.position.set(sx * px, WALL_H / 2, D / 2);
      pane.renderOrder = 4;
      group.add(pane);
    }
  }
  const gableGeo = new THREE.BufferGeometry();
  gableGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, WALL_H, -D / 2, 0, WALL_H, D / 2, 0, RIDGE_H, 0], 3),
  );
  gableGeo.computeVertexNormals();
  geometries.push(gableGeo);
  for (const sx of [-1, 1]) {
    const gable = new THREE.Mesh(gableGeo, glassMat());
    gable.position.x = (sx * W) / 2;
    gable.renderOrder = 4;
    group.add(gable);
  }
  const roofGeo = new THREE.BoxGeometry(W, 0.04, rafterLen);
  geometries.push(roofGeo);
  for (const sz of [-1, 1]) {
    const roof = new THREE.Mesh(roofGeo, glassMat());
    roof.position.set(0, (WALL_H + RIDGE_H) / 2, (sz * D) / 4);
    roof.rotation.x = sz * rafterPitch;
    roof.renderOrder = 4;
    group.add(roof);
  }

  // Exit: an open doorway in the front (+z) wall — no door, just a framed gap in
  // the glass onto the meadow. Brass jambs + lintel + threshold, glowing while
  // hovered; an invisible plane across the gap is the click target.
  const jambMat = new THREE.MeshLambertMaterial({ color: P.brass });
  materials.push(jambMat);
  const jambGeo = new THREE.BoxGeometry(0.12, WALL_H, 0.12);
  geometries.push(jambGeo);
  for (const x of [-DOOR_HALF, DOOR_HALF]) {
    const jamb = new THREE.Mesh(jambGeo, jambMat);
    jamb.position.set(x, WALL_H / 2, D / 2);
    group.add(jamb);
  }
  add(new THREE.BoxGeometry(DOOR_HALF * 2 + 0.24, 0.12, 0.14), jambMat, 0, WALL_H - 0.06, D / 2); // lintel
  add(new THREE.BoxGeometry(DOOR_HALF * 2 - 0.02, 0.06, 0.5), mat(P.plank, { flat: true }), 0, 0.02, D / 2 - 0.12); // threshold
  const exitMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
  materials.push(exitMat);
  const exitPlane = new THREE.Mesh(new THREE.PlaneGeometry(DOOR_HALF * 2, WALL_H - 0.1), exitMat);
  geometries.push(exitPlane.geometry);
  exitPlane.position.set(0, (WALL_H - 0.1) / 2, D / 2 - 0.05);
  group.add(exitPlane);

  // Two small raised beds — rows of flowers running down the short axis of the
  // house (along z), one either side of the centre aisle, short enough to walk
  // around the ends. Stems and blossoms are instanced across both beds.
  const bedLen = 3.2; // along z (the short axis)
  const bedWidth = 1.2; // along x
  const bedH = 0.5;
  const bedXs = [-1.6, 1.6];
  const RANKS = 5;
  const colliders: Collider[] = [];
  const longWallGeo = new THREE.BoxGeometry(0.09, bedH, bedLen); // long walls run along z
  const endWallGeo = new THREE.BoxGeometry(bedWidth, bedH, 0.09); // end caps run along x
  const soilGeo = new THREE.BoxGeometry(bedWidth - 0.14, 0.08, bedLen - 0.14);
  geometries.push(longWallGeo, endWallGeo, soilGeo);
  const flowerSpots: Array<{ x: number; z: number; c: number }> = [];
  const rowColors = [P.blossomPink, P.blossomYellow, P.blossomOrange, P.potionBlue];
  bedXs.forEach((bx, bi) => {
    for (const sx of [-1, 1]) {
      const longWall = new THREE.Mesh(longWallGeo, mat(P.wood, { flat: true }));
      longWall.position.set(bx + (sx * bedWidth) / 2, bedH / 2, 0);
      group.add(longWall);
    }
    for (const sz of [-1, 1]) {
      const endWall = new THREE.Mesh(endWallGeo, mat(P.wood, { flat: true }));
      endWall.position.set(bx, bedH / 2, (sz * bedLen) / 2);
      group.add(endWall);
    }
    const soilTop = new THREE.Mesh(soilGeo, mat(P.soil, { flat: true }));
    soilTop.position.set(bx, bedH - 0.05, 0);
    group.add(soilTop);
    // Neat rows down the depth: RANKS ranks along z, two blooms across, one colour per rank.
    for (let rank = 0; rank < RANKS; rank++) {
      const c = rowColors[(bi + rank) % rowColors.length];
      for (const sx of [-1, 1]) {
        flowerSpots.push({
          x: bx + sx * 0.28,
          z: -bedLen / 2 + 0.45 + rank * ((bedLen - 0.9) / (RANKS - 1)),
          c,
        });
      }
    }
    colliders.push({ kind: "rect", minX: bx - bedWidth / 2, maxX: bx + bedWidth / 2, minZ: -bedLen / 2, maxZ: bedLen / 2 });
  });
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

  // Potting bench along the back wall: pots, a watering can, a seed tray.
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
  add(new THREE.CylinderGeometry(0.14, 0.16, 0.26, 10), mat(P.glassTeal, { flat: true }), 1.15, 1.03, -D / 2 + 0.5);
  const spout = add(new THREE.CylinderGeometry(0.02, 0.035, 0.3, 6), mat(P.glassTeal), 1.33, 1.08, -D / 2 + 0.5);
  spout.rotation.z = -0.9;
  add(new THREE.TorusGeometry(0.1, 0.018, 5, 10, Math.PI), mat(P.glassTeal), 1.15, 1.16, -D / 2 + 0.5);

  // Tall potted plants in the back corners; smaller ones flanking the doorway.
  addPottedPlant(group, geometries, -W / 2 + 0.9, 0, -D / 2 + 0.9, 1.6);
  addPottedPlant(group, geometries, W / 2 - 0.9, 0, -D / 2 + 0.9, 1.45);
  addPottedPlant(group, geometries, -DOOR_HALF - 0.6, 0, D / 2 - 0.45, 1.0);
  addPottedPlant(group, geometries, DOOR_HALF + 0.6, 0, D / 2 - 0.45, 1.0);

  // Hanging baskets from the ridge (which runs along x), swaying gently.
  const baskets: THREE.Group[] = [];
  const ropeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.75, 5);
  const basketGeo = new THREE.CylinderGeometry(0.2, 0.13, 0.18, 8);
  const puffGeo = new THREE.IcosahedronGeometry(0.16, 0);
  const dropGeo = new THREE.SphereGeometry(0.05, 6, 5);
  geometries.push(ropeGeo, basketGeo, puffGeo, dropGeo);
  [-3, -1, 1, 3].forEach((bx, i) => {
    const basket = new THREE.Group();
    basket.position.set(bx, RIDGE_H - 0.06, 0);
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

  // A welcome sign hung on two brass chains from the back eave beam, above the
  // potting bench on the far (−z) side and facing the doorway (+z) so it reads
  // as you step in. A parchment card in a wood frame; the lettering is drawn to
  // a canvas in Plus Jakarta Sans — the sandbox body font — and redrawn once
  // that lazily-loaded face is ready. It hangs from a pivot at the beam so it
  // can sway a touch.
  const sign = new THREE.Group();
  sign.position.set(0, WALL_H, -D / 2 + 0.45); // pivot at the back eave beam, above the bench
  const signW = 1.9;
  const signH = 0.5;
  const signFrame = 0.04; // wood frame showing around the parchment card
  const cardW = signW - signFrame * 2;
  const cardH = signH - signFrame * 2;
  const signDrop = 0.55; // chain length from the beam down to the top of the board
  const boardY = -signDrop - signH / 2;

  // Canvas matches the card's aspect exactly so the lettering never stretches.
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 1024;
  signCanvas.height = Math.round(1024 * (cardH / cardW));
  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  signTex.anisotropy = 4;
  const drawSign = () => {
    const c = signCanvas.getContext("2d");
    if (!c) return;
    const fam =
      getComputedStyle(document.body).getPropertyValue("--font-jakarta").trim() || "sans-serif";
    const { width: cw, height: ch } = signCanvas;
    c.fillStyle = "#ead9ae"; // parchment
    c.fillRect(0, 0, cw, ch);
    c.strokeStyle = "#b79a63";
    c.lineWidth = 4;
    c.strokeRect(14, 14, cw - 28, ch - 28);
    c.fillStyle = "#5a3a22"; // warm ink
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = `700 46px ${fam}`;
    c.fillText("Welcome to the greenhouse.", cw / 2, ch * 0.3);
    c.font = `400 34px ${fam}`;
    c.fillText("Everything growing here is something I love.", cw / 2, ch * 0.52);
    c.fillText("Click a flower to explore.", cw / 2, ch * 0.74);
    signTex.needsUpdate = true;
  };
  drawSign();
  if (document.fonts) {
    Promise.all([
      document.fonts.load('700 46px "Plus Jakarta Sans"'),
      document.fonts.load('400 34px "Plus Jakarta Sans"'),
    ]).then(drawSign).catch(() => {});
  }

  const boardGeo = new THREE.BoxGeometry(signW, signH, 0.06);
  const cardGeo = new THREE.PlaneGeometry(cardW, cardH);
  const chainGeo = new THREE.CylinderGeometry(0.012, 0.012, signDrop, 5);
  geometries.push(boardGeo, cardGeo, chainGeo);
  const cardMat = new THREE.MeshBasicMaterial({ map: signTex });
  materials.push(cardMat);
  const board = new THREE.Mesh(boardGeo, mat(P.wood, { flat: true }));
  board.position.y = boardY;
  sign.add(board);
  for (const sz of [1, -1]) {
    // Card faces are basic-mapped so the ink reads crisp regardless of the light.
    const card = new THREE.Mesh(cardGeo, cardMat);
    card.position.set(0, boardY, sz * 0.031);
    card.rotation.y = sz === 1 ? 0 : Math.PI; // front reads from the door, back from within
    sign.add(card);
  }
  for (const cx of [-0.78, 0.78]) {
    const chain = new THREE.Mesh(chainGeo, mat(P.brass));
    chain.position.set(cx, -signDrop / 2, 0);
    sign.add(chain);
  }
  group.add(sign);

  // The world outside the glass: the island landscape, matching the meadow you
  // stand on out there — rolling green ground, low hills, scattered trees, and
  // cloud banks in the sky, so the view through the panes reads as the island.
  add(new THREE.CircleGeometry(80, 36).rotateX(-Math.PI / 2), mat(P.meadow), 0, -0.18, 0);
  addHill(group, geometries, -34, -0.18, -20, 14, 6, P.meadowDark);
  addHill(group, geometries, 40, -0.18, 12, 12, 5, P.meadowDark);
  addHill(group, geometries, 22, -0.18, -34, 16, 8, P.meadowDark);

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
  for (const [sx, sz, s] of [[-6.4, -2, 1], [6.6, 1.5, 1.2], [-6, 4.5, 0.8], [6.2, -4.4, 0.9], [-5.2, -6, 1.1], [5.6, 6.4, 1]]) {
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
      { kind: "circle", x: -W / 2 + 0.9, z: -D / 2 + 0.9, r: 0.4 },
      { kind: "circle", x: W / 2 - 0.9, z: -D / 2 + 0.9, r: 0.4 },
      { kind: "circle", x: -DOOR_HALF - 0.6, z: D / 2 - 0.45, r: 0.3 },
      { kind: "circle", x: DOOR_HALF + 0.6, z: D / 2 - 0.45, r: 0.3 },
    ],
    floorY: 0,
    spawn: { x: 0, z: D / 2 - 0.6, yaw: 0 },
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
      sign.rotation.z = Math.sin(t * 0.7) * 0.015;
      sign.rotation.x = Math.cos(t * 0.5) * 0.012;
    },
    dispose() {
      signTex.dispose();
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const im of instanced) im.dispose();
    },
  };
}
