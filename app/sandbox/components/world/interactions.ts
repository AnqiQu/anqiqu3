import * as THREE from "three";
import type { SandboxLocation } from "../../config";
import type { UiBridge } from "../ui-bridge";

// Raycast hover + clicks for the island camera. Hotspots are invisible-material
// spheres (they still raycast; the renderer skips them). Terrain meshes tagged
// as occluders join the same raycast so landmarks hidden behind the island
// can't be hovered through it. Hover announces itself with a glow and a scale
// breath — no label chips — and a click on an enterable landmark steps inside.

type Hotspot = {
  location: SandboxLocation;
  proxy: THREE.Mesh;
};

export type Interactions = {
  hoveredId: string | null;
  update: (camera: THREE.PerspectiveCamera) => void;
  // While an interior is open, the island must not hover, click, or fight the
  // interior for the cursor.
  setEnabled: (enabled: boolean) => void;
  dispose: () => void;
};

export type WaterClick = {
  mesh: THREE.Mesh;
  onHit: (point: THREE.Vector3) => void;
};

export function createInteractions(
  scene: THREE.Scene,
  canvas: HTMLCanvasElement,
  locations: SandboxLocation[],
  landmarkGroups: Map<string, THREE.Group>,
  occluders: THREE.Object3D[],
  ui: UiBridge,
  waterClick?: WaterClick,
  // Fires whenever the hovered landmark changes (also from keyboard focus);
  // the engine uses it for per-landmark flourishes like the burrow door.
  onHoverChange?: (id: string | null) => void,
): Interactions {
  const raycaster = new THREE.Raycaster();
  // Raw client coords; converted to NDC per frame (event-time layout can be
  // stale, e.g. hidden tabs report zero-size rects).
  const client = new THREE.Vector2();
  const pointer = new THREE.Vector2();
  let pointerInside = false;
  let dragging = false;
  let enabled = true;
  let downAt: { x: number; y: number; time: number } | null = null;
  let lastCamera: THREE.PerspectiveCamera | null = null;

  // Hover glow. Landmark meshes draw their materials from the shared palette
  // cache, so lighting one up in place would light every object anywhere that
  // happens to share a color — each landmark gets private clones instead, and
  // hover lifts their emissive off whatever floor the original set.
  const GLOW = new THREE.Color(0x3a3524);
  type Glow = { material: THREE.MeshLambertMaterial; base: THREE.Color };
  const glows = new Map<string, Glow[]>();
  const glowLevels = new Map<string, number>();
  for (const [id, group] of landmarkGroups) {
    const cloned = new Map<THREE.Material, THREE.MeshLambertMaterial>();
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const source = mesh.material;
      if (Array.isArray(source) || !(source instanceof THREE.MeshLambertMaterial)) return;
      let clone = cloned.get(source);
      if (!clone) {
        clone = source.clone();
        cloned.set(source, clone);
      }
      mesh.material = clone;
    });
    glows.set(
      id,
      [...cloned.values()].map((material) => ({ material, base: material.emissive.clone() })),
    );
    glowLevels.set(id, 0);
  }

  const proxyGeo = new THREE.SphereGeometry(1, 8, 6);
  const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
  const hotspots: Hotspot[] = [];
  for (const location of locations) {
    const w = location.world3d;
    // Ambient spots (the pond) are scenery, not selectable landmarks.
    if (!w || location.interaction === "ambient") continue;
    const proxy = new THREE.Mesh(proxyGeo, proxyMat);
    proxy.position.set(w.position[0], w.position[1] + w.hitOffsetY, w.position[2]);
    proxy.scale.setScalar(w.hitRadius);
    proxy.userData.locationId = location.id;
    scene.add(proxy);
    hotspots.push({ location, proxy });
  }
  const raycastTargets = [...hotspots.map((h) => h.proxy), ...occluders];
  // Spots whose click opens their copy rather than stepping inside.
  const panelIds = new Set(
    locations.filter((l) => l.interaction === "open-panel").map((l) => l.id),
  );
  const enterIds = new Set(locations.filter((l) => l.interaction === "enter").map((l) => l.id));

  const setPointer = (event: PointerEvent) => {
    client.set(event.clientX, event.clientY);
    pointerInside = true;
  };
  const onLeave = () => {
    pointerInside = false;
  };
  const onDown = (event: PointerEvent) => {
    if (!enabled) return;
    setPointer(event);
    dragging = true;
    downAt = { x: event.clientX, y: event.clientY, time: performance.now() };
  };
  const onUp = (event: PointerEvent) => {
    dragging = false;
    if (!enabled || !downAt) return;
    const moved = Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y);
    const elapsed = performance.now() - downAt.time;
    downAt = null;
    if (moved > 8 || elapsed > 500) return; // camera drag, not a click
    if (api.hoveredId && enterIds.has(api.hoveredId)) ui.enterInterior?.(api.hoveredId);
    else if (api.hoveredId && panelIds.has(api.hoveredId)) ui.openPanel(api.hoveredId);
    else if (waterClick && lastCamera) {
      // A plain click on the pond water makes ripples.
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      if (width > 0 && height > 0) {
        pointer.x = (event.clientX / width) * 2 - 1;
        pointer.y = -((event.clientY / height) * 2 - 1);
        raycaster.setFromCamera(pointer, lastCamera);
        const hit = raycaster.intersectObject(waterClick.mesh, false)[0];
        if (hit) waterClick.onHit(hit.point);
      }
    }
  };
  canvas.addEventListener("pointermove", setPointer, { passive: true });
  canvas.addEventListener("pointerdown", onDown, { passive: true });
  canvas.addEventListener("pointerup", onUp, { passive: true });
  canvas.addEventListener("pointerleave", onLeave, { passive: true });

  // Keyboard focus in the overlay drives the same highlight path.
  let focusId: string | null = null;
  ui.onFocusHover = (id) => {
    focusId = id;
  };

  const setHovered = (id: string | null) => {
    if (id === api.hoveredId) return;
    api.hoveredId = id;
    ui.setHover(id);
    onHoverChange?.(id);
  };

  const api: Interactions = {
    hoveredId: null,
    update(camera) {
      if (!enabled) return;
      lastCamera = camera;
      let hovered: string | null = null;
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      if (pointerInside && width > 0 && height > 0) {
        pointer.x = (client.x / width) * 2 - 1;
        pointer.y = -((client.y / height) * 2 - 1);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(raycastTargets, false)[0];
        hovered = (hit?.object.userData.locationId as string) ?? null; // occluder hit → null
      }
      setHovered(hovered ?? focusId);
      const effective = api.hoveredId;
      canvas.style.cursor =
        effective && (enterIds.has(effective) || panelIds.has(effective))
          ? "pointer"
          : dragging
            ? "grabbing"
            : "grab";

      // Gentle scale breathing on the hovered landmark.
      for (const [id, group] of landmarkGroups) {
        const target = id === api.hoveredId ? 1.03 : 1;
        group.scale.setScalar(group.scale.x + (target - group.scale.x) * 0.15);
      }

      // ...and a soft glow, eased in and out over the same beat.
      for (const [id, list] of glows) {
        const settled = glowLevels.get(id) ?? 0;
        const target = id === api.hoveredId ? 1 : 0;
        let level = settled + (target - settled) * 0.16;
        if (target === 0 && level < 0.004) level = 0;
        if (level === settled) continue;
        glowLevels.set(id, level);
        for (const { material, base } of list) material.emissive.copy(base).lerp(GLOW, level);
      }
    },
    setEnabled(next) {
      enabled = next;
      if (!enabled) {
        dragging = false;
        downAt = null;
        pointerInside = false;
        setHovered(null);
      }
    },
    dispose() {
      canvas.removeEventListener("pointermove", setPointer);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      for (const h of hotspots) scene.remove(h.proxy);
      for (const list of glows.values()) {
        for (const { material } of list) material.dispose();
      }
      proxyGeo.dispose();
      proxyMat.dispose();
    },
  };
  return api;
}
