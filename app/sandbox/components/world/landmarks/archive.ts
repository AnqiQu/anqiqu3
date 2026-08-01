import * as THREE from "three";
import { P, mat } from "../palette";
import { terrainHeight } from "../terrain";
import type { WorldModule } from "../types";

// The Archive: a burrow dug into the side of a grassy bank — old ideas and
// memories live inside. The door hangs in a left-edge pivot so it can swing
// open as an ambient flourish.
//
// The bank is a sphere whose front is clamped flat (see FACE_CUT): a flat disc
// standing against a curved dome can never sit flush, so the doorway used to
// read as a slice propped up on a ball. Clamping every vertex past the cut
// plane onto it gives the hill a real vertical face for the door to sit in,
// the way a hillside burrow actually looks.
const RADIUS = 3.5;
const FACE_CUT = 2; // geometry-space z where the sphere's front is flattened
// x is deliberately under 1: a bank wider than it is tall reads as fat.
const SCALE = { x: 0.95, y: 1, z: 1 };
const BANK_Y = -0.45;
// Where that flat face ends up in the group's local space.
const FACE_Z = 1.7;
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

  // The bank itself: a sphere with its front clamped flat, sunk into the low
  // rise the terrain field raises behind it, so it reads as ground swelling up
  // and being cut into rather than a dome parked on the meadow. Grass-colored
  // to match the field it grows out of. A camera/hover solid like the terrain.
  const bankGeo = new THREE.SphereGeometry(RADIUS, 24, 16);
  const bankPos = bankGeo.attributes.position;
  for (let i = 0; i < bankPos.count; i++) {
    if (bankPos.getZ(i) > FACE_CUT) bankPos.setZ(i, FACE_CUT);
  }
  bankGeo.computeVertexNormals();
  const bank = add(
    bankGeo,
    mat(P.meadow, { flat: true }),
    0, BANK_Y, FACE_Z - FACE_CUT * SCALE.z,
  );
  bank.scale.set(SCALE.x, SCALE.y, SCALE.z);
  bank.userData.occluder = true;

  // Doorway, flush in that flat face. Black first so the burrow reads as unlit
  // depth, then the warm ring that only shows once the door swings open.
  const glow = add(new THREE.CircleGeometry(0.88, 24), new THREE.MeshBasicMaterial({ color: P.blossomYellow }), 0, 0.9, FACE_Z + 0.04);
  glow.visible = false; // revealed when the door opens
  add(new THREE.CircleGeometry(1.1, 24), new THREE.MeshBasicMaterial({ color: 0x05060a }), 0, 0.9, FACE_Z + 0.02);

  // Round door in a pivot group at its left edge, dark as the hole it closes.
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-1.08, 0.9, FACE_Z + 0.1);
  const doorGeo = new THREE.CircleGeometry(1.08, 24);
  const door = new THREE.Mesh(doorGeo, mat(P.caveDark, { side: THREE.DoubleSide }));
  door.position.x = 1.08;
  const knobGeo = new THREE.SphereGeometry(0.08, 8, 6);
  const knob = new THREE.Mesh(knobGeo, mat(P.brass));
  knob.position.set(1.87, 0, 0.06);
  doorPivot.add(door, knob);
  group.add(doorPivot);
  geometries.push(doorGeo, knobGeo);

  // Wood rim around the mouth.
  add(new THREE.TorusGeometry(1.11, 0.11, 8, 24), mat(P.woodDark, { flat: true }), 0, 0.9, FACE_Z + 0.12);

  // Vines spilling over the lip where the flat cut meets the dome and hanging
  // down across the doorway, leaves and a blossom on each, so the burrow reads
  // as long lived-in rather than freshly dug. Anchors track the face's top
  // edge; the leaves are what keep a strand from reading as a bare green stick.
  const vineGeo = new THREE.CapsuleGeometry(0.038, 1, 3, 6);
  const leafGeo = new THREE.IcosahedronGeometry(0.11, 0);
  const blossomGeo = new THREE.SphereGeometry(0.085, 7, 6);
  geometries.push(vineGeo, leafGeo, blossomGeo);
  const blossoms = [P.blossomPink, P.blossomYellow, P.blossomOrange];
  // [x, where the face's edge sits at that x, how far it hangs, lean]
  const strands: Array<[x: number, top: number, drop: number, tilt: number]> = [
    [-1.85, 1.66, 0.8, 0.32], [-1.4, 2.02, 1.15, 0.16], [-0.95, 2.24, 0.65, 0.26],
    [-0.45, 2.38, 1.3, 0.07], [0.1, 2.42, 0.82, -0.05], [0.6, 2.35, 1.35, 0.11],
    [1.1, 2.18, 0.7, -0.21], [1.55, 1.92, 1.1, -0.13], [2, 1.51, 0.75, -0.26],
  ];
  strands.forEach(([sx, top, drop, tilt], i) => {
    // Offsets put the strand's TOP on the anchor, not its middle, so every
    // vine starts on the face's edge however far it leans.
    const lean = Math.sin(tilt);
    const fall = Math.cos(tilt);
    const at = (f: number) => [sx + lean * drop * f, top - fall * drop * f] as const;

    const vine = new THREE.Mesh(vineGeo, mat(P.canopyDark));
    const [mx, my] = at(0.5);
    vine.position.set(mx, my, FACE_Z + 0.2);
    vine.scale.y = drop;
    vine.rotation.z = tilt;
    group.add(vine);

    for (let leaf = 0; leaf < 3; leaf++) {
      const [lx, ly] = at(0.3 + leaf * 0.25);
      const blade = new THREE.Mesh(leafGeo, mat(leaf % 2 ? P.canopy : P.canopyLight, { flat: true }));
      blade.position.set(lx + (leaf % 2 ? 0.12 : -0.12), ly, FACE_Z + 0.23);
      blade.rotation.set(i * 0.7, leaf * 1.1, tilt);
      blade.scale.setScalar(0.85 + ((i + leaf) % 3) * 0.22);
      group.add(blade);
    }

    const [bx, by] = at(1);
    const blossom = new THREE.Mesh(blossomGeo, mat(blossoms[i % 3]));
    blossom.position.set(bx, by - 0.05, FACE_Z + 0.25);
    group.add(blossom);
  });

  // Steps down from the threshold to the meadow. The terrain drops away in
  // front of the bank (the burrow sits on a rise), so each slab is bedded into
  // the ground it actually stands on — otherwise the flight stops in mid-air
  // partway down the slope. Local z maps straight out from the door, so the
  // world sample only needs the group's own rotation.
  for (let step = 0; step < 5; step++) {
    const pz = FACE_Z + 0.4 + step * 0.6;
    const ground =
      terrainHeight(x + Math.sin(rotationY) * pz, z + Math.cos(rotationY) * pz) - y;
    add(
      new THREE.BoxGeometry(1.75 - step * 0.1, 0.16, 0.62),
      mat(P.stone, { flat: true }),
      0, ground + 0.02, pz,
    );
  }

  // Blob shadow.
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1c3020, transparent: true, opacity: 0.14, depthWrite: false });
  const shadow = add(new THREE.CircleGeometry(3.3, 20).rotateX(-Math.PI / 2), shadowMat, 0, 0.04, 0);
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
