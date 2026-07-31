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

  // Interior planter rows visible through the glass.
  const planterGeo = new THREE.BoxGeometry(1.6, 0.3, 0.5);
  const bushGeo = new THREE.IcosahedronGeometry(0.22, 0);
  const blossomGeo = new THREE.SphereGeometry(0.08, 6, 5);
  geometries.push(planterGeo, bushGeo, blossomGeo);
  const blossomColors = [P.blossomPink, P.blossomOrange, P.blossomYellow];
  const scratch = new THREE.Color();
  const blossoms = new THREE.InstancedMesh(blossomGeo, mat(0xffffff), 14);
  const dummy = new THREE.Object3D();
  let b = 0;
  for (const px of [-1.1, 1.1]) {
    const planter = new THREE.Mesh(planterGeo, mat(P.wood, { flat: true }));
    planter.position.set(px, 0.5, -0.4);
    planter.rotation.y = Math.PI / 2;
    group.add(planter);
    for (let i = 0; i < 3; i++) {
      const bush = new THREE.Mesh(bushGeo, mat(i % 2 ? P.canopyLight : P.canopy, { flat: true }));
      bush.position.set(px, 0.75, -1 + i * 0.6);
      group.add(bush);
    }
    for (let i = 0; i < 7 && b < 14; i++, b++) {
      dummy.position.set(px + (i % 2 ? 0.14 : -0.14), 0.86, -1.1 + i * 0.32);
      dummy.updateMatrix();
      blossoms.setMatrixAt(b, dummy.matrix);
      blossoms.setColorAt(b, scratch.setHex(blossomColors[b % 3]));
    }
  }
  group.add(blossoms);

  // Vines draped over one gable + a lantern by the door.
  const vineGeo = new THREE.CapsuleGeometry(0.05, 0.7, 3, 6);
  geometries.push(vineGeo);
  for (let i = 0; i < 4; i++) {
    const vine = new THREE.Mesh(vineGeo, mat(P.canopyDark));
    vine.position.set(-W / 2 + 0.1, 0.35 + H + 0.4 - i * 0.12, -D / 2 + 0.5 + i * 0.7);
    vine.rotation.z = 0.35 + i * 0.1;
    group.add(vine);
  }
  add(new THREE.CylinderGeometry(0.05, 0.07, 1.2, 6), mat(P.woodDark), W / 2 + 0.5, 0.6, D / 2 + 0.4);
  add(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshBasicMaterial({ color: P.lanternGlow }), W / 2 + 0.5, 1.15, D / 2 + 0.4);

  // Blob shadow.
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1c3020, transparent: true, opacity: 0.14, depthWrite: false });
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
