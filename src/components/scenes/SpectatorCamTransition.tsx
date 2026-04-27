"use client";

// Scene 08 — Spectator-cam page transition.
//
// Listens for pathname changes and overlays a brief "switching spectator"
// scan-line + glitch flash. The overlay is purely visual feedback — Next's
// router transitions handle the actual nav. ~360ms total, non-blocking.

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

export function SpectatorCamTransition() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const firstRender = useRef(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (reduced) return;
    setActive(true);
    const t = setTimeout(() => setActive(false), 380);
    return () => clearTimeout(t);
  }, [pathname, reduced]);

  if (!active) return null;
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9500,
        pointerEvents: "none",
        animation: "spec-flash 360ms ease-out forwards",
        background:
          "linear-gradient(180deg, transparent 0%, transparent 48%, rgba(230,0,19,0.55) 49%, rgba(255,217,61,0.45) 50%, rgba(230,0,19,0.55) 51%, transparent 52%, transparent 100%)",
        mixBlendMode: "screen",
      }}
    >
      <style jsx>{`
        @keyframes spec-flash {
          0% { opacity: 0; transform: translateY(-100%); }
          25% { opacity: 1; }
          70% { opacity: 1; transform: translateY(0%); }
          100% { opacity: 0; transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}
