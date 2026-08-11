"use client";

import { useState } from "react";

// A rotating cast of AI-hypebeast buzzwords that drift around the hero.
const HYPE_TERMS = [
  "Inference",
  "Infrastructure",
  "Frontier",
  "Neolab",
  "Alignment",
  "Scaling Laws",
  "AGI",
  "Multimodal",
  "Foundation Model",
  "Zero-Shot",
  "Agentic",
  "Superintelligence",
  "Compute",
  "Synthetic Data",
  "RLHF",
  "Post-Training",
  "Chain-of-Thought",
  "Paradigm Shift",
  "Singularity",
];

// Peripheral anchor points, kept clear of the centred headline.
const SLOTS: { top: string; x: string; side: "left" | "right" }[] = [
  { top: "15%", x: "7%", side: "left" },
  { top: "21%", x: "8%", side: "right" },
  { top: "39%", x: "4%", side: "left" },
  { top: "36%", x: "5%", side: "right" },
  { top: "58%", x: "8%", side: "left" },
  { top: "62%", x: "6%", side: "right" },
  { top: "80%", x: "19%", side: "left" },
  { top: "82%", x: "21%", side: "right" },
];

// Length of one appear→dim cycle (must match the CSS animation duration).
const CYCLE_MS = 5600;
// Spread each term's opening offset so no two slots share a term at first.
const STEP = Math.floor(HYPE_TERMS.length / SLOTS.length);
// Step forward by a value coprime with the pool size so a slot visits them all.
const ADVANCE = 5;

export function HeroHype() {
  const [indices, setIndices] = useState(() =>
    SLOTS.map((_, i) => (i * STEP) % HYPE_TERMS.length),
  );

  // Swap a single slot's term at the end of ITS own cycle (opacity 0), so the
  // change is invisible and the slots never turn over in unison.
  const advance = (slot: number) => {
    setIndices((prev) => {
      const next = [...prev];
      next[slot] = (next[slot] + ADVANCE) % HYPE_TERMS.length;
      return next;
    });
  };

  return (
    <div className="hero-hype" aria-hidden="true">
      {SLOTS.map((slot, i) => {
        const position =
          slot.side === "left"
            ? { top: slot.top, left: slot.x }
            : { top: slot.top, right: slot.x };
        return (
          <span
            className={`hero-hype-term hero-hype-term-${slot.side}`}
            style={position}
            key={i}
          >
            <span
              className="hero-hype-word"
              style={{ animationDelay: `-${(CYCLE_MS / SLOTS.length) * i}ms` }}
              onAnimationIteration={() => advance(i)}
            >
              {HYPE_TERMS[indices[i]]}
            </span>
          </span>
        );
      })}
    </div>
  );
}
