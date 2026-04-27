"use client";

// Scene 10 — Respawn loading screen.
//
// Drop into any Next.js loading.tsx. Renders a centered respawn UI: rotating
// red ring, "RESPAWNING…" text with cycling dots, and a thin progress bar
// that loops. Reduced motion: ring + bar are static, text shows three dots.

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface RespawnLoaderProps {
  label?: string;
}

export function RespawnLoader({ label = "RESPAWNING" }: RespawnLoaderProps) {
  const [dots, setDots] = useState(1);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setDots(3);
      return;
    }
    const id = window.setInterval(() => setDots((d) => (d % 3) + 1), 350);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        minHeight: "60vh",
        padding: "60px 20px",
      }}
    >
      <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden>
        <circle cx="42" cy="42" r="36" fill="none" stroke="rgba(230,0,19,0.15)" strokeWidth="2" />
        <circle
          cx="42"
          cy="42"
          r="36"
          fill="none"
          stroke="var(--hell-red)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="60 162"
          style={
            !reduced
              ? { transformOrigin: "center", animation: "rl-spin 1.1s linear infinite" }
              : { transformOrigin: "center", strokeDasharray: "162" }
          }
        />
        <circle cx="42" cy="42" r="3" fill="var(--hell-red)" />
      </svg>
      <div
        className="font-mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.4em",
          color: "var(--bone)",
          textTransform: "uppercase",
        }}
      >
        {label}
        {".".repeat(dots).padEnd(3, " ")}
      </div>
      <div
        style={{
          width: 220,
          height: 2,
          background: "rgba(245,240,232,0.12)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent 0%, var(--hell-red) 50%, transparent 100%)",
            ...(reduced
              ? { transform: "translateX(0)" }
              : { animation: "rl-bar 1.4s ease-in-out infinite" }),
          }}
        />
      </div>
      <style jsx>{`
        @keyframes rl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes rl-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
