import * as THREE from "three";
import { P, mat } from "../palette";
import { rng } from "../util";
import { addBookRow, addBookStack, addCandle, makeAdd } from "./kit";
import type { Collider, Interior } from "./types";

// Inside the observatory: Faust's study. A round stone chamber under the glass
// dome — a cluttered work table of glowing vials and alembics, candle stubs,
// shelves and stacks of old books, loose papers, a brass telescope aimed at
// the sky, and a cauldron simmering something green in the corner.

const R = 4.6; // room radius
const WALL_H = 3.1;

export function buildObservatoryLab(): Interior {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const instanced: THREE.InstancedMesh[] = [];
  const materials: THREE.Material[] = []; // private (non-cache) materials
  const add = makeAdd(group, geometries);

  // Shell: wood floor, stone drum wall seen from inside, glass dome overhead
  // with its brass meridian ribs, so the room matches the building it lives in.
  add(new THREE.CircleGeometry(R + 0.2, 36).rotateX(-Math.PI / 2), mat(P.floorWood, { flat: true }), 0, 0, 0);
  const wall = add(
    new THREE.CylinderGeometry(R, R, WALL_H, 28, 1, true),
    mat(P.stonePale, { flat: true, side: THREE.BackSide }),
    0, WALL_H / 2, 0,
  );
  wall.rotation.y = Math.PI / 28; // seam off the door
  add(
    new THREE.SphereGeometry(R, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(P.glassTeal, { transparent: true, opacity: 0.32, side: THREE.BackSide, depthWrite: false }),
    0, WALL_H, 0,
  ).renderOrder = 2;
  const ribGeo = new THREE.TorusGeometry(R - 0.04, 0.05, 6, 24, Math.PI);
  geometries.push(ribGeo);
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(ribGeo, mat(P.brass));
    rib.position.y = WALL_H;
    rib.rotation.y = (i / 3) * Math.PI;
    group.add(rib);
  }
  add(new THREE.TorusGeometry(R - 0.03, 0.07, 6, 28).rotateX(Math.PI / 2), mat(P.brass), 0, WALL_H, 0);
  add(new THREE.TorusGeometry(R - 0.03, 0.06, 6, 28).rotateX(Math.PI / 2), mat(P.woodDark), 0, 0.06, 0);

  // Round rug under the table.
  const rug = add(new THREE.CircleGeometry(1.7, 28).rotateX(-Math.PI / 2), mat(P.rugRed), 0.2, 0.012, -0.5);
  rug.renderOrder = 1;
  const rim = add(new THREE.RingGeometry(1.56, 1.7, 28).rotateX(-Math.PI / 2), mat(P.gold), 0.2, 0.016, -0.5);
  rim.renderOrder = 1;

  // Exit: a heavy wooden door set in the +z wall. Private materials so hover
  // can lift their emissive without lighting every woodDark mesh in the world.
  const doorMat = new THREE.MeshLambertMaterial({ color: P.woodDark, flatShading: true });
  const frameMat = new THREE.MeshLambertMaterial({ color: P.wood, flatShading: true });
  materials.push(doorMat, frameMat);
  const door = add(new THREE.BoxGeometry(1.15, 2.2, 0.12), doorMat, 0, 1.1, R - 0.18);
  const lintel = add(new THREE.BoxGeometry(1.55, 0.16, 0.2), frameMat, 0, 2.28, R - 0.22);
  const jambGeo = new THREE.BoxGeometry(0.14, 2.2, 0.2);
  geometries.push(jambGeo);
  const jambs = [-0.71, 0.71].map((x) => {
    const jamb = new THREE.Mesh(jambGeo, frameMat);
    jamb.position.set(x, 1.1, R - 0.22);
    group.add(jamb);
    return jamb;
  });
  add(new THREE.SphereGeometry(0.055, 8, 6), mat(P.brass), -0.42, 1.05, R - 0.26);

  // The work table, mid-room, groaning under the experiment.
  const tableTop = add(new THREE.BoxGeometry(2.7, 0.1, 1.15), mat(P.wood, { flat: true }), 0.2, 0.92, -0.5);
  tableTop.rotation.y = 0.12;
  const legGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.88, 7);
  geometries.push(legGeo);
  for (const [lx, lz] of [[-1.15, -0.42], [1.15, -0.42], [-1.15, 0.42], [1.15, 0.42]]) {
    const leg = new THREE.Mesh(legGeo, mat(P.woodDark));
    leg.position.set(lx, 0.44, lz);
    leg.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.12);
    leg.position.x += 0.2;
    leg.position.z += -0.5;
    group.add(leg);
  }

  // Vials everywhere: glass tubes with glowing contents, on the table and on
  // the shelves. Basic-material liquids so they read as self-lit potions.
  const tubeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.26, 8, 1, true);
  const liquidGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.12, 8);
  const flaskGeo = new THREE.SphereGeometry(0.13, 10, 8);
  const neckGeo = new THREE.CylinderGeometry(0.035, 0.05, 0.16, 8);
  geometries.push(tubeGeo, liquidGeo, flaskGeo, neckGeo);
  const glassMat = new THREE.MeshLambertMaterial({
    color: 0xdff2ef, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false,
  });
  materials.push(glassMat);
  const potions = [P.potionGreen, P.potionPurple, P.potionBlue, P.blossomOrange];
  const potionMats = potions.map((c) => {
    const m = new THREE.MeshBasicMaterial({ color: c });
    materials.push(m);
    return m;
  });
  const tableSurface = { y: 0.97, cx: 0.2, cz: -0.5 };
  const vialSpots: Array<[number, number, number]> = [
    [-0.9, -0.2, 0], [-0.65, 0.15, 1], [-0.4, -0.35, 2], [0.05, 0.25, 3],
    [0.55, -0.25, 0], [0.85, 0.2, 2], [1.1, -0.1, 1],
  ];
  for (const [vx, vz, ci] of vialSpots) {
    const tube = new THREE.Mesh(tubeGeo, glassMat);
    tube.position.set(tableSurface.cx + vx, tableSurface.y + 0.13, tableSurface.cz + vz);
    tube.renderOrder = 3;
    const liquid = new THREE.Mesh(liquidGeo, potionMats[ci]);
    liquid.position.set(tableSurface.cx + vx, tableSurface.y + 0.06, tableSurface.cz + vz);
    group.add(tube, liquid);
  }
  // Two round-bellied flasks; the green one bubbles.
  const flask = new THREE.Mesh(flaskGeo, potionMats[0]);
  flask.position.set(-0.45, tableSurface.y + 0.12, -0.85);
  flask.scale.y = 0.85;
  const flaskNeck = new THREE.Mesh(neckGeo, glassMat);
  flaskNeck.position.set(-0.45, tableSurface.y + 0.3, -0.85);
  flaskNeck.renderOrder = 3;
  const flask2 = new THREE.Mesh(flaskGeo, potionMats[1]);
  flask2.position.set(0.95, tableSurface.y + 0.12, -0.75);
  flask2.scale.setScalar(0.8);
  group.add(flask, flaskNeck, flask2);
  const bubbleGeo = new THREE.SphereGeometry(0.02, 6, 5);
  geometries.push(bubbleGeo);
  const bubbles = [0, 1, 2].map((i) => {
    const b = new THREE.Mesh(bubbleGeo, potionMats[0]);
    b.position.set(-0.45, tableSurface.y + 0.32, -0.85);
    b.userData.phase = i / 3;
    group.add(b);
    return b;
  });

  // Books: stacks on the table, toppled piles on the floor, and two shelf
  // units against the wall with full rows.
  addBookStack(group, geometries, -1.0, tableSurface.y, -0.15, 4, 11);
  addBookStack(group, geometries, 0.5, tableSurface.y, 0.2, 3, 12);
  addBookStack(group, geometries, -2.6, 0, 1.6, 5, 13);
  addBookStack(group, geometries, 2.4, 0, -1.4, 3, 14);
  addBookStack(group, geometries, 1.9, 0, 2.6, 4, 15);
  // Open book on the table: two angled leaves.
  const leafGeo = new THREE.BoxGeometry(0.24, 0.02, 0.34);
  geometries.push(leafGeo);
  for (const s of [-1, 1]) {
    const pageLeaf = new THREE.Mesh(leafGeo, mat(P.parchment, { flat: true }));
    pageLeaf.position.set(0.2 + s * 0.115, tableSurface.y + 0.03, 0.1);
    pageLeaf.rotation.z = -s * 0.22;
    group.add(pageLeaf);
  }

  const shelfAngles = [Math.PI * 0.62, Math.PI * 1.28];
  const shelfColliders: Collider[] = [];
  shelfAngles.forEach((a, si) => {
    const sx = Math.sin(a) * (R - 0.45);
    const sz = Math.cos(a) * (R - 0.45);
    const unit = new THREE.Group();
    unit.position.set(sx, 0, sz);
    unit.rotation.y = a + Math.PI; // local +z faces the room's centre
    const sideGeo = new THREE.BoxGeometry(0.16, 2.3, 0.34);
    const boardGeo = new THREE.BoxGeometry(1.9, 0.06, 0.34);
    const capGeo = new THREE.BoxGeometry(1.9, 0.1, 0.34);
    geometries.push(sideGeo, boardGeo, capGeo);
    for (const ex of [-0.95, 0.95]) {
      const side = new THREE.Mesh(sideGeo, mat(P.woodDark, { flat: true }));
      side.position.set(ex, 1.15, 0);
      unit.add(side);
    }
    [0.35, 1.0, 1.65].forEach((sy) => {
      const board = new THREE.Mesh(boardGeo, mat(P.wood, { flat: true }));
      board.position.set(0, sy, 0);
      unit.add(board);
    });
    const cap = new THREE.Mesh(capGeo, mat(P.woodDark, { flat: true }));
    cap.position.set(0, 2.25, 0);
    unit.add(cap);
    group.add(unit);
    [0.35, 1.0, 1.65].forEach((sy, ri) => {
      addBookRow(group, geometries, instanced, {
        x: sx, y: sy + 0.03, z: sz,
        yaw: a + Math.PI, length: 1.7, seed: 40 + si * 10 + ri,
      });
    });
    shelfColliders.push({
      kind: "rect",
      minX: sx - 1.05, maxX: sx + 1.05,
      minZ: sz - 0.55, maxZ: sz + 0.55,
    });
  });

  // Loose papers drifting across the floor.
  const paperGeo = new THREE.PlaneGeometry(0.24, 0.32).rotateX(-Math.PI / 2);
  geometries.push(paperGeo);
  const rand = rng(77);
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2;
    const d = 1.6 + rand() * 2.4;
    const paper = new THREE.Mesh(paperGeo, mat(P.parchment, { side: THREE.DoubleSide }));
    paper.position.set(Math.sin(a) * d, 0.015 + rand() * 0.01, Math.cos(a) * d);
    paper.rotation.y = rand() * Math.PI;
    paper.renderOrder = 1;
    group.add(paper);
  }

  // Brass telescope on a tripod, aimed up through the dome.
  const scopeGroup = new THREE.Group();
  scopeGroup.position.set(-0.5, 0, -3.2);
  scopeGroup.rotation.y = 0.8;
  const tripodGeo = new THREE.CylinderGeometry(0.03, 0.045, 1.3, 6);
  geometries.push(tripodGeo);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const legMesh = new THREE.Mesh(tripodGeo, mat(P.woodDark));
    legMesh.position.set(Math.sin(a) * 0.34, 0.6, Math.cos(a) * 0.34);
    legMesh.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
    scopeGroup.add(legMesh);
  }
  const scopeGeo = new THREE.CylinderGeometry(0.09, 0.14, 1.5, 10);
  geometries.push(scopeGeo);
  const scope = new THREE.Mesh(scopeGeo, mat(P.brass));
  scope.position.set(0, 1.55, 0);
  scope.rotation.x = 0.8;
  scopeGroup.add(scope);
  group.add(scopeGroup);

  // The cauldron in the corner, simmering green.
  const cauldron = new THREE.Group();
  cauldron.position.set(2.7, 0, 1.9);
  const potGeo = new THREE.SphereGeometry(0.5, 14, 10, 0, Math.PI * 2, Math.PI * 0.25, Math.PI * 0.55);
  geometries.push(potGeo);
  const pot = new THREE.Mesh(potGeo, mat(P.dogBlack, { flat: true }));
  pot.position.y = 0.52;
  const rimGeo = new THREE.TorusGeometry(0.36, 0.05, 6, 16).rotateX(Math.PI / 2);
  geometries.push(rimGeo);
  const potRim = new THREE.Mesh(rimGeo, mat(P.dogBlack));
  potRim.position.y = 0.88;
  const brewGeo = new THREE.CircleGeometry(0.33, 16).rotateX(-Math.PI / 2);
  geometries.push(brewGeo);
  const brew = new THREE.Mesh(brewGeo, potionMats[0]);
  brew.position.y = 0.84;
  cauldron.add(pot, potRim, brew);
  const stubGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.3, 6);
  geometries.push(stubGeo);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const stub = new THREE.Mesh(stubGeo, mat(P.dogBlack));
    stub.position.set(Math.sin(a) * 0.3, 0.15, Math.cos(a) * 0.3);
    cauldron.add(stub);
  }
  group.add(cauldron);
  const brewLight = new THREE.PointLight(P.potionGreen, 4, 5, 2);
  brewLight.position.set(2.7, 1.3, 1.9);
  group.add(brewLight);

  // Candles: on the table, a shelf, and by the door.
  addCandle(group, geometries, 1.15, tableSurface.y, 0.25);
  addCandle(group, geometries, -1.05, tableSurface.y, -0.75, 0.1);
  addCandle(group, geometries, -1.3, 0, 3.4, 0.22);

  // Light: cool daylight sifting through the dome, warmed by candle flame.
  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x6b543a, 1.35);
  const candleLight = new THREE.PointLight(0xffd9a0, 14, 9, 2);
  candleLight.position.set(0.4, 1.9, -0.3);
  const domeLight = new THREE.DirectionalLight(0xbfe4ff, 0.5);
  domeLight.position.set(2, 6, 1);
  group.add(hemi, candleLight, domeLight);

  return {
    group,
    bounds: { kind: "circle", x: 0, z: 0, r: R - 0.25 },
    colliders: [
      { kind: "rect", minX: -1.35, maxX: 1.75, minZ: -1.25, maxZ: 0.25 }, // table
      { kind: "circle", x: -0.5, z: -3.2, r: 0.55 }, // telescope
      { kind: "circle", x: 2.7, z: 1.9, r: 0.7 }, // cauldron
      ...shelfColliders,
    ],
    floorY: 0,
    spawn: { x: 0, z: 3.35, yaw: 0 },
    doorMeshes: [door, lintel, ...jambs],
    doorGlow: [doorMat, frameMat],
    background: P.skyTop,
    update(t) {
      for (const b of bubbles) {
        const cycle = (t * 0.5 + (b.userData.phase as number)) % 1;
        b.position.y = tableSurface.y + 0.3 + cycle * 0.22;
        b.scale.setScalar(1 - cycle * 0.6);
      }
      brewLight.intensity = 4 + Math.sin(t * 5.1) * 0.9 + Math.sin(t * 8.7) * 0.5;
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const im of instanced) im.dispose();
    },
  };
}
