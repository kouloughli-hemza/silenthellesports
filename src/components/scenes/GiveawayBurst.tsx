"use client";

// Scene 06 — Giveaway crate burst.
//
// Non-blocking particle burst layered over the giveaway section. Fires once per
// session when the section enters viewport. No body lock, no skip — purely
// decorative wow moment. ~1.2s, then auto-fades.

import { useEffect, useRef, useState } from "react";
import { ParticleSystem } from "@/lib/animations/particles";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const SESSION_KEY = "sh:giveaway-burst";

export function GiveawayBurst() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();
  const [armed, setArmed] = useState(false);

  // IO trigger
  useEffect(() => {
    if (reduced) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {
      return;
    }
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const section = wrapper.closest("section");
    if (!section) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          try {
            sessionStorage.setItem(SESSION_KEY, "1");
          } catch {
            /* ignore */
          }
          setArmed(true);
          io.disconnect();
          break;
        }
      },
      { rootMargin: "-120px" },
    );
    io.observe(section);
    return () => io.disconnect();
  }, [reduced]);

  // Burst on arm
  useEffect(() => {
    if (!armed) return;
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    canvas.style.width = `${wrapperRect.width}px`;
    canvas.style.height = `${wrapperRect.height}px`;
    const sys = new ParticleSystem(canvas, { maxParticles: 800 });
    sys.start();

    const r = canvas.getBoundingClientRect();
    const cx = r.width / 2;
    const cy = r.height / 2;
    sys.spawn("burst", { x: cx, y: cy, count: 200 });
    sys.spawn("spark", { x: cx, y: cy, count: 100, direction: -Math.PI / 2, spread: Math.PI });
    sys.spawn("ember", { x: cx, y: cy, count: 80 });

    // Fade canvas after the particles settle
    const fadeTimer = setTimeout(() => {
      canvas.style.transition = "opacity 0.8s ease-out";
      canvas.style.opacity = "0";
    }, 1400);

    const cleanupTimer = setTimeout(() => {
      sys.destroy();
    }, 2400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(cleanupTimer);
      sys.destroy();
    };
  }, [armed]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
    >
      {armed ? (
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen" }}
        />
      ) : null}
    </div>
  );
}
