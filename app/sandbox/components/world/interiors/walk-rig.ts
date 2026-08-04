import * as THREE from "three";
import type { Collider, RoomBounds } from "./types";

// First-person walking for the interiors, controlled like the island outside:
// WASD walk on the floor plane, the arrow keys turn/tilt the view, drag looks
// (same grab-the-world convention as the fly rig), Shift hurries, and a
// two-finger pinch walks forward/back on touch. There is no flying and no
// falling: the eye stays at a fixed height above the floor, and position is
// clamped inside the room's bounds and pushed out of furniture, so walls are
// genuinely solid.

const LOOK_SPEED = 0.0026;
const PITCH_LIMIT = 1.35;
const LOOK_EASE = 14;
const LOOK_KEY_SPEED = 1.3; // radians/s of turn/tilt from the arrow keys
const WALK_ACCEL = 42; // units/s²
const BOOST = 1.9;
const MAX_SPEED = 4.6;
const DAMP_TAU = 0.12; // quick stop — feet, not a glider
const PINCH_IMPULSE = 0.02;
const WHEEL_IMPULSE = 0.006;
const PLAYER_RADIUS = 0.38;
const STEP_UP_MAX = 0.6; // climb steps up to this tall; anything taller is a wall
const FALL_SPEED = 8; // units/s the eye settles down when it's above the floor

export type WalkRig = {
  update: (dt: number) => void;
  dispose: () => void;
};

export function createWalkRig(
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
  opts: {
    bounds: RoomBounds;
    colliders: Collider[];
    floorY: number;
    floorHeightAt?: (x: number, z: number) => number;
    spawn: { x: number; z: number; yaw: number };
    eyeHeight?: number;
  },
): WalkRig {
  const eye = opts.eyeHeight ?? 1.55;
  let yaw = opts.spawn.yaw;
  let pitch = 0;
  let yawTarget = yaw;
  let pitchTarget = 0;
  // Height of the ground under the feet — flat, or sampled from the room's
  // height field (stairs, a raised deck) when it has one.
  let footY = opts.floorHeightAt ? opts.floorHeightAt(opts.spawn.x, opts.spawn.z) : opts.floorY;
  camera.position.set(opts.spawn.x, footY + eye, opts.spawn.z);
  camera.rotation.set(pitch, yaw, 0, "YXZ");

  const vel = new THREE.Vector3(); // horizontal only (y stays 0)
  const keys = new Set<string>();
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDist = 0;

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const wish = new THREE.Vector3();

  const twoPointerDistance = () => {
    const it = pointers.values();
    const a = it.next().value as { x: number; y: number };
    const b = it.next().value as { x: number; y: number };
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e: PointerEvent) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) pinchDist = twoPointerDistance();
  };
  const onPointerMove = (e: PointerEvent) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    prev.x = e.clientX;
    prev.y = e.clientY;
    if (pointers.size >= 2) {
      const d = twoPointerDistance();
      vel.addScaledVector(forward, (d - pinchDist) * PINCH_IMPULSE);
      pinchDist = d;
    } else {
      yawTarget += dx * LOOK_SPEED;
      pitchTarget = THREE.MathUtils.clamp(pitchTarget + dy * LOOK_SPEED, -PITCH_LIMIT, PITCH_LIMIT);
    }
  };
  const onPointerUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size === 2) pinchDist = twoPointerDistance();
  };
  const onWheel = (e: WheelEvent) => {
    vel.addScaledVector(forward, -e.deltaY * WHEEL_IMPULSE);
  };

  const isTypingTarget = () => {
    const el = document.activeElement as HTMLElement | null;
    return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  };
  const HELD_KEYS = new Set([
    "w", "a", "s", "d",
    "arrowleft", "arrowright", "arrowup", "arrowdown",
  ]);
  const onKeyDown = (e: KeyboardEvent) => {
    if (isTypingTarget()) return;
    const k = e.key.toLowerCase();
    if (HELD_KEYS.has(k)) {
      keys.add(k);
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

  // Clamp inside the room, then push out of each piece of furniture. Two
  // passes settle corner cases (pushed out of a table into a wall).
  const resolve = (pos: THREE.Vector3) => {
    for (let pass = 0; pass < 2; pass++) {
      const b = opts.bounds;
      if (b.kind === "rect") {
        pos.x = THREE.MathUtils.clamp(pos.x, b.minX + PLAYER_RADIUS, b.maxX - PLAYER_RADIUS);
        pos.z = THREE.MathUtils.clamp(pos.z, b.minZ + PLAYER_RADIUS, b.maxZ - PLAYER_RADIUS);
      } else {
        const dx = pos.x - b.x;
        const dz = pos.z - b.z;
        const d = Math.hypot(dx, dz);
        const max = b.r - PLAYER_RADIUS;
        if (d > max && d > 1e-6) {
          pos.x = b.x + (dx / d) * max;
          pos.z = b.z + (dz / d) * max;
        }
      }
      for (const c of opts.colliders) {
        if (c.kind === "circle") {
          const dx = pos.x - c.x;
          const dz = pos.z - c.z;
          const d = Math.hypot(dx, dz);
          const min = c.r + PLAYER_RADIUS;
          if (d < min) {
            const push = d > 1e-6 ? min / d : 1;
            pos.x = d > 1e-6 ? c.x + dx * push : c.x + min;
            pos.z = d > 1e-6 ? c.z + dz * push : c.z;
          }
        } else {
          const minX = c.minX - PLAYER_RADIUS;
          const maxX = c.maxX + PLAYER_RADIUS;
          const minZ = c.minZ - PLAYER_RADIUS;
          const maxZ = c.maxZ + PLAYER_RADIUS;
          if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
            // Push out along the axis of least penetration.
            const outs = [
              { d: pos.x - minX, apply: () => { pos.x = minX; } },
              { d: maxX - pos.x, apply: () => { pos.x = maxX; } },
              { d: pos.z - minZ, apply: () => { pos.z = minZ; } },
              { d: maxZ - pos.z, apply: () => { pos.z = maxZ; } },
            ];
            outs.sort((p, q) => p.d - q.d)[0].apply();
          }
        }
      }
    }
  };

  return {
    update(dt) {
      if (dt <= 0) return;
      // Where the feet were before this frame's move — reverted to if the step
      // ahead turns out to be a wall (a stair riser too tall to climb).
      const startX = camera.position.x;
      const startZ = camera.position.z;

      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
      forward.normalize();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      wish.set(0, 0, 0);
      if (keys.has("w")) wish.add(forward);
      if (keys.has("s")) wish.sub(forward);
      if (keys.has("d")) wish.add(right);
      if (keys.has("a")) wish.sub(right);
      if (wish.lengthSq() > 0) {
        wish.normalize().multiplyScalar(WALK_ACCEL * (keys.has("shift") ? BOOST : 1) * dt);
        vel.add(wish);
      }

      // Arrow keys turn (left/right) and tilt (up/down) the view, feeding the
      // same target the drag does — matching the island's fly rig exactly.
      const turn = LOOK_KEY_SPEED * (keys.has("shift") ? BOOST : 1) * dt;
      if (keys.has("arrowleft")) yawTarget += turn;
      if (keys.has("arrowright")) yawTarget -= turn;
      if (keys.has("arrowup")) pitchTarget = THREE.MathUtils.clamp(pitchTarget + turn, -PITCH_LIMIT, PITCH_LIMIT);
      if (keys.has("arrowdown")) pitchTarget = THREE.MathUtils.clamp(pitchTarget - turn, -PITCH_LIMIT, PITCH_LIMIT);

      const lk = Math.min(1, dt * LOOK_EASE);
      yaw += (yawTarget - yaw) * lk;
      pitch += (pitchTarget - pitch) * lk;
      camera.rotation.set(pitch, yaw, 0, "YXZ");

      vel.y = 0;
      const speed = vel.length();
      const cap = MAX_SPEED * (keys.has("shift") ? BOOST : 1);
      if (speed > cap) vel.multiplyScalar(cap / speed);
      camera.position.addScaledVector(vel, dt);
      vel.multiplyScalar(Math.exp(-dt / DAMP_TAU));

      resolve(camera.position);

      if (opts.floorHeightAt) {
        // Follow the floor field: small rises are steps (snap up), a big rise is
        // a wall (block the move), and being above the floor settles down at a
        // fixed fall speed so stepping off the deck reads as a drop, not a warp.
        const targetFoot = opts.floorHeightAt(camera.position.x, camera.position.z);
        if (targetFoot - footY > STEP_UP_MAX) {
          camera.position.x = startX;
          camera.position.z = startZ;
          vel.set(0, 0, 0);
        } else if (targetFoot >= footY) {
          footY = targetFoot;
        } else {
          footY = Math.max(targetFoot, footY - FALL_SPEED * dt);
        }
        camera.position.y = footY + eye;
      } else {
        camera.position.y = opts.floorY + eye;
      }
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
