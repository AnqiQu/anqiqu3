"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { sandboxLocations } from "../config";
import { SandboxOverlay } from "./sandbox-overlay";
import { createUiBridge } from "./ui-bridge";
import type { WorldHandle } from "./world/engine";

// Gate for the 3D sandbox. The server renders the "underground" state: a
// near-black screen with shafts of light bleeding in from above, as if the
// visitor is below the island waiting to surface — so no other scene ever
// flashes while the world chunk loads. Once the first frame has painted, the
// screen floods with daylight and fades away ("emerge"); if the chunk was
// cached and ready almost instantly, a quick fade is used instead so fast
// loads aren't held hostage by the flourish. Visitors who ask for ?flat,
// prefer reduced motion, or lack WebGL get a static text card. `data-mode`
// flips exclusively inside the effect so the first client render matches the
// server markup byte-for-byte.
export function SandboxExperience() {
  const [mode, setMode] = useState<"loading" | "flat" | "3d">("loading");
  const [reveal, setReveal] = useState<"waiting" | "emerge" | "quick" | "done">("waiting");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<WorldHandle | null>(null);
  const bridge = useMemo(() => createUiBridge(), []);

  useEffect(() => {
    const probe = document.createElement("canvas");
    const stayFlat =
      new URLSearchParams(window.location.search).has("flat") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !(probe.getContext("webgl2") ?? probe.getContext("webgl"));

    if (stayFlat) {
      // Mode may not flip synchronously mid-effect; one frame later is fine.
      const raf = requestAnimationFrame(() => setMode("flat"));
      return () => cancelAnimationFrame(raf);
    }

    const started = performance.now();
    let cancelled = false;
    (async () => {
      // Code-split boundary: three.js and the whole world graph live in this
      // lazy chunk and never load for flat-mode visitors or other routes.
      const { createWorld } = await import("./world/engine");
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      worldRef.current = createWorld({
        canvas,
        locations: sandboxLocations,
        ui: bridge,
        onFirstFrame: () => {
          if (cancelled) return;
          setMode("3d");
          setReveal(performance.now() - started > 400 ? "emerge" : "quick");
          // Backstop in case the CSS animation never fires (e.g. animations
          // disabled at the OS level): don't leave the dark screen up.
          window.setTimeout(() => {
            if (!cancelled) setReveal("done");
          }, 1600);
        },
      });
    })();

    return () => {
      cancelled = true;
      worldRef.current?.dispose();
      worldRef.current = null;
    };
  }, [bridge]);

  return (
    <div className="sandbox-experience" data-mode={mode}>
      {mode !== "flat" && (
        <>
          <h1 className="sandbox-sr-only">Anqi Intelligence Sandbox</h1>
          <p className="sandbox-sr-only">
            A floating solarpunk island above the clouds — drag to explore once it loads.
          </p>
        </>
      )}
      <canvas className="sandbox-3d-canvas" ref={canvasRef} aria-hidden="true" />
      {mode === "3d" && <SandboxOverlay bridge={bridge} locations={sandboxLocations} />}
      {mode === "flat" && (
        <main className="sandbox-flat">
          <p className="sandbox-flat-kicker">Anqi Intelligence</p>
          <h1 className="sandbox-flat-title">Sandbox</h1>
          <p className="sandbox-flat-note">
            A floating solarpunk island above the clouds — research, memories, and unfinished
            ideas. The explorable version needs WebGL and motion enabled.
          </p>
          <Link className="sandbox-flat-return" href="/">
            ← server room
          </Link>
        </main>
      )}
      {mode !== "flat" && reveal !== "done" && (
        <div
          className="sandbox-cavern"
          data-reveal={reveal}
          aria-hidden="true"
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) setReveal("done");
          }}
        >
          <span className="sandbox-cavern-glow" />
          <span className="sandbox-cavern-streak" />
          <span className="sandbox-cavern-streak" />
          <span className="sandbox-cavern-streak" />
        </div>
      )}
      <noscript>
        <p className="sandbox-noscript">
          The sandbox is an interactive 3D world and needs JavaScript.{" "}
          <Link href="/">Return to the server room</Link>.
        </p>
      </noscript>
    </div>
  );
}
