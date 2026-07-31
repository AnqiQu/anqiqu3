# Sandbox 3D World — As Built (updated 2026-07-30)

`/sandbox` is now a drag-explorable Three.js open world: the camera orbits the
floating island video-game style (drag rotates/tilts, pinch or wheel zooms
within limits), with raycast hover labels and fade-to-navigate, while
preserving the painted 2D solarpunk world as the server-rendered fallback.
The original scroll-rail descent (danielqli-style) shipped first and was
replaced by orbit controls at user request on 2026-07-30.

## Architecture

- **Progressive enhancement.** [page.tsx](../../app/sandbox/page.tsx) wraps the
  unchanged server-rendered 2D scene in a `"use client"` gate
  ([sandbox-experience.tsx](../../app/sandbox/components/sandbox-experience.tsx)).
  The gate stays in `data-mode="flat"` for `?flat`, `prefers-reduced-motion`, or
  missing WebGL; otherwise it lazy-imports the world (three.js lives only in that
  chunk, ~503KB raw / ≈125KB gz) and flips to `data-mode="3d"` after the first
  rendered frame. All rendered-HTML test assertions stay server-side and green.
- **Config-driven placement.** `SandboxLocation.world3d` in
  [config.ts](../../app/sandbox/config.ts): `position`, `rotationY?`,
  `labelOffsetY`, `hitRadius`. Modules sample `terrainHeight(x, z)`
  ([terrain.ts](../../app/sandbox/components/world/terrain.ts)) rather than
  trusting config Y.
- **UI bridge.** Engine ↔ overlay communicate through
  [ui-bridge.ts](../../app/sandbox/components/ui-bridge.ts) (chip positioning via
  inline transforms, hover state, fade-then-navigate) so neither side holds React
  or Three references of the other.

## World modules (app/sandbox/components/world/)

`engine.ts` (renderer, lights, fog, viewport self-healing, rAF + hidden-tab pause,
dispose) · `palette.ts` (solarpunk hexes + cached Lambert factory) · `terrain.ts`
(shared height field: hill, pond basin, terraces, rim droop) · `sky.ts` (gradient
dome, sun + halo, instanced cloud puffs + cloud sea) · `island.ts` (vertex-colored
meadow cap, cliff skirt, under-rocks, vines, islets, instanced trees/flowers/path
stones, lanterns, blob shadows; cap + cliff tagged `userData.occluder`) ·
`orbit-rig.ts` (OrbitControls: pan disabled so the island stays centered, damping,
distance 15–110, polar 0.35–1.68, portrait FOV compensation, `flyTo` easing for
keyboard nav, `?view=azimuth,polar,distance` pin for QA screenshots) ·
`interactions.ts` (invisible raycast proxies + terrain occluders in one raycast,
hover, click, grab/grabbing/pointer cursors) · `creatures.ts` (dogs with
run/idle/sit state machine on a patrol loop, koi, birds, butterflies) ·
`blimps.ts` (3 solar blimps drifting) · `landmarks/` (observatory, energy =
turbines + solar array, archive with openable door, greenhouse, pond, unfinished
bridge with dangling plank, return sign).

## Camera (orbit)

Home view: azimuth 0, polar 1.12, distance 85 — the island floating among
clouds with the floating title. Drag orbits (three.js OrbitControls defaults:
drag down = camera rises), wheel/pinch dollies. The page never scrolls in 3D
mode (`height: 100svh; overflow: hidden`; `touch-action: none` on the canvas).
Title + hint dismiss on first pointer/wheel interaction.

## Interaction (v1 scope, user-confirmed)

Hover/focus reveals a label chip (2D `.sandbox-label` visual language, projected
from world space; chip CSS must stay at the end of sandbox.css to out-cascade the
2D mobile label rules). Terrain occluders keep landmarks hidden behind the hill
from being hovered through it. Only the return sign navigates (fade →
`router.push("/")`); the archive door swings open on click as a flourish. A
visually-hidden nav lists all locations for keyboard users (entries fly the
camera to face the landmark via `rig.flyTo`); a persistent "← server room" chip
is always available. Config `href`s for the four content sub-routes remain inert
data until those pages exist.

## Measured footprint

243 draw calls · 48.5k triangles · 13 shader programs · 0 textures ·
141 geometries. Pixel ratio capped at 2, log depth buffer, no shadow maps
(blob shadows), ≤3 lights, `NoToneMapping` (palette is authored in sRGB).

## Verification checklist (all passing 2026-07-28)

- `npm run lint` clean; `npm run test` (build + rendered-HTML suite) 5/5.
- three.js absent from all non-sandbox chunks.
- `?flat=1` serves the painted scene ("Classic painted view" badge).
- Desktop keyframes t=0/0.25/0.5/0.75/1 and mobile 375×812 screenshot-reviewed
  against `review/sandbox-1440x900.png` composition beats.
- Hover chip verified (Observatory), return-sign navigation verified end-to-end.
- Route-change dispose: no console errors or GL context warnings after round trips.

## Notes / future work

- Interiors, time-of-day, and freecam were deliberately out of scope (v1).
- When `/sandbox/research|archive|preferences|ideas` pages exist, wire clicks by
  extending `interactions.ts` click dispatch (the fade + navigate path already
  exists for the return sign).
- Embedded-browser quirk worth remembering: hidden documents can report a 0×0
  viewport; the engine self-heals per frame and never lets the renderer write
  inline canvas styles.
