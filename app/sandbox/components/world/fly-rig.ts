import * as THREE from "three";
import { ellipticalRadius, terrainHeight } from "./terrain";

// Free-fly exploration. Drag looks around, wheel / pinch flies forward and back
// along the view direction, WASD cruise/strafe over the world on the horizontal
// plane, Q/E drop/climb, and , / . turn the view left/right (hold Shift to go
// faster) — the camera roams freely like an aircraft instead of orbiting a fixed
// point. The reachable space is a sphere centred on the island: you can fly
// anywhere inside it and simply slide along the shell at its edge, so the island
// is never lost in the fog. A terrain floor keeps you from flying through the
// ground while you're over the island's footprint.

const CENTER = new THREE.Vector3(0, 2, 0); // island heart: the home shot + roam bounds
const HOME = { distance: 85, polar: 1.12, azimuth: 0 };

// Vertical FOV for landscape; portrait derives its vfov from the equivalent
// horizontal coverage so the island doesn't fall off the sides of a phone.
const BASE_VFOV = 55;
const BASE_ASPECT = 1.4;
const H_TARGET = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_VFOV) / 2) * BASE_ASPECT);

export function fovForAspect(aspect: number): number {
  if (aspect >= BASE_ASPECT) return BASE_VFOV;
  const vfov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(H_TARGET / 2) / aspect));
  return THREE.MathUtils.clamp(vfov, BASE_VFOV, 95);
}

// Feel.
const LOOK_SPEED = 0.0026; // radians of turn per pixel dragged
const PITCH_LIMIT = 1.45; // ~83°, so the view never flips over the poles
const MOVE_ACCEL = 235; // keyboard thrust (units/s²)
const BOOST = 2.6; // Shift multiplier
const WHEEL_IMPULSE = 0.05; // velocity kick per unit of wheel delta
const PINCH_IMPULSE = 0.16; // velocity kick per pixel of pinch spread
const DAMP_TAU = 0.2; // velocity decay constant; higher = more glide/soar
const LOOK_EASE = 14; // how fast the view catches up to the drag
const MAX_SPEED = 145; // clamp so a key held or a fast scroll can't run away
const YAW_KEY_SPEED = 1.3; // radians/s of turn from the , / . keys

// Roam sphere: fly anywhere inside it, but never past its shell.
const SPHERE_RADIUS = 172; // distance from CENTER, in every direction
const GROUND_CLEARANCE = 1.6; // float this far above the meadow when over it

type FlightTarget = { pos: THREE.Vector3; yaw: number; pitch: number };

export type FlyRig = {
  update: (dt: number) => void;
  // Ease the camera to a vantage of a world position (overlay keyboard nav).
  // Any pointer/wheel/key input cancels the flight.
  flyTo: (worldPos: [number, number, number], distance?: number) => void;
  // Solid meshes the camera may not fly through (set once modules exist).
  setColliders: (objects: THREE.Object3D[]) => void;
  dispose: () => void;
};

export function createFlyRig(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement): FlyRig {
  // Orientation as yaw/pitch (roll stays 0). `*Target` is where a drag wants
  // the view; the applied angle eases toward it for a smooth, weighty feel.
  let yaw = 0;
  let pitch = 0;
  let yawTarget = 0;
  let pitchTarget = 0;

  // Start on the classic vista: derive a camera position + look angles from the
  // old orbit HOME so the opening shot is unchanged.
  const startFromSpherical = (radius: number, polar: number, azimuth: number) => {
    const p = new THREE.Vector3()
      .setFromSpherical(new THREE.Spherical(radius, polar, azimuth))
      .add(CENTER);
    camera.position.copy(p);
    const dir = CENTER.clone().sub(p).normalize();
    pitchTarget = pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
    yawTarget = yaw = Math.atan2(-dir.x, -dir.z);
  };
  startFromSpherical(HOME.distance, HOME.polar, HOME.azimuth);

  // ?view=azimuth,polar,distance pins the opening camera for reproducible QA.
  const pinned = new URLSearchParams(window.location.search).get("view");
  if (pinned) {
    const [azimuth, polar, distance] = pinned.split(",").map(Number);
    startFromSpherical(distance || HOME.distance, polar || HOME.polar, azimuth || 0);
  }
  camera.rotation.set(pitch, yaw, 0, "YXZ");
  // Touch drags/pinches drive the camera, not the page.
  canvas.style.touchAction = "none";

  const vel = new THREE.Vector3();
  const keys = new Set<string>();
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDist = 0;
  let flight: FlightTarget | null = null;

  // Scratch, reused every frame.
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const prevPos = new THREE.Vector3();
  const wish = new THREE.Vector3();
  const flatForward = new THREE.Vector3();
  const stepVec = new THREE.Vector3();
  const off = new THREE.Vector3();
  const collideRay = new THREE.Raycaster();
  let colliders: THREE.Object3D[] = [];
  camera.getWorldDirection(forward);
  right.crossVectors(forward, worldUp).normalize();

  const cancelFlight = () => {
    flight = null;
  };

  const twoPointerDistance = () => {
    const it = pointers.values();
    const a = it.next().value as { x: number; y: number };
    const b = it.next().value as { x: number; y: number };
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  // --- Pointer: one finger / mouse = look, two fingers = pinch to fly -------
  const onPointerDown = (e: PointerEvent) => {
    cancelFlight();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) pinchDist = twoPointerDistance();
  };
  const onPointerMove = (e: PointerEvent) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return; // only pointers that pressed on the canvas steer
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    prev.x = e.clientX;
    prev.y = e.clientY;
    if (pointers.size >= 2) {
      const d = twoPointerDistance();
      vel.addScaledVector(forward, (d - pinchDist) * PINCH_IMPULSE);
      pinchDist = d;
    } else {
      // Grab-the-world look: drag right → view turns left, drag down → look up.
      yawTarget += dx * LOOK_SPEED;
      pitchTarget = THREE.MathUtils.clamp(pitchTarget + dy * LOOK_SPEED, -PITCH_LIMIT, PITCH_LIMIT);
    }
  };
  const onPointerUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size === 2) pinchDist = twoPointerDistance();
  };

  const onWheel = (e: WheelEvent) => {
    cancelFlight();
    vel.addScaledVector(forward, -e.deltaY * WHEEL_IMPULSE); // scroll up flies forward
  };

  // --- Keyboard: WASD move, Q/E down/up, , / . turn, Shift boosts ----------
  const isTypingTarget = () => {
    const el = document.activeElement as HTMLElement | null;
    return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  };
  const MOVE_KEYS = new Set(["w", "a", "s", "d", "q", "e", ",", "."]);
  const onKeyDown = (e: KeyboardEvent) => {
    if (isTypingTarget()) return;
    const k = e.key.toLowerCase();
    if (MOVE_KEYS.has(k)) {
      keys.add(k);
      cancelFlight();
      e.preventDefault();
    }
    if (e.key === "Shift") keys.add("shift");
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.key.toLowerCase());
    if (e.key === "Shift") keys.delete("shift");
  };

  canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
  canvas.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp, { passive: true });

  const easeAngle = (cur: number, target: number, k: number) => cur + (target - cur) * k;

  // Keep the camera above the ground, out of solids, and inside the bubble.
  const resolveCollisions = () => {
    const pos = camera.position;
    // Stop at solids we'd otherwise fly through (observatory dome/drum, etc.).
    if (colliders.length) {
      const step = stepVec.copy(pos).sub(prevPos);
      const dist = step.length();
      if (dist > 1e-4) {
        step.multiplyScalar(1 / dist);
        collideRay.set(prevPos, step);
        collideRay.far = dist + 0.6;
        const hit = collideRay.intersectObjects(colliders, false)[0];
        if (hit) {
          pos.copy(prevPos).addScaledVector(step, Math.max(0, hit.distance - 0.6));
          vel.multiplyScalar(0.2);
        }
      }
    }
    // Terrain floor while over the island footprint.
    if (ellipticalRadius(pos.x, pos.z) < 1.15) {
      const minY = terrainHeight(pos.x, pos.z) + GROUND_CLEARANCE;
      if (pos.y < minY) {
        pos.y = minY;
        if (vel.y < 0) vel.y = 0;
      }
    }
    // Spherical roam boundary: fly anywhere inside the sphere, never past it.
    // At the shell, clamp back and drop only the outward part of the velocity,
    // so you glide along the inside of the sphere instead of jamming to a stop.
    off.subVectors(pos, CENTER);
    const dist = off.length();
    if (dist > SPHERE_RADIUS) {
      off.multiplyScalar(1 / dist); // now the unit outward normal
      pos.copy(CENTER).addScaledVector(off, SPHERE_RADIUS);
      const outward = vel.dot(off);
      if (outward > 0) vel.addScaledVector(off, -outward);
    }
  };

  return {
    update(dt) {
      if (dt <= 0) return;

      if (flight) {
        const k = Math.min(1, dt * 3.2);
        camera.position.lerp(flight.pos, k);
        let dYaw = flight.yaw - yaw;
        dYaw = Math.atan2(Math.sin(dYaw), Math.cos(dYaw)); // shortest path
        yaw = yawTarget = yaw + dYaw * k;
        pitch = pitchTarget = pitch + (flight.pitch - pitch) * k;
        if (camera.position.distanceTo(flight.pos) < 0.4 && Math.abs(dYaw) < 0.01) flight = null;
        camera.rotation.set(pitch, yaw, 0, "YXZ");
        return;
      }

      // Keyboard thrust. WASD cruise on the horizontal plane (fly forward/
      // strafe over the world without diving), Q/E change altitude — so each
      // key does a distinct, plane-like thing instead of everything nosing
      // toward the ground. `forward`/`right` still track the look direction;
      // `flatForward` is that heading flattened onto the ground.
      camera.getWorldDirection(forward);
      right.crossVectors(forward, worldUp).normalize();
      flatForward.set(-Math.sin(yaw), 0, -Math.cos(yaw)); // heading, pitch removed
      wish.set(0, 0, 0);
      if (keys.has("w")) wish.add(flatForward);
      if (keys.has("s")) wish.sub(flatForward);
      if (keys.has("d")) wish.add(right);
      if (keys.has("a")) wish.sub(right);
      if (keys.has("e")) wish.add(worldUp);
      if (keys.has("q")) wish.sub(worldUp);
      if (wish.lengthSq() > 0) {
        wish.normalize().multiplyScalar(MOVE_ACCEL * (keys.has("shift") ? BOOST : 1) * dt);
        vel.add(wish);
      }

      // , / . turn the view left / right (keyboard yaw). Feeds the same target
      // the drag does, so it eases in and out the same smooth way.
      const turn = YAW_KEY_SPEED * (keys.has("shift") ? BOOST : 1) * dt;
      if (keys.has(",")) yawTarget += turn;
      if (keys.has(".")) yawTarget -= turn;

      // Ease the view toward the drag target, then commit the orientation.
      const lk = Math.min(1, dt * LOOK_EASE);
      yaw = easeAngle(yaw, yawTarget, lk);
      pitch = easeAngle(pitch, pitchTarget, lk);
      camera.rotation.set(pitch, yaw, 0, "YXZ");

      // Integrate velocity with frame-rate-independent damping.
      const speed = vel.length();
      if (speed > MAX_SPEED) vel.multiplyScalar(MAX_SPEED / speed);
      prevPos.copy(camera.position);
      camera.position.addScaledVector(vel, dt);
      vel.multiplyScalar(Math.exp(-dt / DAMP_TAU));
      resolveCollisions();
    },
    flyTo(worldPos, distance = 32) {
      const target = new THREE.Vector3(worldPos[0], worldPos[1], worldPos[2]);
      // Approach from the island's outer side at a gentle downward tilt, so the
      // landmark reads against the island rather than the open sky.
      const outward = new THREE.Vector3(target.x - CENTER.x, 0, target.z - CENTER.z);
      if (outward.lengthSq() < 1e-4) outward.set(0, 0, 1);
      outward.normalize();
      const pos = target
        .clone()
        .addScaledVector(outward, distance * 0.82)
        .addScaledVector(worldUp, distance * 0.5);
      const dir = target.clone().sub(pos).normalize();
      flight = {
        pos,
        pitch: Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)),
        yaw: Math.atan2(-dir.x, -dir.z),
      };
    },
    setColliders(objects) {
      colliders = objects;
    },
    dispose() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
}
