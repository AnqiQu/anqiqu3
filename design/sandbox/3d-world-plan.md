# Sandbox 3D World — Implementation Plan

Goal: replace the static 2D solarpunk collage at `/sandbox` with a scroll-explorable
Three.js open world, mechanically similar to danielqli (scroll-driven camera descent,
raycast-clickable landmarks, HTML overlay labels), while preserving the existing
landscape features and the light-solarpunk look.

## Reference mechanism (from danielqli)

- The page body is taller than the viewport (~300–400vh). `scrollT` = normalized
  `window.scrollY`, smoothed each frame (`scrollT += (targetT - scrollT) * 0.07`).
- Camera position + lookAt lerp along a fixed path as `scrollT` goes 0 → 1
  (sky view → ground-level close-up). Native page scroll means touch/trackpad/keyboard
  all work for free.
- Raycast hitboxes are gated by scroll phase (only near things are clickable).
- Hover shows an HTML label overlay projected from 3D world positions; click fades
  the screen and navigates.
- Perf guardrails: pixel ratio cap at 2, logarithmic depth buffer, Lambert materials,
  InstancedMesh for repeated geometry, animation loop paused when tab hidden,
  vertical-FOV compensation for portrait phones.

## Scene inventory (preserved from the 2D world)

| Feature | Role | Interaction |
|---|---|---|
| Floating island in clouds | Terrain | — |
| Observatory (glass dome + telescope) on hilltop | Papers & research → `/sandbox/research` | navigate |
| Solar panel array + wind turbines | Ambient solarpunk set dressing | turbine spins |
| Archive (round green door in hillside) | Old ideas & memories → `/sandbox/archive` | door opens on hover/click, then navigate |
| Garden of Preferences (greenhouse shelves) | Things I like → `/sandbox/preferences` | navigate |
| Pond (koi, lily pads, water lilies) | "No productivity detected" | ambient only |
| Unfinished Bridge (planks stop mid-air, rope, loose plank) | Ideas in progress → `/sandbox/ideas` | navigate |
| Return sign ("Return to the server room") | Back to `/` | navigate |
| Golden dog + border collie | Creatures | run loops around the meadow |
| Blimps (3 sizes, solar canopies) | Sky ambience | drift slowly |
| Birds, butterflies | Ambience | flutter paths |
| Lanterns, flower clusters, vines, stone paths | Set dressing | — |

## Key decisions

1. **Procedural low-poly geometry, not billboard sprites.** Rebuild each landmark as
   simple Three.js primitives (the danielqli approach) using a palette sampled from
   the existing paintings (meadow greens, sky `#7bcdf8`, cream `#fff7df`, warm wood,
   glass teal). Billboards of the painted PNGs would look flat the moment the camera
   moves. The painted 2D scene is kept intact as the fallback (below), so the art
   is not thrown away.
2. **Scroll-driven camera rail, not free roam.** Mechanism parity with danielqli.
   (A freecam easter egg can come later.)
3. **Three.js from npm** (`three@^0.1xx`), bundled by Vite — no CDN importmap.
   Loaded via dynamic `import()` inside a `"use client"` component so the main
   site's bundles are untouched.
4. **The current 2D scene becomes the fallback** for `prefers-reduced-motion`,
   WebGL-unavailable, and a `?flat=1` escape hatch. Server-rendered HTML keeps a
   real `<nav>` of location links for SEO/a11y regardless of renderer.

## File structure

```
app/sandbox/
  page.tsx                    server shell: metadata + <SandboxWorld/>
  config.ts                   extend SandboxLocation with world3d fields
  content.ts                  unchanged
  sandbox.css                 add canvas/overlay/hint styles; keep 2D styles
  components/
    sandbox-scene.tsx         existing 2D scene → fallback renderer
    sandbox-world.tsx         "use client": WebGL/motion detection, canvas mount,
                              overlay DOM (labels, scroll hint, fader), router bridge
  world/
    engine.ts                 renderer, scene, camera, resize, loop, visibility pause
    palette.ts                shared colors + materials
    sky.ts                    gradient dome, sun, instanced cloud puffs
    island.ts                 grass top, cliff sides, rocky underside, stone paths
    scroll-rig.ts             scrollT smoothing, camera path, FOV-for-aspect
    interactions.ts           raycaster, phase gating, hover labels, click → fade → navigate
    landmarks/
      observatory.ts  archive.ts  garden.ts  pond.ts  bridge.ts  sign.ts
      turbine.ts  solar-panels.ts
    creatures.ts              dogs, koi, birds, butterflies
    blimps.ts
```

`config.ts` gains per-location 3D data while keeping the 2D fields (fallback still
reads them):

```ts
world3d: {
  position: [x, y, z];          // island-local
  rotationY?: number;
  clickablePhase: [min, max];   // scrollT range where raycast is active
  labelOffsetY: number;         // world-space label anchor above the landmark
}
```

## Camera path (scrollT 0 → 1)

Island laid out like the painting: observatory hill at back-center, archive burrow
left slope, greenhouse mid-center, pond front-center, bridge off the right edge,
return sign front-left.

- **0.0 – 0.2 · Sky view.** High and far; whole island floats among clouds; blimps
  drift past. "Anqi Intelligence Sandbox" floating title (CSS overlay). "scroll ↓" hint.
- **0.2 – 0.5 · Descent.** Swoop toward the observatory hill; turbine and solar
  panels pass by. Observatory becomes clickable.
- **0.5 – 0.8 · Meadow.** Glide down the slope past archive and greenhouse; dogs
  visible running. Archive + garden clickable.
- **0.8 – 1.0 · Waterside.** Settle at ground level framing pond, bridge-to-nowhere,
  and return sign. Pond ripples/koi visible; bridge + sign clickable.

## Phases

Each phase ends with a dev-server screenshot check (desktop 1440×900 + mobile 390×844).

**Phase 0 — Scaffolding.** `npm i three @types/three`; `sandbox-world.tsx` client
component with capability detection and dynamic import; `engine.ts` (renderer with
pixel-ratio cap + log depth buffer, resize, rAF loop with hidden-tab pause); splash
until first frame; fallback wiring; SSR nav links preserved. *Check: empty sky-blue
scene renders, fallback works with `?flat=1`.*

**Phase 1 — Sky + island.** Gradient sky dome, sun + hemisphere/directional lights
(fixed bright late-morning, light-solarpunk), instanced cloud puffs (above and a
cloud sea below the island), island terrain: noise-displaced grass cap, low-poly
cliff skirt, stalactite rock underside, winding stone path, instanced trees/flowers/
grass tufts. Distance fog tinted sky-blue. *Check: island floats convincingly in clouds.*

**Phase 2 — Scroll rig.** Body height ~350vh, scrollT smoothing, camera path
keyframes (positions + lookAts, eased), portrait FOV compensation, scroll hint that
fades after first scroll. *Check: full descent feels smooth on desktop + phone.*

**Phase 3 — Landmarks.** One module each: observatory (stone drum, glass dome with
mullions, telescope tube, terrace stairs), solar panels (tilted instanced quads),
turbine (spinning blades), archive (round door + frame recessed into slope, vine
trim; door swings open), greenhouse (glass box, shelf rows, potted plants), pond
(animated water plane, lily pads, stones), bridge (planks thinning out to missing,
rope rails, one dangling plank), return sign (post + two boards, readable text via
CanvasTexture). *Check: composition matches the painting's layout beats.*

**Phase 4 — Life.** Dogs as simple articulated low-poly bodies running a loop path
with idle/sit pauses; koi as orange/calico ellipsoids swimming under lily pads;
2–3 birds on spline paths; butterflies near flowers; blimps drifting on long
ellipses; turbine + water + lantern flicker tied to one clock. All animation
respects `prefers-reduced-motion` (fallback renders instead). *Check: world feels
alive but calm.*

**Phase 5 — Interaction.** Raycast hover → pointer cursor + HTML label
(label + description, styled like current `.sandbox-label`) projected from 3D
position; phase-gated clickability; click → archive door opens / others fade via
`#fader` → `router.push(href)`; return sign → `/`. Keyboard: overlay nav links
focusable in DOM order, Enter triggers same flow. *Check: every landmark reachable
by mouse, touch, and keyboard.*

**Phase 6 — Polish + QA.** Perf pass (draw-call budget ~100: merge static geometry,
instance everything repeated; target 60fps desktop / 30fps mid-phone), mobile
portrait framing pass, `tests/rendered-html.test.mjs` updated (sandbox HTML asserts:
canvas mount node, fallback nav links, metadata), lint, optional Playwright
screenshot script mirroring `scripts/` conventions. *Check: tests green, both
viewports screenshot-reviewed.*

## Out of scope (deliberate)

- Enterable interiors for the buildings (danielqli-style) — the landmarks navigate
  to the existing content subpages instead. Revisit once subpage content exists.
- Time-of-day system — fixed bright daylight fits "light solarpunk"; the golden-hour
  variant can be a later toggle.
- Freecam easter egg, audio.

## Risks

- **Style drift:** low-poly geometry may read "generic" instead of solarpunk-painted.
  Mitigate by strict palette reuse, dense flowers/vines on structures, and comparing
  each phase's screenshot against `design/sandbox/review/sandbox-1440x900.png`.
- **Mobile perf:** cloud-sea + instancing counts need a low-tier device budget;
  test early on the 390×844 viewport with CPU throttle.
- **Bundle size:** three.js ≈ 160KB gz — acceptable for this route, but keep it
  route-isolated via dynamic import (verify with build output).
