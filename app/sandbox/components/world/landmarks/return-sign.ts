import * as THREE from "three";
import { P, mat } from "../palette";
import { terrainHeight } from "../terrain";
import type { WorldModule } from "../types";

// The return sign: two weathered boards on posts pointing off-island, with
// sunflowers at the base. The wording lives in the DOM label chip, which is
// also the accessible link home.
export function buildReturnSign(x: number, z: number, rotationY: number): WorldModule {
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

  // Posts.
  add(new THREE.CylinderGeometry(0.07, 0.1, 1.8, 7), mat(P.woodDark, { flat: true }), -0.35, 0.9, 0);
  add(new THREE.CylinderGeometry(0.07, 0.1, 1.55, 7), mat(P.woodDark, { flat: true }), 0.42, 0.78, 0.04);

  // Boards with arrow tips pointing left (off-island, toward the server room).
  for (const [by, tilt] of [
    [1.42, 0.07], [0.98, -0.05],
  ] as Array<[number, number]>) {
    const board = add(new THREE.BoxGeometry(1.7, 0.4, 0.07), mat(P.plank, { flat: true }), 0, by, 0.08);
    board.rotation.z = tilt;
    const tip = add(new THREE.BoxGeometry(0.3, 0.3, 0.07), mat(P.plank, { flat: true }), -0.9, by, 0.08);
    tip.rotation.z = Math.PI / 4 + tilt;
    // Brass tacks.
    for (const tx of [-0.7, 0.7]) {
      add(new THREE.SphereGeometry(0.035, 6, 5), mat(P.brassBright), tx, by + tilt * tx, 0.13);
    }
  }

  // Sunflowers at the base.
  const stemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.8, 5);
  const petalGeo = new THREE.SphereGeometry(0.14, 8, 6);
  const faceGeo = new THREE.SphereGeometry(0.07, 6, 5);
  geometries.push(stemGeo, petalGeo, faceGeo);
  for (const [fx, fz, s] of [
    [-0.8, 0.35, 1], [0.75, 0.3, 0.85], [0.2, 0.5, 0.7],
  ] as Array<[number, number, number]>) {
    const stem = new THREE.Mesh(stemGeo, mat(P.moss));
    stem.position.set(fx, 0.4 * s, fz);
    stem.scale.setScalar(s);
    const petals = new THREE.Mesh(petalGeo, mat(P.blossomYellow));
    petals.position.set(fx, 0.85 * s, fz);
    petals.scale.setScalar(s);
    const face = new THREE.Mesh(faceGeo, mat(P.woodDark));
    face.position.set(fx, 0.85 * s, fz + 0.1 * s);
    face.scale.setScalar(s);
    group.add(stem, petals, face);
  }

  // Blob shadow.
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1c3020, transparent: true, opacity: 0.14, depthWrite: false });
  const shadow = add(new THREE.CircleGeometry(1.2, 14).rotateX(-Math.PI / 2), shadowMat, 0, 0.04, 0.2);
  shadow.renderOrder = 1;

  return {
    group,
    dispose() {
      for (const g of geometries) g.dispose();
      shadowMat.dispose();
    },
  };
}
