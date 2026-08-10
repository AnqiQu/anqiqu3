import * as THREE from "three";
import { fovForAspect } from "../fly-rig";
import { buildArchiveHall } from "./archive-hall";
import { buildBridgeView } from "./bridge-view";
import { buildGreenhouseRoom } from "./greenhouse-room";
import { buildObservatoryLab } from "./observatory-lab";
import { createWalkRig } from "./walk-rig";
import type { Interior } from "./types";

// Interior sessions: each enterable landmark swaps the renderer to one of
// these — a self-contained scene, a walking camera, and a door whose click
// (or the Escape key) hands control back to the island.

const BUILDERS: Record<string, () => Interior> = {
  observatory: buildObservatoryLab,
  archive: buildArchiveHall,
  garden: buildGreenhouseRoom,
  "unfinished-bridge": buildBridgeView,
};

export const isInteriorId = (id: string): boolean => id in BUILDERS;

export type InteriorHandle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update: (t: number, dt: number) => void;
  resize: (aspect: number) => void;
  dispose: () => void;
};

const GLOW = new THREE.Color(0x4a3d22);

export function createInterior(
  id: string,
  canvas: HTMLCanvasElement,
  aspect: number,
  onExit: () => void,
): InteriorHandle | null {
  const build = BUILDERS[id];
  if (!build) return null;
  const interior = build();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(interior.background);
  if (interior.fog) scene.fog = new THREE.Fog(interior.fog.color, interior.fog.near, interior.fog.far);
  scene.add(interior.group);

  const camera = new THREE.PerspectiveCamera(fovForAspect(aspect), aspect, 0.05, interior.far ?? 200);
  const rig = createWalkRig(camera, canvas, interior);

  // Door hover + click, with the same drag-vs-click discrimination the island
  // uses so a look-around drag ending on the door doesn't walk you out.
  const raycaster = new THREE.Raycaster();
  const client = new THREE.Vector2();
  const pointer = new THREE.Vector2();
  let pointerInside = false;
  let dragging = false;
  let downAt: { x: number; y: number; time: number } | null = null;
  let hovered = false;
  let glowLevel = 0;
  const doorBase = interior.doorGlow.map((m) => m.emissive.clone());

  // Beacon orbs (or any link objects) that navigate away when clicked. We track
  // which one the pointer is over so the up-click can follow it, and flatten the
  // meshes into one raycast list for the hover test.
  const links = interior.links ?? [];
  const linkMeshes = links.flatMap((l) => l.meshes);
  let hoveredLink: { href: string; newTab?: boolean } | null = null;

  const setPointer = (event: PointerEvent) => {
    client.set(event.clientX, event.clientY);
    pointerInside = true;
  };
  const onLeave = () => {
    pointerInside = false;
  };
  const onDown = (event: PointerEvent) => {
    setPointer(event);
    dragging = true;
    downAt = { x: event.clientX, y: event.clientY, time: performance.now() };
  };
  const onUp = (event: PointerEvent) => {
    dragging = false;
    if (!downAt) return;
    const moved = Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y);
    const elapsed = performance.now() - downAt.time;
    downAt = null;
    if (moved > 8 || elapsed > 500) return;
    if (hoveredLink) {
      if (hoveredLink.newTab) window.open(hoveredLink.href, "_blank", "noopener,noreferrer");
      else window.location.href = hoveredLink.href;
    } else if (hovered) onExit();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") onExit();
  };
  canvas.addEventListener("pointermove", setPointer, { passive: true });
  canvas.addEventListener("pointerdown", onDown, { passive: true });
  canvas.addEventListener("pointerup", onUp, { passive: true });
  canvas.addEventListener("pointerleave", onLeave, { passive: true });
  window.addEventListener("keydown", onKeyDown);

  return {
    scene,
    camera,
    update(t, dt) {
      rig.update(dt);
      interior.update?.(t, dt);

      hovered = false;
      hoveredLink = null;
      let hoveredLinkObj: THREE.Object3D | null = null;
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      if (pointerInside && width > 0 && height > 0) {
        pointer.x = (client.x / width) * 2 - 1;
        pointer.y = -((client.y / height) * 2 - 1);
        raycaster.setFromCamera(pointer, camera);
        // A link orb takes precedence over the door when both sit under the
        // pointer; find the nearest link mesh and resolve it back to its href.
        if (linkMeshes.length) {
          const linkHit = raycaster.intersectObjects(linkMeshes, false)[0]?.object ?? null;
          if (linkHit) {
            hoveredLink = links.find((l) => l.meshes.includes(linkHit)) ?? null;
            hoveredLinkObj = linkHit;
          }
        }
        hovered = !hoveredLink && raycaster.intersectObjects(interior.doorMeshes, false).length > 0;
      }
      // Let the room light up whatever the pointer is over (or nothing).
      interior.onHoverLink?.(hoveredLinkObj);
      canvas.style.cursor = hovered || hoveredLink ? "pointer" : dragging ? "grabbing" : "grab";

      const target = hovered ? 1 : 0;
      glowLevel += (target - glowLevel) * 0.16;
      if (target === 0 && glowLevel < 0.004) glowLevel = 0;
      interior.doorGlow.forEach((m, i) => m.emissive.copy(doorBase[i]).lerp(GLOW, glowLevel));
    },
    resize(aspect) {
      camera.aspect = aspect;
      camera.fov = fovForAspect(aspect);
      camera.updateProjectionMatrix();
    },
    dispose() {
      canvas.removeEventListener("pointermove", setPointer);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("keydown", onKeyDown);
      rig.dispose();
      interior.dispose();
    },
  };
}
