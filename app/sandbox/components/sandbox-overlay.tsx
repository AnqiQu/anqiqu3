"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SandboxLocation } from "../config";
import type { UiBridge } from "./ui-bridge";

// DOM overlay for the 3D world: one-time scroll hint, a persistent return
// button, hover label chips projected from 3D space, a visually-hidden jump nav
// for keyboard users, and the navigation fade. The title itself is not here —
// it hangs in the sky as 3D block letters (see world/sky-title).
export function SandboxOverlay({
  bridge,
  locations,
}: {
  bridge: UiBridge;
  locations: SandboxLocation[];
}) {
  const router = useRouter();
  const fadeRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<string, HTMLDivElement>());
  const [hintDismissed, setHintDismissed] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const worldLocations = locations.filter((l) => l.world3d);
  // Ambient spots (the pond) get no label chip — they're scenery, not
  // selectable landmarks. They stay in the keyboard nav for camera fly-to.
  const chipLocations = worldLocations.filter((l) => l.interaction !== "ambient");

  useEffect(() => {
    // First drag or zoom dismisses the hint. (The sky title clears itself off
    // the same gesture, from inside the world — see world/engine.)
    const onFirstInteraction = () => setHintDismissed(true);
    window.addEventListener("pointerdown", onFirstInteraction, { passive: true, once: true });
    window.addEventListener("wheel", onFirstInteraction, { passive: true, once: true });

    const unregister = bridge.register({
      positionChip: (id, x, y, inPhase) => {
        const chip = chipRefs.current.get(id);
        if (!chip) return;
        chip.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
        chip.dataset.inphase = inPhase ? "true" : "false";
      },
      setHover: (id) => setHoveredId(id),
      fadeAndNavigate: (href) => {
        if (fadeRef.current) fadeRef.current.dataset.active = "true";
        window.setTimeout(() => router.push(href), 420);
      },
    });

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("wheel", onFirstInteraction);
      unregister();
    };
  }, [bridge, router]);

  // Keyboard: fly the orbit camera to face the landmark; focus lights it up
  // via the same path pointer hover uses.
  const jumpTo = (location: SandboxLocation) => {
    bridge.flyToLocation?.(location.id);
  };

  return (
    <div className="sandbox-3d-overlay">
      {!hintDismissed && <div className="sandbox-3d-hint">drag to explore · pinch or scroll to zoom</div>}

      <Link
        href="/"
        className="sandbox-3d-return"
        aria-label="Back to the server room"
        onClick={(event) => {
          event.preventDefault();
          bridge.navigate("/");
        }}
      >
        <span className="sandbox-3d-return-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </span>
        <span className="sandbox-3d-return-label">Back to server room</span>
      </Link>

      {chipLocations.map((location) => (
        <div
          key={location.id}
          className="sandbox-label sandbox-label--chip"
          data-hovered={hoveredId === location.id ? "true" : "false"}
          ref={(el) => {
            if (el) chipRefs.current.set(location.id, el);
            else chipRefs.current.delete(location.id);
          }}
        >
          <strong>{location.label}</strong>
          <small>{location.description}</small>
        </div>
      ))}

      <nav className="sandbox-sr-only" aria-label="Sandbox locations">
        <ul>
          {worldLocations.map((location) => (
            <li key={location.id}>
              <button
                type="button"
                onFocus={() => bridge.onFocusHover?.(location.id)}
                onBlur={() => bridge.onFocusHover?.(null)}
                onClick={() => jumpTo(location)}
              >
                {location.label} — {location.description}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sandbox-3d-fade" ref={fadeRef} aria-hidden="true" />
    </div>
  );
}
