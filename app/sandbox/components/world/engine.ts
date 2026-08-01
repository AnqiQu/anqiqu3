import * as THREE from "three";
import type { SandboxLocation } from "../../config";
import type { UiBridge } from "../ui-bridge";
import { createInteractions } from "./interactions";
import { P, disposeMaterialCache } from "./palette";
import { buildBlimps } from "./blimps";
import { buildCreatures } from "./creatures";
import { buildIsland } from "./island";
import { buildArchive } from "./landmarks/archive";
import { buildBridge } from "./landmarks/bridge";
import { buildEnergy } from "./landmarks/energy";
import { buildGreenhouse } from "./landmarks/greenhouse";
import { buildObservatory } from "./landmarks/observatory";
import { buildPond } from "./landmarks/pond";
import { createOrbitRig, fovForAspect } from "./orbit-rig";
import { SUN_POSITION, buildSky } from "./sky";
import { buildSkyTitle } from "./sky-title";
import type { WorldModule } from "./types";

export type WorldOptions = {
  canvas: HTMLCanvasElement;
  locations: SandboxLocation[];
  ui: UiBridge;
  onFirstFrame?: () => void;
};

export type WorldHandle = {
  dispose: () => void;
};

export function createWorld({ canvas, locations, ui, onFirstFrame }: WorldOptions): WorldHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    // Log depth avoids z-fighting on mobile GPUs with 16-bit depth buffers.
    logarithmicDepthBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(P.skyTop);
  // Palette hexes are authored in sRGB; tone mapping would gray out the brights.
  renderer.toneMapping = THREE.NoToneMapping;

  // Viewport size via documentElement, not window.innerWidth: the canvas is
  // display:none until the first frame paints (and embedded browsers can
  // report innerWidth 0 at load), so CSS keeps the canvas full-viewport and
  // the renderer only ever touches the drawing buffer (updateStyle=false).
  const viewportSize = () => ({
    w: Math.max(1, document.documentElement.clientWidth),
    h: Math.max(1, document.documentElement.clientHeight),
  });
  let size = viewportSize();
  renderer.setSize(size.w, size.h, false);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(P.fog, 90, 220);

  const camera = new THREE.PerspectiveCamera(fovForAspect(size.w / size.h), size.w / size.h, 0.5, 600);
  const rig = createOrbitRig(camera, canvas);

  // Painterly cheat: the visible sun sits back-left for the vista, but the key
  // light comes from the front-top-right so camera-facing slopes stay bright.
  // Warm sand ground color keeps undersides (cliff, cloud bottoms) from going
  // muddy dark.
  const hemi = new THREE.HemisphereLight(0xbfe8ff, 0xd9c39a, 0.95);
  const sunLight = new THREE.DirectionalLight(0xfff0c0, 1.5);
  sunLight.position.set(30, 60, 40);
  // Rim light down the visible sun's own vector: it can't be the key (it would
  // backlight the vista) but it puts a warm sunlit edge on the far side of
  // everything, which is what actually sells the sunshine.
  const sunRim = new THREE.DirectionalLight(0xffd79c, 0.55);
  sunRim.position.copy(SUN_POSITION);
  scene.add(hemi, sunLight, sunRim);

  // Landmark placement comes from config world3d (x/z only — modules sample
  // the terrain height field themselves).
  const at = (id: string): { x: number; z: number; rotationY: number } => {
    const loc = locations.find((l) => l.id === id)?.world3d;
    return loc
      ? { x: loc.position[0], z: loc.position[2], rotationY: loc.rotationY ?? 0 }
      : { x: 0, z: 0, rotationY: 0 };
  };
  const obs = at("observatory");
  const arc = at("archive");
  const gar = at("garden");
  const bri = at("unfinished-bridge");

  const observatory = buildObservatory(obs.x, obs.z);
  const archive = buildArchive(arc.x, arc.z, arc.rotationY);
  const greenhouse = buildGreenhouse(gar.x, gar.z, gar.rotationY);
  const pond = buildPond();
  const bridge = buildBridge(bri.x, bri.z, bri.rotationY);

  const skyTitle = buildSkyTitle();
  const island = buildIsland();

  const modules: WorldModule[] = [
    buildSky(),
    skyTitle,
    island,
    observatory,
    buildEnergy(),
    archive,
    greenhouse,
    pond,
    bridge,
    buildCreatures(),
    buildBlimps(),
  ];
  for (const m of modules) scene.add(m.group);

  // The sky title is the opening card: the first drag or zoom clears it.
  const dismissTitle = () => skyTitle.dismiss();
  canvas.addEventListener("pointerdown", dismissTitle, { once: true, passive: true });
  canvas.addEventListener("wheel", dismissTitle, { once: true, passive: true });

  // Hover highlight targets + archive door flourish. The pond is deliberately
  // absent: it's not selectable — clicking its water makes ripples instead.
  const landmarkGroups = new Map<string, THREE.Group>([
    ["observatory", observatory.group],
    ["archive", archive.group],
    ["garden", greenhouse.group],
    ["unfinished-bridge", bridge.group],
    ["bench-plaque", island.plaque],
  ]);
  let archiveOpen = false;
  ui.toggleArchive = () => {
    archiveOpen = !archiveOpen;
    (archive as unknown as { setOpen: (open: boolean) => void }).setOpen(archiveOpen);
  };
  // Keyboard nav: fly the orbit camera to face a landmark.
  ui.flyToLocation = (id) => {
    const w = locations.find((l) => l.id === id)?.world3d;
    if (w) rig.flyTo(w.position, id === "observatory" ? 40 : 32);
  };

  const occluders: THREE.Object3D[] = [];
  scene.traverse((obj) => {
    if (obj.userData.occluder) occluders.push(obj);
  });
  rig.setColliders(occluders);
  const pondApi = pond as unknown as {
    waterMesh: THREE.Mesh;
    spawnRipple: (p: THREE.Vector3) => void;
  };
  const interactions = createInteractions(scene, canvas, locations, landmarkGroups, occluders, ui, {
    mesh: pondApi.waterMesh,
    onHit: (point) => pondApi.spawnRipple(point),
  });

  const applySize = () => {
    size = viewportSize();
    renderer.setSize(size.w, size.h, false);
    camera.aspect = size.w / size.h;
    camera.fov = fovForAspect(camera.aspect);
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", applySize);

  // rAF loop with hidden-tab pause. dt is clamped so a resume after a long
  // pause doesn't teleport animations.
  const timer = new THREE.Timer();
  let rafId = 0;
  let firstFrame = true;
  const frame = () => {
    rafId = requestAnimationFrame(frame);
    // Self-heal if the viewport changed without a resize event (embedded
    // browsers, mobile URL bars).
    const now = viewportSize();
    if (now.w !== size.w || now.h !== size.h) applySize();
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.1);
    const t = timer.getElapsed();
    rig.update(dt);
    for (const m of modules) m.update?.(t, dt);
    interactions.update(camera);
    renderer.render(scene, camera);
    if (firstFrame) {
      firstFrame = false;
      onFirstFrame?.();
    }
  };
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      timer.update(); // swallow the paused span so dt doesn't spike
      frame();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
  frame();

  return {
    dispose() {
      cancelAnimationFrame(rafId);
      rig.dispose();
      interactions.dispose();
      canvas.removeEventListener("pointerdown", dismissTitle);
      canvas.removeEventListener("wheel", dismissTitle);
      window.removeEventListener("resize", applySize);
      document.removeEventListener("visibilitychange", onVisibility);
      for (const m of modules) m.dispose();
      disposeMaterialCache();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
