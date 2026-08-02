import * as THREE from "three";
import { P } from "./palette";
import type { WorldModule } from "./types";
import { rng } from "./util";

// Where the sun hangs. Kept low: the orbit rig never pitches far enough above
// the horizon to show a high sun, so anything steeper would be permanently off
// screen. engine.ts aims a warm rim light down this same vector.
export const SUN_POSITION = new THREE.Vector3(-95, 29, -262);

// The sun's glare, painted once into a canvas: a radial falloff plus a fan of
// soft rays. Stacked translucent discs left visible concentric edges, and a
// gradient is the one thing flat geometry can't fake.
function sunGlareTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  ctx.translate(c, c);

  // Rays first: long thin wedges, brightest at the root. 'lighter' keeps the
  // overlaps at the center from darkening each other.
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const reach = c * (i % 2 ? 0.62 : 0.92);
    const spread = i % 2 ? 0.05 : 0.032;
    const fade = ctx.createLinearGradient(0, 0, Math.cos(angle) * reach, Math.sin(angle) * reach);
    fade.addColorStop(0, "rgba(255, 233, 172, 0.36)");
    fade.addColorStop(0.35, "rgba(255, 229, 160, 0.09)");
    fade.addColorStop(1, "rgba(255, 229, 160, 0)");
    ctx.fillStyle = fade;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, reach, angle - spread, angle + spread);
    ctx.closePath();
    ctx.fill();
  }

  // Core falloff over the top.
  const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, c);
  bloom.addColorStop(0, "rgba(255, 250, 228, 0.85)");
  bloom.addColorStop(0.12, "rgba(255, 240, 190, 0.42)");
  bloom.addColorStop(0.34, "rgba(255, 228, 158, 0.13)");
  bloom.addColorStop(1, "rgba(255, 226, 152, 0)");
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(0, 0, c, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Sky dome, sun, and two cloud layers: drifting puff clusters overhead and a
// cloud sea below the island so it reads as floating.
export function buildSky(): WorldModule {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // Dome: vertex-colored gradient, zenith → horizon, plus a warm bloom around
  // the sun. Fog must not apply or the whole dome would flatten to the fog
  // color. Tessellation is high enough for the bloom to read as a soft wash.
  const domeGeo = new THREE.SphereGeometry(300, 48, 24);
  const top = new THREE.Color(P.skyTop);
  const horizon = new THREE.Color(P.skyHorizon);
  // Pale warm wash for the sky right around the sun — a more saturated glow
  // spread this wide would read as sunset haze instead of a blue sunny sky.
  const sunHaze = new THREE.Color(P.sunGlow);
  const sunDir = SUN_POSITION.clone().normalize();
  const vertexDir = new THREE.Vector3();
  const domeColors: number[] = [];
  const pos = domeGeo.attributes.position;
  const scratch = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    // y ranges -300..300; blend on height so below-horizon stays bright too
    // (the camera looks down past the island at a cloud sea).
    const h = THREE.MathUtils.clamp(pos.getY(i) / 300, -1, 1);
    // Reach the zenith blue early: the camera sits low on the dome, so a slow
    // ramp would leave the whole visible sky washed out at the horizon tint.
    scratch.copy(horizon).lerp(top, THREE.MathUtils.smoothstep(h, -0.05, 0.42));
    // Sun haze: warm wash falling off within ~35° of the sun.
    const facing = vertexDir.fromBufferAttribute(pos, i).normalize().dot(sunDir);
    const haze = THREE.MathUtils.smoothstep(facing, 0.82, 1) ** 2;
    if (haze > 0) scratch.lerp(sunHaze, haze * 0.6);
    domeColors.push(scratch.r, scratch.g, scratch.b);
  }
  domeGeo.setAttribute("color", new THREE.Float32BufferAttribute(domeColors, 3));
  const domeMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false });
  group.add(new THREE.Mesh(domeGeo, domeMat));
  geometries.push(domeGeo);
  materials.push(domeMat);

  // Sun disc in the back-left sky, sitting in its painted glare. The key
  // light's direction is a painterly cheat and does not match this — see
  // engine.ts — but a rim light does.
  // Face the midpoint of the camera rail; close enough for a static billboard.
  const faceCamera = new THREE.Vector3(0, 15, 60);
  const outward = SUN_POSITION.clone().normalize();

  const glareTex = sunGlareTexture();
  const glareGeo = new THREE.PlaneGeometry(124, 124);
  const glareMat = new THREE.MeshBasicMaterial({
    map: glareTex,
    fog: false,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const glare = new THREE.Mesh(glareGeo, glareMat);
  // Just behind the disc so the transparent sort keeps them in order.
  glare.position.copy(SUN_POSITION).addScaledVector(outward, 2);
  glare.lookAt(faceCamera);
  group.add(glare);
  geometries.push(glareGeo);
  materials.push(glareMat);

  const sunGeo = new THREE.CircleGeometry(10, 28);
  const sunMat = new THREE.MeshBasicMaterial({ color: P.sun, fog: false });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.copy(SUN_POSITION);
  sun.lookAt(faceCamera);
  group.add(sun);
  geometries.push(sunGeo);
  materials.push(sunMat);

  // Cloud puffs: one InstancedMesh, cluster offsets baked into the matrices.
  // Lambert + a neutral emissive floor keeps them white and softly shaded
  // rather than gray on the unlit side.
  const puffGeo = new THREE.SphereGeometry(1, 10, 8);
  const puffMat = new THREE.MeshLambertMaterial({ color: P.cloud });
  // High neutral emissive floor: clouds should stay white even on unlit faces.
  puffMat.emissive.setHex(0xa8a6a2);
  geometries.push(puffGeo);
  materials.push(puffMat);

  const rand = rng(20260728);
  const matrices: THREE.Matrix4[] = [];
  const dummy = new THREE.Object3D();

  const addCluster = (cx: number, cy: number, cz: number, scale: number, puffs: number) => {
    for (let i = 0; i < puffs; i++) {
      const spread = scale * 1.6;
      dummy.position.set(
        cx + (rand() - 0.5) * spread * 2.2,
        cy + (rand() - 0.5) * spread * 0.55,
        cz + (rand() - 0.5) * spread,
      );
      const s = scale * (0.55 + rand() * 0.75);
      dummy.scale.set(s * (1.1 + rand() * 0.5), s * 0.62, s);
      dummy.rotation.y = rand() * Math.PI;
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    }
  };

  // Overhead / mid-height clusters around (not over) the island.
  const upperClusters: Array<[number, number, number, number]> = [
    [-70, 26, -60, 4.2], [65, 32, -85, 5], [30, 22, -130, 6], [-110, 18, -30, 5],
    [95, 24, 20, 4.4], [-55, 34, 60, 4], [55, 16, 75, 3.6], [-30, 40, -110, 5.5],
  ];
  for (const [x, y, z, s] of upperClusters) addCluster(x, y, z, s, 4);

  // Cloud sea: a broad ring of larger puffs well below and away from the rim,
  // so the island reads as floating high instead of beached on cloud banks.
  for (let i = 0; i < 22; i++) {
    const angle = (i / 22) * Math.PI * 2;
    const radius = 50 + rand() * 45;
    addCluster(Math.cos(angle) * radius, -22 - rand() * 9, Math.sin(angle) * radius * 0.85, 7 + rand() * 4, 3);
  }

  const puffs = new THREE.InstancedMesh(puffGeo, puffMat, matrices.length);
  matrices.forEach((m, i) => puffs.setMatrixAt(i, m));
  puffs.instanceMatrix.needsUpdate = true;
  puffs.renderOrder = 0;
  group.add(puffs);

  return {
    group,
    update(t) {
      // Whole-layer drift: rotating the instanced mesh costs nothing per puff.
      puffs.rotation.y = t * 0.004;
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      glareTex.dispose();
      puffs.dispose();
    },
  };
}
