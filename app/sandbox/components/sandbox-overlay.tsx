"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SandboxLocation } from "../config";
import type { UiBridge } from "./ui-bridge";

// DOM overlay for the 3D world: one-time scroll hint, a persistent return
// button, a visually-hidden jump nav for keyboard users, the navigation fade
// (also used as the interior-swap dip), and a controls hint when a room is
// entered. The title itself is not here — it hangs in the sky as 3D block
// letters (see world/sky-title).
export function SandboxOverlay({
  bridge,
  locations,
}: {
  bridge: UiBridge;
  locations: SandboxLocation[];
}) {
  const router = useRouter();
  const fadeRef = useRef<HTMLDivElement>(null);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [openPanelId, setOpenPanelId] = useState<string | null>(null);
  const [interiorId, setInteriorId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openPanel = openPanelId ? locations.find((l) => l.id === openPanelId) : undefined;
  const interiorLabel = interiorId ? locations.find((l) => l.id === interiorId)?.label : undefined;

  const worldLocations = locations.filter((l) => l.world3d);

  useEffect(() => {
    // First drag or zoom dismisses the hint. (The sky title clears itself off
    // the same gesture, from inside the world — see world/engine.)
    const onFirstInteraction = () => setHintDismissed(true);
    window.addEventListener("pointerdown", onFirstInteraction, { passive: true, once: true });
    window.addEventListener("wheel", onFirstInteraction, { passive: true, once: true });

    const unregister = bridge.register({
      fadeAndNavigate: (href) => {
        if (fadeRef.current) fadeRef.current.dataset.active = "true";
        window.setTimeout(() => router.push(href), 420);
      },
      openPanel: (id) => setOpenPanelId(id),
      // Scene swap: dip to the fade color, let the engine switch worlds under
      // the cover, then lift.
      fadeSwap: (swap) => {
        const fade = fadeRef.current;
        if (!fade) {
          swap();
          return;
        }
        fade.dataset.active = "true";
        window.setTimeout(() => {
          swap();
          window.setTimeout(() => {
            fade.dataset.active = "false";
          }, 80);
        }, 420);
      },
      setInterior: (id) => setInteriorId(id),
    });

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("wheel", onFirstInteraction);
      unregister();
    };
  }, [bridge, router]);

  // The plaque takes focus when it opens and closes on Escape, so it can be
  // read and dismissed without a pointer. Focus lands on the plate itself,
  // not the ×, so opening it with a mouse doesn't paint a focus ring on the
  // close button.
  useEffect(() => {
    if (!openPanelId) return;
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPanelId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openPanelId]);

  return (
    <div className="sandbox-3d-overlay">
      {!hintDismissed && !interiorId && <div className="sandbox-3d-hint">drag · scroll · pinch · WASD · Q/E · arrows to explore — you&apos;ll figure it out</div>}

      {interiorId && (
        <div className="sandbox-3d-hint sandbox-3d-hint--interior" key={interiorId}>
          walk with WASD · arrows or drag to look · click the way out to leave
        </div>
      )}

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

      {openPanel?.panel && (
        <div
          className="sandbox-panel"
          role="dialog"
          aria-label={openPanel.label}
          key={openPanel.id}
          ref={panelRef}
          tabIndex={-1}
        >
          <button
            type="button"
            className="sandbox-panel-close"
            aria-label="Close"
            onClick={() => setOpenPanelId(null)}
          >
            <span aria-hidden="true">×</span>
          </button>
          <p className="sandbox-panel-body">{openPanel.panel}</p>
        </div>
      )}

      {interiorId ? (
        <nav className="sandbox-sr-only" aria-label="Sandbox location">
          <p>Inside {interiorLabel ?? "a room"}.</p>
          <button type="button" onClick={() => bridge.exitInterior?.()}>
            Leave and return to the island (or press Escape)
          </button>
        </nav>
      ) : (
        <nav className="sandbox-sr-only" aria-label="Sandbox locations">
          <ul>
            {worldLocations.map((location) => (
              <li key={location.id}>
                <button
                  type="button"
                  onFocus={() => bridge.onFocusHover?.(location.id)}
                  onBlur={() => bridge.onFocusHover?.(null)}
                  onClick={() => {
                    if (location.interaction === "open-panel") setOpenPanelId(location.id);
                    else if (location.interaction === "enter") bridge.enterInterior?.(location.id);
                    else bridge.flyToLocation?.(location.id);
                  }}
                >
                  {location.label} — {location.description}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="sandbox-3d-fade" ref={fadeRef} aria-hidden="true" />
    </div>
  );
}
