"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ParticleSystem } from "@/lib/animations/particles";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

export interface ParticleCanvasHandle {
  system: ParticleSystem | null;
}

interface ParticleCanvasProps {
  className?: string;
  // Pause when offscreen via IntersectionObserver. Default true.
  pauseOffscreen?: boolean;
  // Auto start the RAF loop on mount. Default true. Most scenes leave this on
  // and use the imperative `system` to spawn / emit on demand.
  autoStart?: boolean;
  // ARIA hidden by default since particles are decorative.
  ariaHidden?: boolean;
  // Style overrides — full-bleed by default.
  style?: React.CSSProperties;
}

export const ParticleCanvas = forwardRef<ParticleCanvasHandle, ParticleCanvasProps>(
  function ParticleCanvas(
    { className, pauseOffscreen = true, autoStart = true, ariaHidden = true, style },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const systemRef = useRef<ParticleSystem | null>(null);
    const reduced = useReducedMotion();

    useImperativeHandle(ref, () => ({ get system() { return systemRef.current; } }), []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const sys = new ParticleSystem(canvas, { disabled: reduced });
      systemRef.current = sys;

      const onResize = () => sys.resize();
      window.addEventListener("resize", onResize);

      if (autoStart && !reduced) sys.start();

      let io: IntersectionObserver | null = null;
      if (pauseOffscreen && !reduced && typeof IntersectionObserver !== "undefined") {
        io = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (!entry) return;
            if (entry.isIntersecting) sys.start();
            else sys.pause();
          },
          { rootMargin: "200px", threshold: 0 },
        );
        io.observe(canvas);
      }

      return () => {
        window.removeEventListener("resize", onResize);
        io?.disconnect();
        sys.destroy();
        systemRef.current = null;
      };
    }, [autoStart, pauseOffscreen, reduced]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        aria-hidden={ariaHidden}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          ...style,
        }}
      />
    );
  },
);
