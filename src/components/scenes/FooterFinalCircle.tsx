"use client";

// Scene 07 — Footer final circle.
//
// A small "final play zone" SVG that pulses with breathing animation, with a
// faint red gas haze underneath. Pure CSS animation — no GSAP, no canvas.
// Reduced motion: render static.

import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface FooterFinalCircleProps {
  label: string;
}

export function FooterFinalCircle({ label }: FooterFinalCircleProps) {
  const reduced = useReducedMotion();
  return (
    <div
      className="font-mono"
      aria-hidden
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 14px 6px 10px",
        border: "1px solid rgba(230,0,19,0.3)",
        background: "rgba(10,10,10,0.55)",
        fontSize: 9,
        letterSpacing: "0.3em",
        color: "rgba(245,240,232,0.55)",
        textTransform: "uppercase",
      }}
    >
      <svg width="22" height="22" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="9" fill="rgba(230,0,19,0.08)" />
        <circle
          cx="11"
          cy="11"
          r="9"
          fill="none"
          stroke="var(--hell-red)"
          strokeWidth="1"
          strokeOpacity="0.7"
          style={!reduced ? { animation: "ffc-pulse 2.4s ease-in-out infinite" } : undefined}
        />
        <circle
          cx="11"
          cy="11"
          r="3"
          fill="var(--hell-red)"
          style={!reduced ? { animation: "ffc-dot 2.4s ease-in-out infinite" } : undefined}
        />
      </svg>
      <span>{label}</span>
      <style jsx>{`
        @keyframes ffc-pulse {
          0%, 100% { transform-origin: center; transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 0.3; }
        }
        @keyframes ffc-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
