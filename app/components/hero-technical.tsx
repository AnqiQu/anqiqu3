"use client";

import { useEffect, useRef } from "react";

export function HeroTechnical() {
  const graphicRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const graphic = graphicRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!graphic || reducedMotion.matches) return;

    const followPointer = (event: PointerEvent) => {
      const horizontal = event.clientX / window.innerWidth - 0.5;
      const vertical = event.clientY / window.innerHeight - 0.5;

      graphic.style.setProperty("--gyro-x", `${horizontal * 34}px`);
      graphic.style.setProperty("--gyro-y", `${vertical * 24}px`);
      graphic.style.setProperty("--gyro-rotation", `${horizontal * 1.8}deg`);
    };

    const resetPosition = () => {
      graphic.style.setProperty("--gyro-x", "0px");
      graphic.style.setProperty("--gyro-y", "0px");
      graphic.style.setProperty("--gyro-rotation", "0deg");
    };

    window.addEventListener("pointermove", followPointer, { passive: true });
    document.documentElement.addEventListener("mouseleave", resetPosition);

    return () => {
      window.removeEventListener("pointermove", followPointer);
      document.documentElement.removeEventListener("mouseleave", resetPosition);
    };
  }, []);

  return (
    <div className="hero-technical" aria-hidden="true" ref={graphicRef}>
      <span className="orbit orbit-one" />
      <span className="orbit orbit-two" />
      <span className="orbit-node orbit-node-one" />
      <span className="orbit-node orbit-node-two" />
    </div>
  );
}
