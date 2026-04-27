"use client";

// Scene 09 — 404 "KNOCKED DOWN" stamp.
//
// On mount: dust burst behind the heading + impact shake on the wrapper +
// "KNOCKED DOWN" stamp slams in rotated. One-shot, ~1.4s. Reduced motion:
// renders static stamp with no animation.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ParticleSystem } from "@/lib/animations/particles";
import { createTimeline, shakeStage } from "@/lib/animations/timeline";

interface KnockedDownStampProps {
  label: string;
}

export function KnockedDownStamp({ label }: KnockedDownStampProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stampRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    // Make canvas span the parent (the wrapping page section)
    const parent = wrap.parentElement ?? wrap;
    const pRect = parent.getBoundingClientRect();
    canvas.style.width = `${pRect.width}px`;
    canvas.style.height = `${pRect.height}px`;
    const sys = new ParticleSystem(canvas, { maxParticles: 300 });
    sys.start();

    gsap.set(stampRef.current, { opacity: 0, scale: 1.4, rotation: -8 });

    const tl = createTimeline();
    tl.call(() => {
      const r = canvas.getBoundingClientRect();
      sys.spawn("dust", { x: r.width / 2, y: r.height / 2, count: 90 });
      sys.spawn("ember", { x: r.width / 2, y: r.height / 2, count: 24 });
    }, undefined, 0.1);
    tl.add(shakeStage(parent as HTMLElement, 12, 0.45), 0.1);
    tl.to(stampRef.current, { opacity: 1, scale: 1, rotation: -10, duration: 0.35, ease: "back.out(2)" }, 0.18);

    const cleanupTimer = setTimeout(() => sys.destroy(), 3000);
    return () => {
      clearTimeout(cleanupTimer);
      tl.kill();
      sys.destroy();
    };
  }, []);

  return (
    <div ref={wrapRef} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <div
        ref={stampRef}
        className="font-display"
        style={{
          position: "absolute",
          left: "50%",
          top: "30%",
          transform: "translate(-50%, -50%) rotate(-10deg)",
          padding: "8px 18px",
          border: "3px solid var(--hell-red)",
          color: "var(--hell-red)",
          background: "rgba(10,10,10,0.7)",
          fontSize: 18,
          fontWeight: 900,
          fontStyle: "italic",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          opacity: 0,
          boxShadow: "0 0 22px rgba(230,0,19,0.45)",
        }}
      >
        {label}
      </div>
    </div>
  );
}
