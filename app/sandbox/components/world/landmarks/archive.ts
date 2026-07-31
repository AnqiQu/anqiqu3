import * as THREE from "three";
import { P, mat } from "../palette";
import { terrainHeight } from "../terrain";
import type { WorldModule } from "../types";

// The Archive: a round green door set into a mossy burrow mound — old ideas
// and memories live inside. The door hangs in a left-edge pivot so it can
// swing open as an ambient flourish.
export function buildArchive(x: number, z: number, rotationY: number): WorldModule {
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

  // Burrow mound sunk into the slope.
  const mound = add(new THREE.SphereGeometry(3.2, 18, 12), mat(P.moss, { flat: true }), 0, 0.1, -1.2);
  mound.scale.set(1.15, 0.62, 1);

  // Flat cut face the door is set into — otherwise the rim reads as a
  // free-standing arc on the mound's curve.
  const face = add(new THREE.CircleGeometry(1.85, 20), mat(P.moss, { flat: true }), 0, 1.0, 1.58);
  face.scale.y = 0.92;

  // The mound's front face sits at z ≈ 1.6 at door height — everything below
  // is placed just proud of that surface so the door reads as set into it.
  // Door recess: a dark disc with a warm glow ring behind the door, so an
  // opened door reads as lamplight from inside.
  add(new THREE.CircleGeometry(1.28, 24), new THREE.MeshBasicMaterial({ color: 0x241a10 }), 0, 1.05, 1.62);
  const glow = add(new THREE.CircleGeometry(1.05, 24), new THREE.MeshBasicMaterial({ color: P.blossomYellow }), 0, 1.05, 1.6);
  glow.visible = false; // revealed when the door opens

  // Round door in a pivot group at its left edge.
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-1.3, 1.05, 1.68);
  const doorGeo = new THREE.CircleGeometry(1.3, 24);
  const door = new THREE.Mesh(doorGeo, mat(P.doorGreen, { side: THREE.DoubleSide }));
  door.position.x = 1.3;
  const knobGeo = new THREE.SphereGeometry(0.09, 8, 6);
  const knob = new THREE.Mesh(knobGeo, mat(P.brass));
  knob.position.set(2.25, 0, 0.06);
  doorPivot.add(door, knob);
  group.add(doorPivot);
  geometries.push(doorGeo, knobGeo);

  // Wood rim + brass porthole above.
  add(new THREE.TorusGeometry(1.32, 0.13, 8, 24), mat(P.woodDark, { flat: true }), 0, 1.05, 1.66);
  add(new THREE.TorusGeometry(0.26, 0.06, 6, 14), mat(P.brass), 0.75, 1.95, 1.28).rotation.x = -0.45;
  const porthole = add(
    new THREE.CircleGeometry(0.24, 14),
    mat(P.glassTeal, { transparent: true, opacity: 0.6 }),
    0.75, 1.95, 1.26,
  );
  porthole.rotation.x = -0.45;
  porthole.renderOrder = 2;

  // Steps + vines.
  add(new THREE.BoxGeometry(2, 0.16, 0.6), mat(P.stone, { flat: true }), 0, -0.08, 2.4);
  add(new THREE.BoxGeometry(1.6, 0.14, 0.5), mat(P.stone, { flat: true }), 0, 0.06, 2.05);
  const vineGeo = new THREE.CapsuleGeometry(0.06, 0.9, 3, 6);
  geometries.push(vineGeo);
  for (const [vx, vy, vz, tilt] of [
    [-1.6, 1.9, 0.4, 0.5], [1.7, 1.8, 0.3, -0.4], [-0.6, 2.5, 0.1, 0.2], [0.8, 2.6, 0, -0.15],
  ] as Array<[number, number, number, number]>) {
    const vine = new THREE.Mesh(vineGeo, mat(P.canopyDark));
    vine.position.set(vx, vy, vz);
    vine.rotation.z = tilt;
    group.add(vine);
  }

  // Blob shadow.
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1c3020, transparent: true, opacity: 0.14, depthWrite: false });
  const shadow = add(new THREE.CircleGeometry(3.4, 18).rotateX(-Math.PI / 2), shadowMat, 0, 0.04, 0);
  shadow.renderOrder = 1;

  // Door tween state (driven by hover in the interaction layer; also usable
  // as a scripted flourish).
  let openTarget = 0;
  let openAmount = 0;

  return {
    group,
    update(_t, dt) {
      openAmount += (openTarget - openAmount) * Math.min(1, dt * 5);
      doorPivot.rotation.y = -openAmount * THREE.MathUtils.degToRad(105);
      glow.visible = openAmount > 0.04;
    },
    dispose() {
      for (const g of geometries) g.dispose();
      shadowMat.dispose();
    },
    // Extra hook consumed by interactions (not part of WorldModule proper).
    setOpen(open: boolean) {
      openTarget = open ? 1 : 0;
    },
  } as WorldModule & { setOpen: (open: boolean) => void };
}
