import * as THREE from "three";
import { P, mat } from "../palette";
import { terrainHeight } from "../terrain";
import type { WorldModule } from "../types";

// Garden of Preferences: a brass-framed glasshouse with visible planter rows,
// a gabled glass roof, and a small solar strip on the ridge.
export function buildGreenhouse(x: number, z: number, rotationY: number): WorldModule {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const y = terrainHeight(x, z);
  group.position.set(x, y, z);
  group.rotation.y = rotationY;

  const add = (geo: THREE.BufferGeometry, material: THREE.Material, px: number, py: number, pz: number) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(px, py, pz);
    group.add(mesh);
    geometries.push(geo);
    return mesh;
  };

  const W = 4.6; // along local x
  const D = 3.2; // along local z
  const H = 2.0; // wall height
  const RIDGE = 3.1; // ridge height

  // Wood deck.
  add(new THREE.BoxGeometry(W + 0.4, 0.35, D + 0.4), mat(P.plank, { flat: true }), 0, 0.18, 0);

  // Brass frame: corner posts, top beams, ridge beam.
  const postGeo = new THREE.BoxGeometry(0.09, H, 0.09);
  const beamXGeo = new THREE.BoxGeometry(W, 0.09, 0.09);
  const beamZGeo = new THREE.BoxGeometry(0.09, 0.09, D);
  const ridgeGeo = new THREE.BoxGeometry(W, 0.1, 0.1);
  geometries.push(postGeo, beamXGeo, beamZGeo, ridgeGeo);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = new THREE.Mesh(postGeo, mat(P.brass));
      post.position.set((sx * W) / 2, 0.35 + H / 2, (sz * D) / 2);
      group.add(post);
    }
    const beamZ = new THREE.Mesh(beamZGeo, mat(P.brass));
    beamZ.position.set((sx * W) / 2, 0.35 + H, 0);
    group.add(beamZ);
  }
  for (const sz of [-1, 1]) {
    const beamX = new THREE.Mesh(beamXGeo, mat(P.brass));
    beamX.position.set(0, 0.35 + H, (sz * D) / 2);
    group.add(beamX);
  }
  const ridge = new THREE.Mesh(ridgeGeo, mat(P.brass));
  ridge.position.set(0, 0.35 + RIDGE, 0);
  group.add(ridge);

  // Solar strip along the ridge.
  add(new THREE.BoxGeometry(W * 0.7, 0.06, 0.4), mat(P.panelNavy), 0, 0.35 + RIDGE + 0.08, 0);

  // Glass: side walls, back wall, two front panes flanking the door gap, and
  // two roof planes meeting at the ridge.
  const glass = () => mat(P.glassTeal, { transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide });
  const sideGeo = new THREE.BoxGeometry(0.05, H, D);
  const backGeo = new THREE.BoxGeometry(W, H, 0.05);
  const frontGeo = new THREE.BoxGeometry(W / 2 - 0.55, H, 0.05);
  geometries.push(sideGeo, backGeo, frontGeo);
  for (const sx of [-1, 1]) {
    const wall = new THREE.Mesh(sideGeo, glass());
    wall.position.set((sx * W) / 2, 0.35 + H / 2, 0);
    wall.renderOrder = 2;
    group.add(wall);
  }
  const back = new THREE.Mesh(backGeo, glass());
  back.position.set(0, 0.35 + H / 2, -D / 2);
  back.renderOrder = 2;
  group.add(back);
  for (const sx of [-1, 1]) {
    const pane = new THREE.Mesh(frontGeo, glass());
    pane.position.set(sx * (W / 4 + 0.28), 0.35 + H / 2, D / 2);
    pane.renderOrder = 2;
    group.add(pane);
  }
  const roofLen = Math.hypot(D / 2, RIDGE - H);
  const roofGeo = new THREE.BoxGeometry(W, 0.05, roofLen);
  geometries.push(roofGeo);
  const roofPitch = Math.atan2(RIDGE - H, D / 2);
  for (const sz of [-1, 1]) {
    const roof = new THREE.Mesh(roofGeo, glass());
    roof.position.set(0, 0.35 + (H + RIDGE) / 2, (sz * D) / 4);
    roof.rotation.x = sz * roofPitch;
    roof.renderOrder = 2;
    group.add(roof);
  }

  // Interior planting, visible through the glass. The roof slopes along z
  // (ridge at z 0, eaves at z ±D/2), so tall plants hug the centre line and
  // low ones can run to the back wall; the front (+z) stays open for the door.
  const bedGeo = new THREE.BoxGeometry(2.4, 0.3, 0.5); // side beds (rotated to run along z)
  const backBedGeo = new THREE.BoxGeometry(3.4, 0.28, 0.44); // low bed along the back wall
  const bushGeo = new THREE.IcosahedronGeometry(0.22, 0);
  const bushBigGeo = new THREE.IcosahedronGeometry(0.3, 0);
  const blossomGeo = new THREE.SphereGeometry(0.08, 6, 5);
  const potGeo = new THREE.CylinderGeometry(0.26, 0.2, 0.42, 8);
  const potStemGeo = new THREE.CylinderGeometry(0.055, 0.075, 1.0, 6);
  const potLeafGeo = new THREE.IcosahedronGeometry(0.34, 0);
  geometries.push(bedGeo, backBedGeo, bushGeo, bushBigGeo, blossomGeo, potGeo, potStemGeo, potLeafGeo);

  const blossomColors = [P.blossomPink, P.blossomOrange, P.blossomYellow];
  const scratch = new THREE.Color();
  const dummy = new THREE.Object3D();
  const bloss: Array<{ x: number; y: number; z: number; c: number }> = [];

  // Two long side beds, each a mixed row of small and larger bushes.
  for (const px of [-1.1, 1.1]) {
    const bed = new THREE.Mesh(bedGeo, mat(P.wood, { flat: true }));
    bed.position.set(px, 0.5, -0.2); // spans z -1.4..1.0
    bed.rotation.y = Math.PI / 2;
    group.add(bed);
    [-1.25, -0.7, -0.15, 0.4, 0.9].forEach((pz, i) => {
      const bush = new THREE.Mesh(i % 2 ? bushBigGeo : bushGeo, mat(i % 2 ? P.canopyLight : P.canopy, { flat: true }));
      bush.position.set(px + (i % 2 ? 0.05 : -0.05), 0.77, pz);
      group.add(bush);
      bloss.push({ x: px + (i % 2 ? 0.16 : -0.14), y: 0.92, z: pz, c: blossomColors[i % 3] });
      bloss.push({ x: px + (i % 2 ? -0.12 : 0.15), y: 0.86, z: pz + 0.12, c: blossomColors[(i + 1) % 3] });
    });
  }

  // Low bed of leafy bushes along the back wall, filling the rear.
  const backBed = new THREE.Mesh(backBedGeo, mat(P.wood, { flat: true }));
  backBed.position.set(0, 0.49, -1.4);
  group.add(backBed);
  for (const bx of [-1.35, -0.8, -0.25, 0.3, 0.85, 1.4]) {
    const bush = new THREE.Mesh(bushGeo, mat(P.canopy, { flat: true }));
    bush.position.set(bx, 0.72, -1.4);
    group.add(bush);
    if (Math.abs(bx) < 1.2) bloss.push({ x: bx, y: 0.84, z: -1.32, c: blossomColors[bx > 0 ? 1 : 2] });
  }

  // A pair of taller potted plants near the centre where the roof is highest,
  // so the house has some vertical fill instead of only knee-high rows.
  for (const px of [-0.5, 0.55]) {
    const pot = new THREE.Mesh(potGeo, mat(P.wood, { flat: true }));
    pot.position.set(px, 0.56, -0.95);
    group.add(pot);
    const stem = new THREE.Mesh(potStemGeo, mat(P.canopyDark, { flat: true }));
    stem.position.set(px, 1.27, -0.95); // 0.77..1.77
    group.add(stem);
    const puffs: Array<[number, number, number, number]> = [
      [-0.1, 1.75, -0.95, P.canopy],
      [0.14, 1.9, -0.9, P.canopyLight],
      [0.02, 2.02, -1.02, P.canopy],
    ];
    for (const [ox, py, pz, c] of puffs) {
      const leaf = new THREE.Mesh(potLeafGeo, mat(c, { flat: true }));
      leaf.position.set(px + ox, py, pz);
      group.add(leaf);
    }
  }

  const blossoms = new THREE.InstancedMesh(blossomGeo, mat(0xffffff), bloss.length);
  bloss.forEach((p, i) => {
    dummy.position.set(p.x, p.y, p.z);
    dummy.updateMatrix();
    blossoms.setMatrixAt(i, dummy.matrix);
    blossoms.setColorAt(i, scratch.setHex(p.c));
  });
  group.add(blossoms);

  // Lantern by the door. (No gable vines: at this scale they poked straight
  // through the glass roof and read as stray green sticks.)
  add(new THREE.CylinderGeometry(0.05, 0.07, 1.2, 6), mat(P.woodDark), W / 2 + 0.5, 0.6, D / 2 + 0.4);
  add(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshBasicMaterial({ color: P.lanternGlow }), W / 2 + 0.5, 1.15, D / 2 + 0.4);

  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1c3020, transparent: true, opacity: 0.14, depthWrite: false });

  // Trees and big leafy plants bracketing the house. Placed in local space but
  // grounded on the real terrain height at each rotated world position, so they
  // sit on the slope instead of floating off the deck's flat pad. The front
  // (+z, door side) is left open.
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  const groundY = (lx: number, lz: number) => terrainHeight(x + lx * cos + lz * sin, z - lx * sin + lz * cos) - y;

  const trunkGeo = new THREE.CylinderGeometry(0.13, 0.2, 1.2, 7);
  const treeLeafGeo = new THREE.IcosahedronGeometry(0.62, 1);
  const shrubGeo = new THREE.IcosahedronGeometry(0.5, 0);
  const treeShadowGeo = new THREE.CircleGeometry(0.75, 16).rotateX(-Math.PI / 2);
  geometries.push(trunkGeo, treeLeafGeo, shrubGeo, treeShadowGeo);

  const treeLeafColors = [P.canopy, P.canopyLight, P.canopyDark];
  // Accent trees, kept smaller than the house and pushed out past the deck so
  // they frame it rather than swallow it. [localX, localZ, scale]
  const trees: Array<[number, number, number]> = [
    [-3.7, -1.5, 1.0],
    [3.8, -0.7, 0.92],
    [3.4, 1.7, 0.78],
  ];
  trees.forEach(([lx, lz, s], ti) => {
    const by = groundY(lx, lz);
    const trunk = new THREE.Mesh(trunkGeo, mat(P.woodDark, { flat: true }));
    trunk.position.set(lx, by + 0.6 * s, lz);
    trunk.scale.setScalar(s);
    group.add(trunk);
    for (let p = 0; p < 3; p++) {
      const leaf = new THREE.Mesh(treeLeafGeo, mat(treeLeafColors[(ti + p) % 3], { flat: true }));
      leaf.position.set(lx + (p - 1) * 0.28 * s, by + (1.15 + p * 0.5) * s, lz + (p % 2 ? 0.24 : -0.2) * s);
      leaf.scale.setScalar((1 - p * 0.2) * s);
      group.add(leaf);
    }
    const sh = new THREE.Mesh(treeShadowGeo, shadowMat);
    sh.position.set(lx, by + 0.03, lz);
    sh.scale.setScalar(s);
    sh.renderOrder = 1;
    group.add(sh);
  });

  // Big two-lobe leafy plants low around the deck edges.
  const shrubs: Array<[number, number]> = [
    [-3.2, 0.6],
    [-2.9, -1.7],
    [3.1, -2.4],
    [3.3, 0.9],
  ];
  shrubs.forEach(([lx, lz], si) => {
    const by = groundY(lx, lz);
    const a = new THREE.Mesh(shrubGeo, mat(si % 2 ? P.canopy : P.canopyLight, { flat: true }));
    a.position.set(lx, by + 0.42, lz);
    group.add(a);
    const b2 = new THREE.Mesh(shrubGeo, mat(si % 2 ? P.canopyLight : P.canopy, { flat: true }));
    b2.position.set(lx + 0.42, by + 0.34, lz + 0.15);
    b2.scale.setScalar(0.8);
    group.add(b2);
  });

  // Blob shadow.
  const shadow = add(new THREE.CircleGeometry(3.3, 18).rotateX(-Math.PI / 2), shadowMat, 0, 0.04, 0);
  shadow.renderOrder = 1;

  return {
    group,
    dispose() {
      for (const g of geometries) g.dispose();
      blossoms.dispose();
      shadowMat.dispose();
    },
  };
}
