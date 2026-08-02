import * as THREE from "three";
import { P, mat } from "../palette";
import { OBSERVATORY_CENTER, terrainHeight } from "../terrain";
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

  // Emissive floor on the white parts: a bare Lambert pole reads gray on its
  // shaded half, which made the turbines look dingy against the sky.
  const white = () => mat(P.turbineWhite, { emissive: 0x454341 });

  const addTurbine = (x: number, z: number, scale: number, speed: number) => {
    const y = terrainHeight(x, z);
    const turbine = new THREE.Group();
    turbine.position.set(x, y, z);
    turbine.scale.setScalar(scale);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 9, 8), white());
    pole.position.y = 4.5;
    const nacelle = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.5, 4, 8), white());
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
      const blade = new THREE.Mesh(bladeGeo, white());
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

  // Solar array: two arcs of four panels terraced around the observatory pad on
  // the hill's north-west flank, with a lighter frame box under each panel to
  // suggest the grid lines. Placing them on the pad's contour (rather than on a
  // straight line across it) keeps each row level and each panel yawed to face
  // downhill, so the array follows the slope instead of stair-stepping off it —
  // and every panel stays a clear 6+ units from the drum it used to punch into.
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
    const radius = 6.1 + row * 1.5;
    for (let col = 0; col < 4; col++) {
      // Even 1.75-unit spacing along the arc, offset half a step per row.
      const angle = 2.44 + (col - 1.5 + row * 0.5) * (1.75 / radius);
      const px = OBSERVATORY_CENTER.x + Math.cos(angle) * radius;
      const pz = OBSERVATORY_CENTER.z + Math.sin(angle) * radius;
      const py = terrainHeight(px, pz);
      dummy.position.set(px, py + 0.62, pz);
      dummy.rotation.set(0, 0, 0);
      dummy.rotateY(Math.PI / 2 - angle); // panel faces away from the hill
      dummy.rotateX(0.52); // ...and tips down the fall line
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
