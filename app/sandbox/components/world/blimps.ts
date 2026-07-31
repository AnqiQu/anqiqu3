import * as THREE from "three";
import { P, mat } from "./palette";
import type { WorldModule } from "./types";

// Solar blimps drifting around the island — cream envelopes with teal bands,
// panel strips along their backs, and little wooden gondolas.

const BLIMPS: Array<{ pos: [number, number, number]; scale: number; phase: number }> = [
  { pos: [-20, 28, -30], scale: 1, phase: 0 },
  { pos: [18, 24, -40], scale: 0.7, phase: 2.3 },
  { pos: [4, 32, -55], scale: 0.45, phase: 4.1 },
];

export function buildBlimps(): WorldModule {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const crafts: Array<{ craft: THREE.Group; base: THREE.Vector3; phase: number }> = [];

  const envelopeGeo = new THREE.SphereGeometry(1, 20, 14);
  const bandGeo = new THREE.SphereGeometry(1.01, 20, 14);
  const panelGeo = new THREE.BoxGeometry(0.34, 0.05, 0.5);
  const gondolaGeo = new THREE.BoxGeometry(0.85, 0.24, 0.4);
  const ropeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.55, 5);
  const finGeo = new THREE.BoxGeometry(0.5, 0.5, 0.06);
  geometries.push(envelopeGeo, bandGeo, panelGeo, gondolaGeo, ropeGeo, finGeo);

  for (const { pos, scale, phase } of BLIMPS) {
    const craft = new THREE.Group();
    craft.position.set(...pos);
    craft.scale.setScalar(scale);

    const envelope = new THREE.Mesh(envelopeGeo, mat(P.blimpCream));
    envelope.scale.set(2.4, 1, 1);
    const band = new THREE.Mesh(bandGeo, mat(P.blimpTeal));
    band.scale.set(0.5, 1.02, 1.02);
    craft.add(envelope, band);

    // Solar strip along the top of the envelope.
    for (let i = -2; i <= 2; i++) {
      const panel = new THREE.Mesh(panelGeo, mat(P.panelNavy));
      const x = i * 0.42;
      panel.position.set(x * 2.2, Math.sqrt(Math.max(0, 1 - x * x)) * 0.99, 0);
      panel.rotation.z = -x * 0.55;
      craft.add(panel);
    }

    const gondola = new THREE.Mesh(gondolaGeo, mat(P.wood, { flat: true }));
    gondola.position.y = -1.32;
    craft.add(gondola);
    for (const side of [-1, 1]) {
      const rope = new THREE.Mesh(ropeGeo, mat(P.woodDark));
      rope.position.set(side * 0.32, -1.05, 0);
      rope.rotation.z = side * 0.18;
      craft.add(rope);
    }

    // Tail fins: one vertical, two horizontal.
    const finV = new THREE.Mesh(finGeo, mat(P.blimpTeal));
    finV.position.set(-2.35, 0.15, 0);
    finV.rotation.z = 0.2;
    craft.add(finV);
    for (const side of [-1, 1]) {
      const finH = new THREE.Mesh(finGeo, mat(P.blimpTeal));
      finH.position.set(-2.35, 0, side * 0.3);
      finH.rotation.x = Math.PI / 2;
      finH.rotation.z = 0.2;
      craft.add(finH);
    }

    group.add(craft);
    crafts.push({ craft, base: new THREE.Vector3(...pos), phase });
  }

  return {
    group,
    update(t) {
      for (const { craft, base, phase } of crafts) {
        craft.position.x = base.x + Math.sin(t * 0.1 + phase) * 3;
        craft.position.y = base.y + Math.sin(t * 0.23 + phase) * 0.8;
        craft.rotation.y = Math.sin(t * 0.07 + phase) * 0.07;
      }
    },
    dispose() {
      for (const g of geometries) g.dispose();
    },
  };
}
