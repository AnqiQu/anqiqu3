"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { sandboxLocations } from "../config";
import { SandboxOverlay } from "./sandbox-overlay";
import { createUiBridge } from "./ui-bridge";
import type { WorldHandle } from "./world/engine";

// Progressive-enhancement gate for the 3D sandbox. The server-rendered 2D scene
// arrives as `children` and is what search engines, tests, and no-JS visitors see.
// The 3D world only takes over after mount, and only when the visitor hasn't
// asked for the flat version (?flat), doesn't prefer reduced motion, and has a
// working WebGL context. `data-mode` flips exclusively inside the effect so the
// first client render matches the server markup byte-for-byte.
export function SandboxExperience({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"flat" | "3d">("flat");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<WorldHandle | null>(null);
  const bridge = useMemo(() => createUiBridge(), []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("flat")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") ?? probe.getContext("webgl"))) return;

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
        // Swap modes only after the first frame has painted so the 2D scene
        // never gives way to a blank canvas.
        onFirstFrame: () => {
          if (!cancelled) setMode("3d");
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
      <canvas className="sandbox-3d-canvas" ref={canvasRef} aria-hidden="true" />
      {mode === "3d" && <SandboxOverlay bridge={bridge} locations={sandboxLocations} />}
      {children}
    </div>
  );
}
