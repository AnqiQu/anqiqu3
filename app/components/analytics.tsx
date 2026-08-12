"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Your GoatCounter site code — the subdomain of your account at
// goatcounter.com. The dashboard lives at https://anqiqu.goatcounter.com.
// Reset this to "YOUR_CODE_HERE" to disable analytics without deleting anything.
const GOATCOUNTER_CODE = "anqiqu";

const CONFIGURED = GOATCOUNTER_CODE !== "YOUR_CODE_HERE";
const ENDPOINT = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;

declare global {
  interface Window {
    goatcounter?: {
      no_onload?: boolean;
      count?: (vars?: {
        path?: string;
        title?: string;
        referrer?: string;
        event?: boolean;
      }) => void;
    };
  }
}

// GoatCounter's script only counts the initial page load. This site navigates
// client-side (Next App Router), so we disable its onload counter and record a
// pageview ourselves on every path change — otherwise every page after the
// first would be invisible in the per-page stats.
export function Analytics() {
  const pathname = usePathname();
  const scriptAdded = useRef(false);
  const pendingPath = useRef<string | null>(null);

  // Inject the counter script exactly once, with auto-counting disabled.
  useEffect(() => {
    if (!CONFIGURED || scriptAdded.current) return;
    scriptAdded.current = true;
    window.goatcounter = { no_onload: true };
    const script = document.createElement("script");
    script.src = "https://gc.zgo.at/count.js";
    script.async = true;
    script.setAttribute("data-goatcounter", ENDPOINT);
    // If a navigation happened before the script finished loading, flush it now.
    script.onload = () => {
      if (pendingPath.current !== null) {
        window.goatcounter?.count?.({ path: pendingPath.current });
        pendingPath.current = null;
      }
    };
    document.head.appendChild(script);
  }, []);

  // Record a pageview on first render and on every subsequent route change.
  useEffect(() => {
    if (!CONFIGURED) return;
    const path = window.location.pathname + window.location.search;
    if (window.goatcounter?.count) {
      window.goatcounter.count({ path });
    } else {
      // Script not ready yet; the onload handler above will send this.
      pendingPath.current = path;
    }
  }, [pathname]);

  return null;
}
