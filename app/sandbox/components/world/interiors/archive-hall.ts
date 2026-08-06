import * as THREE from "three";
import { P, mat } from "../palette";
import { makeAdd } from "./kit";
import type { Interior } from "./types";

// Inside the Archive: a round stone chamber, dark and lit only by torches. They
// ring the curved wall under a shallow dome, throwing pools of firelight across
// the floor, and the round door back out to the meadow sits in the wall behind
// you — daylight leaking around its rim the one cool light in the room.

const R = 4.6; // room radius
const WALL_H = 3.2; // where the dome springs from the wall
const TORCH_Y = 2.0; // height the torches ride at

// Torch positions around the wall, in radians measured off +z. The +z slot is
// left open for the door, so the flames ring the rest of the chamber.
const TORCH_ANGLES = [1, 2, 3, 4, 5, 6, 7].map((k) => (k / 8) * Math.PI * 2);

// Dark warm stone, kept out of the shared palette — these tones belong only to
// this room.
const WALL = 0x2b2622;
const FLOOR = 0x1a1714;
const DOME = 0x141210;
const PILLAR = 0x38312a;
const TRIM = 0x2c2620;
const RUG = 0x5a2b27;
const RUG_RIM = 0x6e3a33;
const IRON = 0x26221f;

export function buildArchiveHall(): Interior {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const add = makeAdd(group, geometries);

  // Shell: dark stone floor, a round wall, and a shallow dark dome overhead.
  add(new THREE.CircleGeometry(R + 0.2, 40).rotateX(-Math.PI / 2), mat(FLOOR, { flat: true }), 0, 0, 0);
  add(
    new THREE.CylinderGeometry(R, R, WALL_H, 40, 1, true),
    mat(WALL, { flat: true, side: THREE.BackSide }),
    0, WALL_H / 2, 0,
  );
  const dome = add(
    new THREE.SphereGeometry(R, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(DOME, { flat: true, side: THREE.BackSide }),
    0, WALL_H, 0,
  );
  dome.scale.y = 0.44; // squashed, so the ceiling stays a low vault

  // Skirting at the foot of the wall and a cornice ring at the dome's spring,
  // so the stone reads as a built rotunda.
  add(new THREE.TorusGeometry(R - 0.04, 0.13, 8, 44).rotateX(Math.PI / 2), mat(TRIM, { flat: true }), 0, 0.16, 0);
  add(new THREE.TorusGeometry(R - 0.04, 0.12, 8, 44).rotateX(Math.PI / 2), mat(PILLAR, { flat: true }), 0, WALL_H - 0.16, 0);

  // A round rug in the middle of the floor to break up the dark stone.
  const rug = add(new THREE.CircleGeometry(2, 36).rotateX(-Math.PI / 2), mat(RUG, { flat: true }), 0, 0.02, 0);
  rug.renderOrder = 1;
  const rugRim = add(new THREE.RingGeometry(1.82, 2, 36).rotateX(-Math.PI / 2), mat(RUG_RIM, { flat: true }), 0, 0.021, 0);
  rugRim.renderOrder = 1;

  // A pilaster hugging the wall behind each torch, for vertical rhythm.
  const pilasterGeo = new THREE.BoxGeometry(0.34, WALL_H, 0.22);
  geometries.push(pilasterGeo);
  for (const a of TORCH_ANGLES) {
    const pilaster = new THREE.Mesh(pilasterGeo, mat(PILLAR, { flat: true }));
    pilaster.position.set(Math.sin(a) * (R - 0.06), WALL_H / 2, Math.cos(a) * (R - 0.06));
    pilaster.rotation.y = a;
    group.add(pilaster);
  }

  // Torches ringing the wall. Each is built in a small group turned to face the
  // room (local −z points inward), so one recipe serves every wall angle: an
  // iron arm, a brass cup, and a two-cone flame lit by its own warm point light.
  // Flames are unlit basic material so they read as pure glow; lights and flame
  // meshes are tracked for the flicker loop.
  const torchLights: THREE.PointLight[] = [];
  const flames: THREE.Mesh[] = [];
  const armGeo = new THREE.BoxGeometry(0.06, 0.06, 0.42);
  const cupGeo = new THREE.CylinderGeometry(0.11, 0.055, 0.16, 10);
  const flameOuterGeo = new THREE.ConeGeometry(0.13, 0.44, 10);
  const flameInnerGeo = new THREE.ConeGeometry(0.07, 0.28, 8);
  geometries.push(armGeo, cupGeo, flameOuterGeo, flameInnerGeo);
  const flameOuterMat = new THREE.MeshBasicMaterial({ color: 0xff8a2a });
  const flameInnerMat = new THREE.MeshBasicMaterial({ color: 0xffe27a });
  materials.push(flameOuterMat, flameInnerMat);
  for (const a of TORCH_ANGLES) {
    const torch = new THREE.Group();
    torch.position.set(Math.sin(a) * (R - 0.04), 0, Math.cos(a) * (R - 0.04));
    torch.rotation.y = a; // local +z faces the wall, −z reaches into the room

    const arm = new THREE.Mesh(armGeo, mat(IRON, { flat: true }));
    arm.position.set(0, TORCH_Y + 0.02, -0.18);
    arm.rotation.x = 0.4; // reach in and tip up
    torch.add(arm);

    const cup = new THREE.Mesh(cupGeo, mat(P.brass, { flat: true }));
    cup.position.set(0, TORCH_Y + 0.14, -0.32);
    torch.add(cup);

    const outer = new THREE.Mesh(flameOuterGeo, flameOuterMat);
    outer.position.set(0, TORCH_Y + 0.42, -0.32);
    torch.add(outer);
    flames.push(outer);
    const inner = new THREE.Mesh(flameInnerGeo, flameInnerMat);
    inner.position.set(0, TORCH_Y + 0.37, -0.32);
    torch.add(inner);
    flames.push(inner);

    const light = new THREE.PointLight(0xffa346, 6.5, 8.5, 2);
    light.position.set(0, TORCH_Y + 0.5, -0.4);
    torch.add(light);
    torchLights.push(light);

    group.add(torch);
  }

  // The way out: a round door in the +z wall, dark wood with iron straps and a
  // brass knob, set in a pale-stone surround with daylight glowing around its
  // rim. Its material is private so the controller can glow it on hover.
  const doorY = 1.2;
  const doorMat = new THREE.MeshLambertMaterial({ color: 0x3b2b1c, flatShading: true });
  materials.push(doorMat);
  const doorGeo = new THREE.CircleGeometry(1.05, 32);
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, doorY, R - 0.12);
  door.rotation.y = Math.PI; // face into the room
  group.add(door);
  geometries.push(doorGeo);

  // Daylight halo peeking around the door's rim (drawn behind the disc).
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xd8ecff });
  materials.push(haloMat);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.09, 0.05, 8, 32), haloMat);
  halo.position.set(0, doorY, R - 0.02);
  group.add(halo);
  geometries.push(halo.geometry);

  // Iron straps across the round door, a wood frame ring, a stone surround.
  const strapGeo = new THREE.BoxGeometry(1.9, 0.12, 0.04);
  geometries.push(strapGeo);
  for (const by of [doorY - 0.42, doorY + 0.42]) {
    const strap = new THREE.Mesh(strapGeo, mat(IRON, { flat: true }));
    strap.position.set(0, by, R - 0.16);
    group.add(strap);
  }
  add(new THREE.TorusGeometry(1.06, 0.1, 8, 32), mat(P.woodDark, { flat: true }), 0, doorY, R - 0.1);
  add(new THREE.TorusGeometry(1.22, 0.13, 8, 34), mat(P.rock, { flat: true }), 0, doorY, R - 0.05);
  add(new THREE.SphereGeometry(0.07, 10, 8), mat(P.brass), 0.36, doorY, R - 0.22);

  // Lighting: a very dim warm fill so the stone between torches isn't pure
  // black, and a cool daylight wash at the exit door.
  const hemi = new THREE.HemisphereLight(0x2a2420, 0x0a0908, 0.35);
  const exitLight = new THREE.PointLight(0xbfe4ff, 3.5, 6, 2);
  exitLight.position.set(0, 1.6, R - 1.1);
  group.add(hemi, exitLight);

  return {
    group,
    bounds: { kind: "circle", x: 0, z: 0, r: R - 0.3 },
    colliders: [],
    floorY: 0,
    spawn: { x: 0, z: R - 1.3, yaw: 0 },
    doorMeshes: [door],
    doorGlow: [doorMat],
    background: 0x0a0806,
    fog: { color: 0x0a0806, near: 7, far: 18 },
    update(t) {
      // Torch flicker: each light wavers on its own two-frequency wobble, and
      // the flame cones breathe in step.
      for (let i = 0; i < torchLights.length; i++) {
        const f = Math.sin(t * 8.5 + i * 1.3) * 0.5 + Math.sin(t * 15.3 + i * 2.7) * 0.3;
        torchLights[i].intensity = 6.5 + f * 2;
      }
      for (let i = 0; i < flames.length; i++) {
        const ph = i * 0.9;
        flames[i].scale.set(
          1 + Math.sin(t * 13 + ph) * 0.06,
          1 + Math.sin(t * 11 + ph) * 0.13 + Math.sin(t * 19 + ph) * 0.06,
          1 + Math.cos(t * 12 + ph) * 0.06,
        );
      }
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
    },
  };
}
