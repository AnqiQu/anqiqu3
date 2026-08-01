"use client";

import { usePathname } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "anqi-cookie-credibility";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "accepted";
}

// Treat as accepted during SSR so the banner never renders on the server,
// avoiding a hydration mismatch; the client re-reads localStorage after mount.
function getServerSnapshot() {
  return true;
}

export function CookieBanner() {
  const pathname = usePathname();
  const accepted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const accept = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "accepted");
    listeners.forEach((listener) => listener());
  }, []);

  if (pathname?.startsWith("/sandbox")) return null;
  if (accepted) return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Cookie notice">
      <p className="cookie-banner-text">
        This site uses no cookies. This banner exists purely for credibility.
      </p>
      <div className="cookie-banner-actions">
        <button type="button" className="button button-compact" onClick={accept}>
          Accept
        </button>
        <button
          type="button"
          className="button button-compact button-secondary"
          onClick={accept}
        >
          Also accept
        </button>
      </div>
    </div>
  );
}
