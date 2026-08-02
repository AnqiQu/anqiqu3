# Sandbox 3D World — As Built (updated 2026-07-30)

`/sandbox` is now a drag-explorable Three.js open world: the camera orbits the
floating island video-game style (drag rotates/tilts, pinch or wheel zooms
within limits), with raycast hover labels and fade-to-navigate.
The original scroll-rail descent (danielqli-style) shipped first and was
replaced by orbit controls at user request on 2026-07-30. The painted 2D
scene was fully retired on 2026-07-31 (component, config art fields, and CSS
deleted), and its assets were deleted with it: the sprite sheets, scene
plates, source art, the `/sandbox/asset-review` page, and the extract script
are all gone. The world is geometry only — nothing under `public/` feeds it.

## Architecture

- **Loading gate.** [page.tsx](../../app/sandbox/page.tsx) renders only the
  `"use client"` gate
  ([sandbox-experience.tsx](../../app/sandbox/components/sandbox-experience.tsx)).
  The server-rendered state is `data-mode="loading"`: a near-black "underground"
  screen with swaying cream light shafts, so nothing else ever flashes while the
  lazy chunk loads (three.js lives only in that chunk, ~503KB raw / ≈125KB gz).
  After the world's first frame, the gate flips to `data-mode="3d"` and the dark
  screen surfaces into daylight (`sandbox-emerge`, ~1.15s dark → warm flood →
  fade) — or just quick-fades in 320ms when the chunk was cached and load took
  <400ms, with a 1.6s JS backstop in case animations never fire. Visitors with
  `?flat`, `prefers-reduced-motion`, or no WebGL get `data-mode="flat"`: a static
  sky-gradient text card with a return link. A `<noscript>` note covers no-JS
  visitors, and sr-only heading/description keep the SSR payload meaningful.
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
distance 15–110, polar 0.35–1.55, portrait FOV compensation, `flyTo` easing for
keyboard nav, `?view=azimuth,polar,distance` pin for QA screenshots; camera
collision = terrain-clearance clamp over the island footprint + a
pull-in-front-of-solids raycast against `userData.occluder` meshes: terrain cap,
cliff, observatory drum + dome, archive mound) ·
`interactions.ts` (invisible raycast proxies + terrain occluders in one raycast,
hover, click, grab/grabbing/pointer cursors) · `creatures.ts` (dogs with
run/idle/sit state machine, free-roaming wander targets anywhere on the island
with circle-obstacle steering + hard no-penetration projection around the pond,
greenhouse, observatory, archive, turbines, sign, and bridge foot; koi, birds,
butterflies) ·
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

Hover/focus reveals a label chip (`.sandbox-label--chip`, projected from world
space). Terrain occluders keep landmarks hidden behind the hill
from being hovered through it. Only the return sign navigates (fade →
`router.push("/")`); the archive door swings open on click as a flourish. The
pond (water radius 4.8) is not selectable — no hotspot, no chip; clicking its
water spawns two staggered expanding ripple rings (pool of 6, `spawnRipple` on
the pond module). Rings expand freely; a shader mask (`onBeforeCompile` radial
alpha fade near the waterline) dissolves just the arc that reaches the shore
while the rest of the ring carries on across the water.
A visually-hidden nav lists all locations for keyboard users (entries fly the
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
- `?flat=1` serves the static fallback card (no WebGL/three.js loaded).
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
