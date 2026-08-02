import * as THREE from "three";
import { P } from "./palette";
import type { WorldModule } from "./types";

// "SANDBOX" in extruded block letters, hung in the sky above the island as the
// opening title, then cleared the moment the visitor takes the controls.
//
// Letters are drawn as strokes inside a 1 × 1.5 letter box — [cx, cy, w, h] and
// an optional z rotation for the diagonals — and every stroke in the word ends
// up as one instance of a unit cube, so the whole title is a single draw call.

export type SkyTitle = WorldModule & { dismiss: () => void };

type Stroke = [cx: number, cy: number, w: number, h: number, rotation?: number];

const T = 0.26; // stroke thickness
const H = 1.5; // letter height

const LETTERS: Record<string, Stroke[]> = {
  S: [
    [0.5, 1.37, 1, T],
    [0.13, 1.06, T, 0.62],
    [0.5, 0.75, 1, T],
    [0.87, 0.44, T, 0.62],
    [0.5, 0.13, 1, T],
  ],
  A: [
    [0.13, 0.62, T, 1.24],
    [0.87, 0.62, T, 1.24],
    [0.5, 1.37, 1, T],
    [0.5, 0.62, 1, T],
  ],
  N: [
    [0.13, 0.75, T, H],
    [0.87, 0.75, T, H],
    [0.5, 0.75, 0.28, 1.58, 0.31],
  ],
  D: [
    [0.13, 0.75, T, H],
    [0.45, 1.37, 0.9, T],
    [0.45, 0.13, 0.9, T],
    [0.87, 0.75, T, 1.24],
  ],
  B: [
    [0.13, 0.75, T, H],
    [0.45, 1.37, 0.9, T],
    [0.45, 0.75, 0.9, T],
    [0.45, 0.13, 0.9, T],
    [0.87, 1.06, T, 0.62],
    [0.87, 0.44, T, 0.62],
  ],
  O: [
    [0.13, 0.75, T, 1.24],
    [0.87, 0.75, T, 1.24],
    [0.5, 1.37, 1, T],
    [0.5, 0.13, 1, T],
  ],
  X: [
    [0.5, 0.75, 0.28, 1.8, 0.588],
    [0.5, 0.75, 0.28, 1.8, -0.588],
  ],
};

const WORD = "SANDBOX";
const GAP = 0.28; // between letter boxes, in letter units
const DEPTH = 0.4; // extrusion, in letter units
// Width in world units and where the word hangs. Tuned against the opening
// camera (see orbit-rig HOME): it fills the middle half of the frame and clears
// the observatory dome below it. The rig can't pitch much above the horizon, so
// hanging it any higher would put it off screen. z sits ahead of the nearest
// blimp (whose envelope reaches z ≈ -28) so the word passes in front of them —
// they are opaque and would otherwise punch through it. Width is scaled to the
// shorter throw so the framing is unchanged.
const WIDTH = 68.5;
const ANCHOR = new THREE.Vector3(0, 27.1, -24);

export function buildSkyTitle(): SkyTitle {
  const group = new THREE.Group();
  group.position.copy(ANCHOR);

  const letters = [...WORD];
  const wordWidth = letters.length + (letters.length - 1) * GAP;
  const scale = WIDTH / wordWidth;
  const strokeCount = letters.reduce((n, ch) => n + LETTERS[ch].length, 0);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  // Its own material instance, not the shared cache: opacity is animated.
  const material = new THREE.MeshLambertMaterial({ color: P.titleYellow, transparent: true });
  // Warm floor: lifts the lit faces to a true pastel while leaving the
  // extruded sides a shade deeper, so the blocks still read as 3D.
  material.emissive.setHex(0x8c8754);
  const mesh = new THREE.InstancedMesh(boxGeo, material, strokeCount);

  const dummy = new THREE.Object3D();
  let i = 0;
  letters.forEach((ch, index) => {
    const originX = index * (1 + GAP) - wordWidth / 2;
    for (const [cx, cy, w, h, rotation = 0] of LETTERS[ch]) {
      dummy.position.set((originX + cx) * scale, (cy - H / 2) * scale, 0);
      dummy.rotation.set(0, 0, rotation);
      dummy.scale.set(w * scale, h * scale, DEPTH * scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i++, dummy.matrix);
    }
  });
  group.add(mesh);

  let dismissed = false;
  let life = 1;

  return {
    group,
    dismiss() {
      dismissed = true;
    },
    update(t, dt) {
      if (life <= 0) return;
      if (dismissed) {
        life = Math.max(0, life - dt * 1.7);
        material.opacity = life * life; // ease out, so it clears decisively
        if (life === 0) {
          group.visible = false;
          return;
        }
      }
      // Barely-there drift, so the word reads as hanging rather than pasted on.
      group.position.y = ANCHOR.y + Math.sin(t * 0.45) * 0.5;
    },
    dispose() {
      boxGeo.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}
