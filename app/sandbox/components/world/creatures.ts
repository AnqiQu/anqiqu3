import * as THREE from "three";
import { P, mat } from "./palette";
import { POND_CENTER, ellipticalRadius, terrainHeight } from "./terrain";
import type { WorldModule } from "./types";
import { rng } from "./util";

// The island's residents: two dogs roaming freely around the meadow, koi in
// the pond, birds on high orbits, butterflies among the flowers.

// Circles the dogs may not enter: water, buildings, and other solids. Steering
// repels them near the edge, and a hard projection guarantees no penetration.
const DOG_OBSTACLES: Array<{ x: number; z: number; r: number }> = [
  { x: 2, z: 8, r: 4.6 }, // pond + rocky rim
  { x: 6, z: -4, r: 3.6 }, // greenhouse deck
  { x: -6, z: -14, r: 4.6 }, // observatory
  { x: -16, z: -2, r: 3.6 }, // archive mound
  { x: -13, z: -15, r: 1.2 }, // large turbine
  { x: -17.5, z: -11, r: 1 }, // small turbine
  { x: -9, z: 9, r: 1.2 }, // return sign
  { x: 15, z: 10, r: 1.8 }, // bridge foot
];
const RIM_LIMIT = 0.88; // normalized elliptical radius the dogs stay within

type DogColors = { coat: number; accent: number };

type Dog = {
  root: THREE.Group;
  legs: THREE.Group[]; // FL, FR, BL, BR hip pivots
  tail: THREE.Group;
  body: THREE.Group; // pitches when sitting
  shadow: THREE.Mesh;
  pos: THREE.Vector2; // x/z on the island
  heading: number; // radians, world y-axis
  target: THREE.Vector2;
  rand: () => number;
  offset: number; // desynchronizes the state machine
};

const CYCLE = 16.5; // run 10s → idle 2.5s → sit 4s
const DOG_SPEED = 2.4; // m/s while running
const TURN_RATE = 3; // rad/s

function buildDog({ coat, accent }: DogColors, geos: THREE.BufferGeometry[]): Dog {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const geo = <G extends THREE.BufferGeometry>(g: G): G => {
    geos.push(g);
    return g;
  };

  const torso = new THREE.Mesh(geo(new THREE.CapsuleGeometry(0.26, 0.46, 4, 10)), mat(coat));
  torso.rotation.x = Math.PI / 2;
  torso.position.y = 0.46;
  const chest = new THREE.Mesh(geo(new THREE.SphereGeometry(0.2, 10, 8)), mat(accent));
  chest.position.set(0, 0.42, 0.3);
  const head = new THREE.Mesh(geo(new THREE.SphereGeometry(0.21, 12, 10)), mat(coat));
  head.position.set(0, 0.72, 0.48);
  const snout = new THREE.Mesh(geo(new THREE.CapsuleGeometry(0.07, 0.1, 3, 8)), mat(accent));
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, 0.66, 0.68);
  const nose = new THREE.Mesh(geo(new THREE.SphereGeometry(0.035, 6, 5)), mat(0x2b2118));
  nose.position.set(0, 0.67, 0.76);
  body.add(torso, chest, head, snout, nose);

  const earGeo = geo(new THREE.ConeGeometry(0.07, 0.16, 6));
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat(coat));
    ear.position.set(side * 0.12, 0.92, 0.42);
    ear.rotation.z = side * -0.4;
    body.add(ear);
  }

  const tail = new THREE.Group();
  tail.position.set(0, 0.55, -0.42);
  const tailMesh = new THREE.Mesh(geo(new THREE.ConeGeometry(0.055, 0.34, 6)), mat(coat));
  tailMesh.position.y = 0.15;
  tailMesh.rotation.x = 0.5;
  tail.add(tailMesh);
  body.add(tail);

  const legGeo = geo(new THREE.CylinderGeometry(0.05, 0.045, 0.34, 6));
  const legs: THREE.Group[] = [];
  for (const [lx, lz] of [
    [-0.13, 0.22], [0.13, 0.22], [-0.13, -0.2], [0.13, -0.2],
  ] as Array<[number, number]>) {
    const hip = new THREE.Group();
    hip.position.set(lx, 0.36, lz);
    const leg = new THREE.Mesh(legGeo, mat(coat));
    leg.position.y = -0.17;
    hip.add(leg);
    body.add(hip);
    legs.push(hip);
  }

  const shadow = new THREE.Mesh(
    geo(new THREE.CircleGeometry(0.42, 12).rotateX(-Math.PI / 2)),
    new THREE.MeshBasicMaterial({ color: 0x1c3020, transparent: true, opacity: 0.14, depthWrite: false }),
  );
  shadow.renderOrder = 1;
  root.add(shadow);

  return {
    root,
    legs,
    tail,
    body,
    shadow,
    pos: new THREE.Vector2(),
    heading: 0,
    target: new THREE.Vector2(),
    rand: () => 0,
    offset: 0,
  };
}

function insideObstacle(x: number, z: number, margin: number): boolean {
  return DOG_OBSTACLES.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + margin);
}

function pickTarget(dog: Dog): void {
  for (let i = 0; i < 24; i++) {
    const x = (dog.rand() * 2 - 1) * 24;
    const z = (dog.rand() * 2 - 1) * 18;
    if (ellipticalRadius(x, z) > RIM_LIMIT - 0.06) continue;
    if (insideObstacle(x, z, 0.6)) continue;
    if (Math.hypot(x - dog.pos.x, z - dog.pos.y) < 5) continue; // actually travel
    dog.target.set(x, z);
    return;
  }
  dog.target.set(8, 2); // safe meadow fallback
}

export function buildCreatures(): WorldModule {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];

  // ===== Dogs =====
  const golden = buildDog({ coat: P.dogGolden, accent: P.dogCream }, geometries);
  const collie = buildDog({ coat: P.dogBlack, accent: P.dogWhite }, geometries);
  golden.pos.set(10, 3);
  golden.rand = rng(1201);
  golden.offset = 0;
  collie.pos.set(-2, 5);
  collie.rand = rng(3407);
  collie.offset = 7.5;
  const dogs = [golden, collie];
  for (const dog of dogs) {
    dog.heading = dog.rand() * Math.PI * 2;
    pickTarget(dog);
    group.add(dog.root);
  }

  const updateDog = (dog: Dog, t: number, dt: number) => {
    const phase = (t + dog.offset) % CYCLE;
    const running = phase < 10;
    const sitting = phase >= 12.5;

    if (running) {
      // Steer toward the wander target, repelled by obstacle rims and the
      // island edge.
      let steerX = dog.target.x - dog.pos.x;
      let steerZ = dog.target.y - dog.pos.y;
      const seekLen = Math.hypot(steerX, steerZ) || 1;
      steerX /= seekLen;
      steerZ /= seekLen;
      for (const o of DOG_OBSTACLES) {
        const dx = dog.pos.x - o.x;
        const dz = dog.pos.y - o.z;
        const d = Math.hypot(dx, dz) || 1;
        if (d < o.r + 1.8) {
          const w = ((o.r + 1.8 - d) / 1.8) * 2.5;
          steerX += (dx / d) * w;
          steerZ += (dz / d) * w;
        }
      }
      const re = ellipticalRadius(dog.pos.x, dog.pos.y);
      if (re > RIM_LIMIT - 0.12) {
        const inward = ((re - (RIM_LIMIT - 0.12)) / 0.12) * 2.5;
        const len = Math.hypot(dog.pos.x, dog.pos.y) || 1;
        steerX -= (dog.pos.x / len) * inward;
        steerZ -= (dog.pos.y / len) * inward;
      }

      // Turn gradually, then advance.
      const desired = Math.atan2(steerX, steerZ);
      let delta = desired - dog.heading;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      dog.heading += THREE.MathUtils.clamp(delta, -TURN_RATE * dt, TURN_RATE * dt);
      dog.pos.x += Math.sin(dog.heading) * DOG_SPEED * dt;
      dog.pos.y += Math.cos(dog.heading) * DOG_SPEED * dt;

      // Hard guarantees: project out of any obstacle and back inside the rim.
      for (const o of DOG_OBSTACLES) {
        const dx = dog.pos.x - o.x;
        const dz = dog.pos.y - o.z;
        const d = Math.hypot(dx, dz) || 1;
        if (d < o.r) {
          dog.pos.x = o.x + (dx / d) * o.r;
          dog.pos.y = o.z + (dz / d) * o.r;
        }
      }
      const reNow = ellipticalRadius(dog.pos.x, dog.pos.y);
      if (reNow > RIM_LIMIT) {
        dog.pos.x *= RIM_LIMIT / reNow;
        dog.pos.y *= RIM_LIMIT / reNow;
      }

      if (Math.hypot(dog.target.x - dog.pos.x, dog.target.y - dog.pos.y) < 1.4) {
        pickTarget(dog);
      }
    }

    dog.root.position.set(dog.pos.x, terrainHeight(dog.pos.x, dog.pos.y), dog.pos.y);
    dog.root.rotation.y = dog.heading;

    // Legs: diagonal pairs swing while running; hind legs fold when sitting.
    const swing = running ? Math.sin(t * 10) * 0.6 : 0;
    dog.legs[0].rotation.x = swing;
    dog.legs[3].rotation.x = swing;
    dog.legs[1].rotation.x = -swing;
    dog.legs[2].rotation.x = -swing;
    const fold = sitting ? -1.2 : 0;
    dog.legs[2].rotation.x += fold;
    dog.legs[3].rotation.x += fold;

    // Body: bob on the run, pitch back when sitting (eased).
    const targetPitch = sitting ? -0.3 : 0;
    dog.body.rotation.x += (targetPitch - dog.body.rotation.x) * Math.min(1, dt * 6);
    dog.body.position.y = (running ? Math.abs(Math.sin(t * 10)) * 0.06 : 0) + (sitting ? -0.08 : 0);

    // Tail: always wagging — faster when running.
    dog.tail.rotation.z = Math.sin(t * (running ? 9 : 5)) * 0.45;
  };

  // ===== Koi =====
  type Koi = { pivot: THREE.Group; tail: THREE.Mesh; speed: number; phase: number; radius: number };
  const kois: Koi[] = [];
  const koiBodyGeo = new THREE.SphereGeometry(0.16, 10, 8);
  const koiTailGeo = new THREE.ConeGeometry(0.09, 0.22, 6);
  geometries.push(koiBodyGeo, koiTailGeo);
  const koiColors = [P.koi, P.koi, P.koiWhite, P.koi, P.koiWhite];
  for (let i = 0; i < 5; i++) {
    // pivot orbits the pond center; the fish hangs at `radius` from it.
    const pivot = new THREE.Group();
    pivot.position.set(POND_CENTER.x, -0.3, POND_CENTER.z);
    const fish = new THREE.Group();
    const radius = 1 + (i % 3) * 0.55;
    fish.position.x = radius;
    fish.rotation.y = Math.PI; // nose along the direction of travel
    const bodyMesh = new THREE.Mesh(koiBodyGeo, mat(koiColors[i]));
    bodyMesh.scale.set(0.55, 0.7, 1.9);
    const tailMesh = new THREE.Mesh(koiTailGeo, mat(koiColors[i]));
    tailMesh.rotation.x = -Math.PI / 2;
    tailMesh.position.z = -0.36;
    if (koiColors[i] === P.koiWhite) {
      const patch = new THREE.Mesh(koiBodyGeo, mat(P.koi));
      patch.scale.set(0.3, 0.4, 0.6);
      patch.position.set(0, 0.08, 0.1);
      fish.add(patch);
    }
    fish.add(bodyMesh, tailMesh);
    pivot.add(fish);
    group.add(pivot);
    kois.push({ pivot, tail: tailMesh, speed: 0.15 + (i * 0.07) % 0.12, phase: i * 1.3, radius });
  }

  // ===== Birds =====
  type Bird = { pivot: THREE.Group; wings: THREE.Mesh[]; speed: number; y: number; radius: number; phase: number };
  const birds: Bird[] = [];
  const birdBodyGeo = new THREE.SphereGeometry(0.16, 8, 6);
  const wingGeo = new THREE.PlaneGeometry(0.5, 0.2);
  wingGeo.translate(0.25, 0, 0);
  geometries.push(birdBodyGeo, wingGeo);
  for (let i = 0; i < 3; i++) {
    const pivot = new THREE.Group();
    const bird = new THREE.Group();
    const radius = 20 + i * 5;
    bird.position.x = radius;
    const bodyMesh = new THREE.Mesh(birdBodyGeo, mat(P.bird));
    bodyMesh.scale.set(0.7, 0.7, 1.6);
    bird.add(bodyMesh);
    const wings: THREE.Mesh[] = [];
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(wingGeo, mat(P.bird, { side: THREE.DoubleSide }));
      wing.scale.x = side;
      bird.add(wing);
      wings.push(wing);
    }
    pivot.add(bird);
    group.add(pivot);
    birds.push({ pivot, wings, speed: 0.05 + i * 0.012, y: 17 + i * 4, radius, phase: i * 2.1 });
  }

  // ===== Butterflies =====
  type Butterfly = { root: THREE.Group; wings: THREE.Mesh[]; home: [number, number]; phase: number };
  const butterflies: Butterfly[] = [];
  const bWingGeo = new THREE.PlaneGeometry(0.09, 0.13);
  bWingGeo.translate(0.045, 0, 0);
  geometries.push(bWingGeo);
  const bColors = [P.blossomPink, P.blossomOrange, P.blossomYellow, P.koiWhite];
  const homes: Array<[number, number]> = [
    [6, -2.5], [7.5, -5], [-8.5, 8], [3.5, 11.5], [-15, -1], [-5.5, -13],
  ];
  homes.forEach((home, i) => {
    const root = new THREE.Group();
    const wings: THREE.Mesh[] = [];
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(bWingGeo, mat(bColors[i % 4], { side: THREE.DoubleSide }));
      wing.scale.x = side;
      root.add(wing);
      wings.push(wing);
    }
    group.add(root);
    butterflies.push({ root, wings, home, phase: i * 1.7 });
  });

  return {
    group,
    update(t, dt) {
      for (const dog of dogs) updateDog(dog, t, dt);

      for (const koi of kois) {
        koi.pivot.rotation.y += koi.speed * dt;
        koi.tail.rotation.z = Math.sin(t * 6 + koi.phase) * 0.5;
      }

      for (const bird of birds) {
        bird.pivot.rotation.y = t * bird.speed + bird.phase;
        bird.pivot.position.y = bird.y + Math.sin(t * 0.5 + bird.phase) * 1.2;
        for (const wing of bird.wings) {
          wing.rotation.y = wing.scale.x * Math.sin(t * 9 + bird.phase) * 0.7;
        }
      }

      for (const b of butterflies) {
        const [hx, hz] = b.home;
        const x = hx + Math.sin(t * 0.6 + b.phase) * 0.8;
        const z = hz + Math.sin(t * 0.45 + b.phase * 2) * 0.7;
        b.root.position.set(x, terrainHeight(x, z) + 0.55 + Math.sin(t * 1.3 + b.phase) * 0.22, z);
        b.root.rotation.y = t * 0.4 + b.phase;
        for (const wing of b.wings) {
          wing.rotation.y = wing.scale.x * Math.sin(t * 12 + b.phase) * 1.1;
        }
      }
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const dog of dogs) (dog.shadow.material as THREE.Material).dispose();
    },
  };
}
