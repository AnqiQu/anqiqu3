// Tiny bridge between the Three.js engine (which knows where things are) and
// the React overlay (which owns the DOM). The overlay registers handler
// functions after mount; the engine calls through safe no-op wrappers, so
// neither side holds a direct reference to the other.

export type UiBridgeHandlers = {
  setHover?: (id: string | null) => void;
  fadeAndNavigate?: (href: string) => void;
  openPanel?: (id: string) => void;
  // Dip to the fade color, run `swap` (a scene change) mid-fade, then clear.
  fadeSwap?: (swap: () => void) => void;
  // The engine reports which interior the visitor is in (null = the island).
  setInterior?: (id: string | null) => void;
};

export type UiBridge = {
  // Overlay side: register DOM handlers after mount; returns an unregister fn.
  register: (handlers: UiBridgeHandlers) => () => void;
  // Engine side.
  setHover: (id: string | null) => void;
  navigate: (href: string) => void;
  // Reveals a location's long-form copy (the bench plaque's inscription).
  openPanel: (id: string) => void;
  fadeSwap: (swap: () => void) => void;
  setInterior: (id: string | null) => void;
  // Set by the engine so keyboard focus in the overlay can drive the same
  // highlight as pointer hover.
  onFocusHover?: (id: string | null) => void;
  // Set by the engine; steps into a landmark's interior / back out of it.
  enterInterior?: (id: string) => void;
  exitInterior?: () => void;
  // Set by the engine; eases the fly camera to face a landmark (keyboard nav).
  flyToLocation?: (id: string) => void;
};

export function createUiBridge(): UiBridge {
  let handlers: UiBridgeHandlers = {};
  return {
    register(next) {
      handlers = next;
      return () => {
        if (handlers === next) handlers = {};
      };
    },
    setHover(id) {
      handlers.setHover?.(id);
    },
    navigate(href) {
      if (handlers.fadeAndNavigate) handlers.fadeAndNavigate(href);
      else window.location.assign(href);
    },
    openPanel(id) {
      handlers.openPanel?.(id);
    },
    fadeSwap(swap) {
      if (handlers.fadeSwap) handlers.fadeSwap(swap);
      else swap();
    },
    setInterior(id) {
      handlers.setInterior?.(id);
    },
  };
}
