import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Video-game style exploration: drag orbits the camera around the floating
// island, wheel/pinch zooms between vista and close-up. Limits keep the user
// from flying under the meadow, straight overhead, or out into the fog.

const TARGET = new THREE.Vector3(0, 2, 0);
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

export type OrbitRig = {
  update: (dt: number) => void;
  // Ease the camera to face a world position from a given distance (keyboard
  // nav). Any pointer input cancels the flight.
  flyTo: (worldPos: [number, number, number], distance?: number) => void;
  dispose: () => void;
};

export function createOrbitRig(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement): OrbitRig {
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(TARGET);
  controls.enablePan = false; // island stays centered — you can't lose it
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.7;
  controls.minDistance = 15;
  controls.maxDistance = 110;
  controls.minPolarAngle = 0.35; // not straight overhead
  controls.maxPolarAngle = 1.68; // may dip just below the horizon, not under the island

  // ?view=azimuth,polar,distance pins the camera for reproducible QA shots.
  const spherical = new THREE.Spherical(HOME.distance, HOME.polar, HOME.azimuth);
  const pinned = new URLSearchParams(window.location.search).get("view");
  if (pinned) {
    const [azimuth, polar, distance] = pinned.split(",").map(Number);
    spherical.set(
      distance || HOME.distance,
      THREE.MathUtils.clamp(polar || HOME.polar, controls.minPolarAngle, controls.maxPolarAngle),
      azimuth || 0,
    );
  }
  camera.position.setFromSpherical(spherical).add(TARGET);
  camera.lookAt(TARGET);
  controls.update();

  let flight: THREE.Spherical | null = null;
  const cancelFlight = () => {
    flight = null;
  };
  canvas.addEventListener("pointerdown", cancelFlight, { passive: true });
  canvas.addEventListener("wheel", cancelFlight, { passive: true });

  const scratch = new THREE.Spherical();
  const offset = new THREE.Vector3();

  return {
    update(dt) {
      if (flight) {
        scratch.setFromVector3(offset.copy(camera.position).sub(controls.target));
        // Shortest-path azimuth easing; exponential approach on all axes.
        let dAz = flight.theta - scratch.theta;
        dAz = Math.atan2(Math.sin(dAz), Math.cos(dAz));
        const k = Math.min(1, dt * 3.2);
        scratch.theta += dAz * k;
        scratch.phi += (flight.phi - scratch.phi) * k;
        scratch.radius += (flight.radius - scratch.radius) * k;
        camera.position.setFromSpherical(scratch).add(controls.target);
        if (Math.abs(dAz) < 0.01 && Math.abs(flight.phi - scratch.phi) < 0.01 && Math.abs(flight.radius - scratch.radius) < 0.3) {
          flight = null;
        }
      }
      controls.update(dt);
    },
    flyTo(worldPos, distance = 32) {
      flight = new THREE.Spherical(
        THREE.MathUtils.clamp(distance, controls.minDistance, controls.maxDistance),
        1.15,
        Math.atan2(worldPos[0] - TARGET.x, worldPos[2] - TARGET.z),
      );
    },
    dispose() {
      canvas.removeEventListener("pointerdown", cancelFlight);
      canvas.removeEventListener("wheel", cancelFlight);
      controls.dispose();
    },
  };
}
