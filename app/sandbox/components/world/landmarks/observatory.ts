import * as THREE from "three";
import { P, mat } from "../palette";
import { terrainHeight } from "../terrain";
import type { WorldModule } from "../types";

// Glass-domed observatory on the hilltop: stone drum, brass meridian ribs,
// telescope poking through a roof slit, vine ring + planters for the
// solarpunk dressing.
export function buildObservatory(x: number, z: number): WorldModule {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const y = terrainHeight(x, z);
  group.position.set(x, y, z);

  const add = (geo: THREE.BufferGeometry, material: THREE.Material, px: number, py: number, pz: number) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(px, py, pz);
    group.add(mesh);
    geometries.push(geo);
    return mesh;
  };

  // Stone drum + glass dome. Both are camera/hover solids: the orbit camera
  // pulls in front of them instead of clipping inside.
  const drum = add(new THREE.CylinderGeometry(3.2, 3.6, 2.6, 14), mat(P.stone, { flat: true }), 0, 1.3, 0);
  drum.userData.occluder = true;
  const dome = add(
    new THREE.SphereGeometry(3.05, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(P.glassTeal, { transparent: true, opacity: 0.42, depthWrite: false }),
    0, 2.6, 0,
  );
  dome.renderOrder = 2;
  dome.userData.occluder = true;

  // Brass meridian ribs — half-tori draped over the dome.
  const ribGeo = new THREE.TorusGeometry(3.08, 0.06, 6, 24, Math.PI);
  geometries.push(ribGeo);
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(ribGeo, mat(P.brass));
    rib.position.y = 2.6;
    rib.rotation.y = (i / 3) * Math.PI;
    group.add(rib);
  }
  // Equator ring where dome meets drum.
  add(new THREE.TorusGeometry(3.1, 0.09, 6, 24).rotateX(Math.PI / 2), mat(P.brass), 0, 2.62, 0);

  // Roof slit + telescope aimed through it at the sky.
  const slit = add(new THREE.BoxGeometry(0.55, 2.6, 0.4), mat(P.brassBright), 0, 4.6, 1.4);
  slit.rotation.x = -0.55;
  const scope = add(new THREE.CylinderGeometry(0.26, 0.42, 3.2, 10), mat(P.brass), 0, 4.9, 1.5);
  scope.rotation.x = 0.9;
  const lens = add(new THREE.SphereGeometry(0.3, 10, 8), mat(P.glassTeal, { transparent: true, opacity: 0.7 }), 0, 5.6, 2.6);
  lens.renderOrder = 2;

  // Arched door + steps down the south face.
  add(new THREE.BoxGeometry(1.1, 1.6, 0.24), mat(P.woodDark, { flat: true }), 0, 0.8, 3.32);
  add(new THREE.TorusGeometry(0.55, 0.1, 6, 12, Math.PI), mat(P.brass), 0, 1.6, 3.34);
  for (let i = 0; i < 4; i++) {
    add(new THREE.BoxGeometry(1.6 + i * 0.3, 0.18, 0.55), mat(P.stone, { flat: true }), 0, -0.05 - i * 0.18, 3.7 + i * 0.5);
  }

  // Dressing: vine ring around the base, two planters with bushes.
  add(new THREE.TorusGeometry(3.5, 0.14, 6, 20).rotateX(Math.PI / 2), mat(P.moss), 0, 0.35, 0);
  for (const side of [-1, 1]) {
    add(new THREE.BoxGeometry(0.9, 0.4, 0.45), mat(P.wood, { flat: true }), side * 2.4, 0.2, 2.6);
    add(new THREE.IcosahedronGeometry(0.32, 0), mat(P.canopyLight, { flat: true }), side * 2.4 - 0.18, 0.55, 2.6);
    add(new THREE.IcosahedronGeometry(0.26, 0), mat(P.canopy, { flat: true }), side * 2.4 + 0.2, 0.5, 2.6);
  }

  // Blob shadow.
  const shadow = add(
    new THREE.CircleGeometry(4.1, 20).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x1c3020, transparent: true, opacity: 0.14, depthWrite: false }),
    0, 0.05, 0,
  );
  shadow.renderOrder = 1;

  return {
    group,
    dispose() {
      for (const g of geometries) g.dispose();
      (shadow.material as THREE.Material).dispose();
    },
  };
}
