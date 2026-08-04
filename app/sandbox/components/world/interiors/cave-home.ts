import * as THREE from "three";
import { P, mat } from "../palette";
import { addBookRow, addBookStack, addCandle, addPottedPlant, makeAdd } from "./kit";
import type { Interior } from "./types";

// Inside the burrow: a hobbit hole. A round, low-ceilinged den — warm plaster
// walls ribbed with wooden beams, a crackling hearth, an armchair pulled up
// close with a side table and teapot, shelves of old books, hanging herbs,
// and the round green door back out to the meadow.

const R = 4.3; // room radius
const WALL_H = 1.7; // where the dome starts

export function buildCaveHome(): Interior {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const instanced: THREE.InstancedMesh[] = [];
  const materials: THREE.Material[] = [];
  const add = makeAdd(group, geometries);

  // Shell: wood floor, warm plaster wall band, plaster dome, wooden ribs.
  add(new THREE.CircleGeometry(R + 0.2, 32).rotateX(-Math.PI / 2), mat(P.floorWoodDark, { flat: true }), 0, 0, 0);
  add(
    new THREE.CylinderGeometry(R, R, WALL_H, 26, 1, true),
    mat(P.plaster, { flat: true, side: THREE.BackSide }),
    0, WALL_H / 2, 0,
  );
  // The dome is squashed: a full hemisphere would vault cathedral-high, and a
  // burrow ceiling should sit low enough to feel snug.
  const dome = add(
    new THREE.SphereGeometry(R, 26, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(P.plaster, { flat: true, side: THREE.BackSide }),
    0, WALL_H, 0,
  );
  dome.scale.y = 0.58;
  const ribGeo = new THREE.TorusGeometry(R - 0.05, 0.07, 6, 22, Math.PI);
  geometries.push(ribGeo);
  for (let i = 0; i < 4; i++) {
    const rib = new THREE.Mesh(ribGeo, mat(P.woodDark));
    rib.position.y = WALL_H;
    rib.scale.y = 0.58;
    rib.rotation.y = (i / 4) * Math.PI;
    group.add(rib);
  }
  add(new THREE.TorusGeometry(R - 0.04, 0.08, 6, 26).rotateX(Math.PI / 2), mat(P.woodDark), 0, WALL_H, 0);
  add(new THREE.TorusGeometry(R - 0.04, 0.07, 6, 26).rotateX(Math.PI / 2), mat(P.woodDark), 0, 0.07, 0);

  // Round rug in the middle.
  const rug = add(new THREE.CircleGeometry(1.8, 28).rotateX(-Math.PI / 2), mat(P.rugRed), 0, 0.012, -0.2);
  rug.renderOrder = 1;
  const rim = add(new THREE.RingGeometry(1.64, 1.8, 28).rotateX(-Math.PI / 2), mat(P.parchment), 0, 0.016, -0.2);
  rim.renderOrder = 1;

  // The round green door — the way out — with its wooden frame and brass knob
  // dead centre, as is proper.
  const doorMat = new THREE.MeshLambertMaterial({ color: P.doorGreen, flatShading: true });
  const frameMat = new THREE.MeshLambertMaterial({ color: P.woodDark, flatShading: true });
  materials.push(doorMat, frameMat);
  const door = new THREE.Mesh(new THREE.CircleGeometry(1.05, 24), doorMat);
  geometries.push(door.geometry);
  door.position.set(0, 1.15, R - 0.25);
  door.rotation.y = Math.PI;
  group.add(door);
  const doorFrame = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.11, 8, 24), frameMat);
  geometries.push(doorFrame.geometry);
  doorFrame.position.set(0, 1.15, R - 0.22);
  group.add(doorFrame);
  add(new THREE.SphereGeometry(0.06, 8, 6), mat(P.brass), 0, 1.15, R - 0.32);
  // Petal panelling on the door: radial wood strips.
  const stripGeo = new THREE.BoxGeometry(0.05, 0.95, 0.02);
  geometries.push(stripGeo);
  for (let i = 0; i < 4; i++) {
    const strip = new THREE.Mesh(stripGeo, frameMat);
    strip.position.set(0, 1.15, R - 0.27);
    strip.rotation.z = (i / 4) * Math.PI;
    group.add(strip);
  }

  // Hearth at the far wall: chimney breast, stone arch, glowing embers, and a
  // mantel with candles and a tiny framed picture.
  const hearth = new THREE.Group();
  hearth.position.set(0, 0, -R + 0.5);
  const breastGeo = new THREE.BoxGeometry(2.3, 1.9, 0.75);
  const archGeo = new THREE.TorusGeometry(0.62, 0.16, 6, 14, Math.PI);
  const mantelGeo = new THREE.BoxGeometry(2.1, 0.12, 0.55);
  const mouthGeo = new THREE.PlaneGeometry(1.05, 0.85);
  const emberGeo = new THREE.SphereGeometry(0.09, 6, 5);
  const logGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.55, 6);
  geometries.push(breastGeo, archGeo, mantelGeo, mouthGeo, emberGeo, logGeo);
  const breast = new THREE.Mesh(breastGeo, mat(P.stone, { flat: true }));
  breast.position.set(0, 0.95, 0);
  hearth.add(breast);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x140d08 });
  materials.push(mouthMat);
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, 0.5, 0.39);
  hearth.add(mouth);
  const arch = new THREE.Mesh(archGeo, mat(P.rock, { flat: true }));
  arch.position.set(0, 0.62, 0.4);
  hearth.add(arch);
  const mantel = new THREE.Mesh(mantelGeo, mat(P.woodDark, { flat: true }));
  mantel.position.set(0, 1.55, 0.2);
  hearth.add(mantel);
  const emberMat = new THREE.MeshBasicMaterial({ color: P.emberOrange });
  materials.push(emberMat);
  const embers: THREE.Mesh[] = [];
  for (const [ex, ey, es] of [[-0.14, 0.14, 1], [0.1, 0.1, 0.8], [0, 0.22, 0.6]]) {
    const ember = new THREE.Mesh(emberGeo, emberMat);
    ember.position.set(ex, ey, 0.42);
    ember.scale.setScalar(es);
    hearth.add(ember);
    embers.push(ember);
  }
  for (const [lx, rot] of [[-0.2, 0.5], [0.16, -0.4]]) {
    const log = new THREE.Mesh(logGeo, mat(P.woodDark, { flat: true }));
    log.position.set(lx, 0.1, 0.45);
    log.rotation.set(0, rot, Math.PI / 2);
    hearth.add(log);
  }
  group.add(hearth);
  addCandle(group, geometries, -0.7, 1.61, -R + 0.7, 0.14);
  addCandle(group, geometries, 0.75, 1.61, -R + 0.7, 0.1);
  // Framed picture on the mantel.
  add(new THREE.BoxGeometry(0.3, 0.24, 0.03), mat(P.gold), 0.02, 1.75, -R + 0.68);
  add(new THREE.BoxGeometry(0.24, 0.18, 0.035), mat(P.blossomPink), 0.02, 1.75, -R + 0.68);
  const fireLight = new THREE.PointLight(0xffa860, 9, 7, 2);
  fireLight.position.set(0, 0.9, -R + 1.1);
  group.add(fireLight);

  // Armchair pulled up to the fire, with footstool, side table, and tea.
  const chair = new THREE.Group();
  chair.position.set(1.35, 0, -1.45);
  chair.rotation.y = 0.55; // angled toward the hearth
  const seatGeo = new THREE.BoxGeometry(0.85, 0.42, 0.8);
  const backGeo = new THREE.BoxGeometry(0.85, 0.85, 0.22);
  const armGeo = new THREE.BoxGeometry(0.18, 0.3, 0.75);
  const cushionGeo = new THREE.BoxGeometry(0.62, 0.12, 0.55);
  geometries.push(seatGeo, backGeo, armGeo, cushionGeo);
  const fabric = mat(P.blimpTeal, { flat: true });
  const seat = new THREE.Mesh(seatGeo, fabric);
  seat.position.y = 0.21;
  const backrest = new THREE.Mesh(backGeo, fabric);
  backrest.position.set(0, 0.62, -0.32);
  backrest.rotation.x = -0.12;
  const cushion = new THREE.Mesh(cushionGeo, mat(P.blossomOrange, { flat: true }));
  cushion.position.set(0, 0.47, 0.03);
  chair.add(seat, backrest, cushion);
  for (const sx of [-1, 1]) {
    const armRest = new THREE.Mesh(armGeo, fabric);
    armRest.position.set(sx * 0.42, 0.55, 0);
    chair.add(armRest);
  }
  group.add(chair);
  const stool = add(new THREE.BoxGeometry(0.5, 0.3, 0.42), mat(P.blimpTeal, { flat: true }), 0.7, 0.15, -2.4);
  stool.rotation.y = 0.4;

  // Side table with teapot and mug.
  add(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 12), mat(P.wood, { flat: true }), 2.35, 0.55, -0.5);
  add(new THREE.CylinderGeometry(0.05, 0.07, 0.53, 7), mat(P.woodDark), 2.35, 0.27, -0.5);
  const teapot = add(new THREE.SphereGeometry(0.14, 10, 8), mat(P.potionBlue, { flat: true }), 2.3, 0.7, -0.55);
  teapot.scale.y = 0.8;
  const spout = add(new THREE.CylinderGeometry(0.02, 0.035, 0.18, 6), mat(P.potionBlue), 2.16, 0.74, -0.55);
  spout.rotation.z = 0.9;
  add(new THREE.SphereGeometry(0.035, 6, 5), mat(P.woodDark), 2.3, 0.82, -0.55);
  add(new THREE.CylinderGeometry(0.05, 0.045, 0.09, 8), mat(P.parchment), 2.5, 0.62, -0.4);

  // Books: two shelf runs set into the wall, and comfortable clutter.
  const shelfAngles = [Math.PI * 0.55, Math.PI * 1.45];
  shelfAngles.forEach((a, si) => {
    const sx = Math.sin(a) * (R - 0.42);
    const sz = Math.cos(a) * (R - 0.42);
    const unit = new THREE.Group();
    unit.position.set(sx, 0, sz);
    unit.rotation.y = a + Math.PI;
    const boardGeo = new THREE.BoxGeometry(1.6, 0.06, 0.3);
    const sideGeo = new THREE.BoxGeometry(0.12, 1.5, 0.3);
    geometries.push(boardGeo, sideGeo);
    for (const ex of [-0.8, 0.8]) {
      const side = new THREE.Mesh(sideGeo, mat(P.woodDark, { flat: true }));
      side.position.set(ex, 0.85, 0);
      unit.add(side);
    }
    for (const sy of [0.42, 0.95, 1.48]) {
      const board = new THREE.Mesh(boardGeo, mat(P.wood, { flat: true }));
      board.position.set(0, sy, 0);
      unit.add(board);
    }
    group.add(unit);
    for (const [ri, sy] of [0.42, 0.95].entries()) {
      addBookRow(group, geometries, instanced, {
        x: sx, y: sy + 0.03, z: sz,
        yaw: a + Math.PI, length: 1.4, seed: 80 + si * 10 + ri,
      });
    }
  });
  addBookStack(group, geometries, -1.6, 0, 1.9, 4, 21);
  addBookStack(group, geometries, 2.1, 0, 1.1, 3, 22);

  // Barrel, crate, and a potted plant by the door.
  add(new THREE.CylinderGeometry(0.3, 0.34, 0.75, 10), mat(P.wood, { flat: true }), -2.6, 0.38, 1.6);
  add(new THREE.TorusGeometry(0.32, 0.025, 5, 12).rotateX(Math.PI / 2), mat(P.brass), -2.6, 0.6, 1.6);
  add(new THREE.TorusGeometry(0.34, 0.025, 5, 12).rotateX(Math.PI / 2), mat(P.brass), -2.6, 0.2, 1.6);
  const crate = add(new THREE.BoxGeometry(0.55, 0.5, 0.55), mat(P.woodDark, { flat: true }), -3.1, 0.25, 0.6);
  crate.rotation.y = 0.3;
  addPottedPlant(group, geometries, -1.5, 0, 3.4, 1.15);
  addPottedPlant(group, geometries, 1.55, 0, 3.35, 0.9);

  // Dried herbs hanging from a line strung between two ribs.
  const line = add(new THREE.CylinderGeometry(0.012, 0.012, 4.6, 4), mat(P.wood), 0, 2.6, 0.9);
  line.rotation.z = Math.PI / 2;
  const herbGeo = new THREE.CapsuleGeometry(0.05, 0.16, 3, 6);
  const herbTieGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.2, 4);
  geometries.push(herbGeo, herbTieGeo);
  for (const hx of [-1.7, -0.9, 0.1, 0.8, 1.6]) {
    const tie = new THREE.Mesh(herbTieGeo, mat(P.wood));
    tie.position.set(hx, 2.5, 0.9);
    group.add(tie);
    const herb = new THREE.Mesh(herbGeo, mat(P.canopyDark, { flat: true }));
    herb.position.set(hx, 2.3, 0.9);
    herb.rotation.x = Math.PI; // hanging tip-down
    group.add(herb);
  }

  // A round window beside the door, glowing with meadow daylight.
  const windowAngle = Math.PI * 0.28;
  const wx = Math.sin(windowAngle) * (R - 0.18);
  const wz = Math.cos(windowAngle) * (R - 0.18);
  const skyMat = new THREE.MeshBasicMaterial({ color: P.skyHorizon });
  materials.push(skyMat);
  const roundWindow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), skyMat);
  geometries.push(roundWindow.geometry);
  roundWindow.position.set(wx, 1.45, wz);
  roundWindow.rotation.y = windowAngle + Math.PI;
  group.add(roundWindow);
  const windowFrame = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 6, 18), mat(P.woodDark));
  geometries.push(windowFrame.geometry);
  windowFrame.position.set(wx, 1.45, wz);
  windowFrame.rotation.y = windowAngle;
  group.add(windowFrame);

  // Warm, low light: embers and candles carry the room; the window helps.
  const hemi = new THREE.HemisphereLight(0xffe2b8, 0x54402c, 0.85);
  const candleLight = new THREE.PointLight(0xffd9a0, 5, 6, 2);
  candleLight.position.set(0, 1.9, -R + 0.9);
  const windowLight = new THREE.PointLight(0xbfe4ff, 3, 5, 2);
  windowLight.position.set(wx * 0.8, 1.5, wz * 0.8);
  group.add(hemi, candleLight, windowLight);

  return {
    group,
    bounds: { kind: "circle", x: 0, z: 0, r: R - 0.3 },
    colliders: [
      { kind: "rect", minX: -1.2, maxX: 1.2, minZ: -R, maxZ: -R + 1 }, // hearth
      { kind: "circle", x: 1.35, z: -1.45, r: 0.62 }, // armchair
      { kind: "circle", x: 0.7, z: -2.4, r: 0.35 }, // footstool
      { kind: "circle", x: 2.35, z: -0.5, r: 0.42 }, // side table
      { kind: "circle", x: -2.6, z: 1.6, r: 0.42 }, // barrel
      { kind: "circle", x: -3.1, z: 0.6, r: 0.42 }, // crate
      { kind: "circle", x: -1.5, z: 3.4, r: 0.3 },
      { kind: "circle", x: 1.55, z: 3.35, r: 0.28 },
      { kind: "rect", minX: Math.sin(Math.PI * 0.55) * (R - 0.42) - 0.95, maxX: Math.sin(Math.PI * 0.55) * (R - 0.42) + 0.95, minZ: Math.cos(Math.PI * 0.55) * (R - 0.42) - 0.5, maxZ: Math.cos(Math.PI * 0.55) * (R - 0.42) + 0.5 },
      { kind: "rect", minX: Math.sin(Math.PI * 1.45) * (R - 0.42) - 0.95, maxX: Math.sin(Math.PI * 1.45) * (R - 0.42) + 0.95, minZ: Math.cos(Math.PI * 1.45) * (R - 0.42) - 0.5, maxZ: Math.cos(Math.PI * 1.45) * (R - 0.42) + 0.5 },
    ],
    floorY: 0,
    spawn: { x: 0, z: 3.1, yaw: 0 },
    doorMeshes: [door, doorFrame],
    doorGlow: [doorMat, frameMat],
    background: 0x241a12,
    update(t) {
      // Fire flicker: embers breathe, the light wavers.
      const flicker = Math.sin(t * 6.3) * 0.5 + Math.sin(t * 11.7) * 0.3;
      fireLight.intensity = 9 + flicker * 2.2;
      embers.forEach((ember, i) => {
        ember.scale.setScalar((1 - i * 0.2) * (1 + Math.sin(t * 5 + i * 2.1) * 0.12));
      });
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const im of instanced) im.dispose();
    },
  };
}
