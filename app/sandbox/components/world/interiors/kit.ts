import * as THREE from "three";
import { P, mat } from "../palette";
import { rng } from "../util";

// Small shared builders for the interiors. Same conventions as the landmark
// modules: geometries are tracked for dispose, materials come from the shared
// palette cache (which outlives any single interior).

export type Adder = (
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
) => THREE.Mesh;

export function makeAdd(group: THREE.Group, geometries: THREE.BufferGeometry[]): Adder {
  return (geo, material, x, y, z) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    group.add(mesh);
    geometries.push(geo);
    return mesh;
  };
}

const BOOK_COLORS = [P.bookRed, P.bookBlue, P.bookGreen, P.woodDark, P.parchment, P.rugRed];

// A shelf-length run of upright books: one InstancedMesh, per-instance color,
// heights and lean varied so the row reads as a lived-in shelf rather than a
// crenellated box. Runs along local +x of `yaw`, centred on (x, z), spines out.
export function addBookRow(
  group: THREE.Group,
  geometries: THREE.BufferGeometry[],
  instanced: THREE.InstancedMesh[],
  opts: { x: number; y: number; z: number; yaw: number; length: number; seed: number },
): void {
  const rand = rng(opts.seed);
  const geo = new THREE.BoxGeometry(0.055, 0.3, 0.2);
  geometries.push(geo);
  const count = Math.max(2, Math.floor(opts.length / 0.068));
  const books = new THREE.InstancedMesh(geo, mat(0xffffff), count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const along = -opts.length / 2 + 0.05 + i * 0.068;
    dummy.position.set(along, 0.15 * (0.72 + rand() * 0.5) - 0.001, (rand() - 0.5) * 0.02);
    dummy.scale.set(1, 0.72 + rand() * 0.5, 0.85 + rand() * 0.3);
    dummy.rotation.set(0, (rand() - 0.5) * 0.06, rand() < 0.12 ? 0.16 : 0);
    dummy.updateMatrix();
    books.setMatrixAt(i, dummy.matrix);
    books.setColorAt(i, color.setHex(BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)]));
  }
  books.position.set(opts.x, opts.y, opts.z);
  books.rotation.y = opts.yaw;
  group.add(books);
  instanced.push(books);
}

// A leaning stack of closed books on a surface (a table, the floor).
export function addBookStack(
  group: THREE.Group,
  geometries: THREE.BufferGeometry[],
  x: number,
  y: number,
  z: number,
  count: number,
  seed: number,
): void {
  const rand = rng(seed);
  let h = 0;
  for (let i = 0; i < count; i++) {
    const geo = new THREE.BoxGeometry(0.34 - rand() * 0.06, 0.055, 0.24 - rand() * 0.05);
    geometries.push(geo);
    const book = new THREE.Mesh(
      geo,
      mat(BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)], { flat: true }),
    );
    book.position.set(x + (rand() - 0.5) * 0.07, y + h + 0.028, z + (rand() - 0.5) * 0.07);
    book.rotation.y = (rand() - 0.5) * 0.9;
    group.add(book);
    h += 0.056;
  }
}

// A lit candle: wax stub, a warm emissive flame, no light of its own (the room
// carries one shared warm point light — per-candle lights would multiply draw
// cost for little visible gain).
export function addCandle(
  group: THREE.Group,
  geometries: THREE.BufferGeometry[],
  x: number,
  y: number,
  z: number,
  height = 0.16,
): void {
  const add = makeAdd(group, geometries);
  add(new THREE.CylinderGeometry(0.035, 0.04, height, 8), mat(P.stone), x, y + height / 2, z);
  add(
    new THREE.SphereGeometry(0.028, 6, 5),
    new THREE.MeshBasicMaterial({ color: P.lanternGlow }),
    x, y + height + 0.03, z,
  );
}

// A potted plant: clay pot, dark stem, a couple of leaf puffs.
export function addPottedPlant(
  group: THREE.Group,
  geometries: THREE.BufferGeometry[],
  x: number,
  y: number,
  z: number,
  scale = 1,
): void {
  const add = makeAdd(group, geometries);
  add(new THREE.CylinderGeometry(0.16 * scale, 0.12 * scale, 0.24 * scale, 8), mat(P.wood, { flat: true }), x, y + 0.12 * scale, z);
  add(new THREE.CylinderGeometry(0.03 * scale, 0.04 * scale, 0.5 * scale, 6), mat(P.canopyDark, { flat: true }), x, y + 0.45 * scale, z);
  add(new THREE.IcosahedronGeometry(0.18 * scale, 0), mat(P.canopy, { flat: true }), x - 0.05 * scale, y + 0.72 * scale, z);
  add(new THREE.IcosahedronGeometry(0.14 * scale, 0), mat(P.canopyLight, { flat: true }), x + 0.1 * scale, y + 0.62 * scale, z + 0.06 * scale);
}
