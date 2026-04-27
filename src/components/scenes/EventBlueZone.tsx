"use client";

// Scene 04 — Events blue zone.
//
// Renders next to the slot bar: a circular ring that shrinks as capacity fills,
// plus animated red gas wisps when filled/capacity > 0.7, plus a rotating
// "SLOTS CLOSED" stamp when isFull. Pure SVG + CSS animation — no canvas, no
// GSAP, no scroll triggers (the card itself scrolls into view, no overlay).
//
// Reduced motion: render static at the same final state, no animation.

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface EventBlueZoneProps {
  pct: number;
  isFull: boolean;
  hot: boolean;
  closedLabel: string;
}

const SIZE = 64;
const STROKE = 3;
const RADIUS = (SIZE - STROKE * 2) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function EventBlueZone({ pct, isFull, hot, closedLabel }: EventBlueZoneProps) {
  const ringRef = useRef<SVGCircleElement | null>(null);
  const reduced = useReducedMotion();

  // The "active" arc length represents the SHRINKING zone — at 0% capacity,
  // ring is fully drawn (zone wide open). At 100%, ring fully erased.
  const remaining = Math.max(0, 100 - pct);
  const dashOffset = CIRC * (1 - remaining / 100);

  useEffect(() => {
    const el = ringRef.current;
    if (!el) return;
    if (reduced) {
      el.style.strokeDashoffset = String(dashOffset);
      return;
    }
    // Animate dashoffset from CIRC (zone closed) → target on mount.
    el.style.strokeDashoffset = String(CIRC);
    el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)";
    requestAnimationFrame(() => {
      el.style.strokeDashoffset = String(dashOffset);
    });
  }, [dashOffset, reduced]);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 14,
        right: 14,
        width: SIZE,
        height: SIZE,
        pointerEvents: "none",
      }}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(245,240,232,0.08)"
          strokeWidth={STROKE}
        />
        <circle
          ref={ringRef}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={isFull ? "var(--hell-red)" : "rgba(80,180,255,0.85)"}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ filter: isFull ? "drop-shadow(0 0 6px rgba(230,0,19,0.7))" : "drop-shadow(0 0 6px rgba(80,180,255,0.6))" }}
        />
        {hot && !isFull ? (
          <g>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={3} fill="var(--ember)">
              {!reduced ? (
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
              ) : null}
            </circle>
          </g>
        ) : null}
      </svg>
      {isFull ? (
        <div
          className="font-mono"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-12deg)",
            fontSize: 7,
            letterSpacing: "0.15em",
            color: "var(--hell-red)",
            border: "1.5px solid var(--hell-red)",
            padding: "2px 4px",
            whiteSpace: "nowrap",
            background: "rgba(10,10,10,0.65)",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {closedLabel}
        </div>
      ) : null}
    </div>
  );
}
