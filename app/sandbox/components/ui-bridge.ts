// Tiny bridge between the Three.js engine (which knows where things are) and
// the React overlay (which owns the DOM chips). The overlay registers handler
// functions after mount; the engine calls through safe no-op wrappers, so
// neither side holds a direct reference to the other.

export type UiBridgeHandlers = {
  positionChip?: (id: string, x: number, y: number, inPhase: boolean) => void;
  setHover?: (id: string | null) => void;
  fadeAndNavigate?: (href: string) => void;
};

export type UiBridge = {
  // Overlay side: register DOM handlers after mount; returns an unregister fn.
  register: (handlers: UiBridgeHandlers) => () => void;
  // Engine side.
  positionChip: (id: string, x: number, y: number, inPhase: boolean) => void;
  setHover: (id: string | null) => void;
  navigate: (href: string) => void;
  // Set by the engine so keyboard focus in the overlay can drive the same
  // highlight as pointer hover.
  onFocusHover?: (id: string | null) => void;
  // Set by the engine; lets clicks toggle the archive door flourish.
  toggleArchive?: () => void;
  // Set by the engine; eases the orbit camera to face a landmark (keyboard nav).
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
    positionChip(id, x, y, inPhase) {
      handlers.positionChip?.(id, x, y, inPhase);
    },
    setHover(id) {
      handlers.setHover?.(id);
    },
    navigate(href) {
      if (handlers.fadeAndNavigate) handlers.fadeAndNavigate(href);
      else window.location.assign(href);
    },
  };
}
