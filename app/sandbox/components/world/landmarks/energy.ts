import * as THREE from "three";
import { P, mat } from "../palette";
import { terrainHeight } from "../terrain";
import type { WorldModule } from "../types";

// Renewables on the hill flank: two spinning wind turbines and a solar array.
export function buildEnergy(): WorldModule {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const bladeGroups: Array<{ pivot: THREE.Group; speed: number }> = [];

  const bladeGeo = new THREE.BoxGeometry(0.14, 3.2, 0.42);
  bladeGeo.translate(0, 1.6, 0);
  const tipGeo = new THREE.BoxGeometry(0.16, 0.5, 0.44);
  tipGeo.translate(0, 3.0, 0);
  geometries.push(bladeGeo, tipGeo);

  const addTurbine = (x: number, z: number, scale: number, speed: number) => {
    const y = terrainHeight(x, z);
    const turbine = new THREE.Group();
    turbine.position.set(x, y, z);
    turbine.scale.setScalar(scale);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 9, 8), mat(P.turbineWhite));
    pole.position.y = 4.5;
    const nacelle = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.5, 4, 8), mat(P.turbineWhite));
    nacelle.rotation.x = Math.PI / 2;
    nacelle.position.set(0, 9, 0.1);
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(P.brass));
    hub.position.set(0, 9, 0.62);
    geometries.push(
      (pole.geometry as THREE.BufferGeometry),
      (nacelle.geometry as THREE.BufferGeometry),
      (hub.geometry as THREE.BufferGeometry),
    );

    // Blade disc spins in the XY plane, facing the meadow (+z).
    const pivot = new THREE.Group();
    pivot.position.set(0, 9, 0.58);
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeo, mat(P.turbineWhite));
      const tip = new THREE.Mesh(tipGeo, mat(P.blimpTeal));
      blade.rotation.z = (i / 3) * Math.PI * 2;
      tip.rotation.z = (i / 3) * Math.PI * 2;
      pivot.add(blade, tip);
    }
    bladeGroups.push({ pivot, speed });

    turbine.add(pole, nacelle, hub, pivot);
    group.add(turbine);
  };

  addTurbine(-13, -15, 1, 0.8);
  addTurbine(-17.5, -11, 0.6, 1.15);

  // Solar array: two rows of four panels tilted toward the meadow, with a
  // lighter frame box under each panel to suggest the grid lines.
  const panelGeo = new THREE.BoxGeometry(1.5, 0.07, 1.05);
  const frameGeo = new THREE.BoxGeometry(1.58, 0.04, 1.13);
  const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6);
  geometries.push(panelGeo, frameGeo, legGeo);
  const panels = new THREE.InstancedMesh(panelGeo, mat(P.panelNavy), 8);
  const frames = new THREE.InstancedMesh(frameGeo, mat(P.panelLine), 8);
  const legs = new THREE.InstancedMesh(legGeo, mat(P.brass), 8);
  const dummy = new THREE.Object3D();
  let i = 0;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const px = -13.2 + col * 1.7 + row * 0.4;
      const pz = -11.5 + row * 1.5;
      const py = terrainHeight(px, pz);
      dummy.position.set(px, py + 0.62, pz);
      dummy.rotation.set(-0.52, 0.15, 0);
      dummy.updateMatrix();
      panels.setMatrixAt(i, dummy.matrix);
      dummy.position.y -= 0.06;
      dummy.updateMatrix();
      frames.setMatrixAt(i, dummy.matrix);
      dummy.position.set(px, py + 0.28, pz);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      legs.setMatrixAt(i, dummy.matrix);
      i++;
    }
  }
  group.add(panels, frames, legs);

  return {
    group,
    update(_t, dt) {
      for (const { pivot, speed } of bladeGroups) pivot.rotation.z += speed * dt;
    },
    dispose() {
      for (const g of geometries) g.dispose();
      panels.dispose();
      frames.dispose();
      legs.dispose();
    },
  };
}
