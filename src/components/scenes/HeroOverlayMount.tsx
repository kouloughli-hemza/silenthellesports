"use client";

// Always-on mount + scroll-lock wrapper for HeroPlaneDrop.
//
// Pattern:
//   - SSR renders an inline scroll-lock <style> + a static splash div so the
//     page underneath is hidden from frame one.
//   - On hydration we mount the cinematic (client-only since GSAP needs DOM).
//     The splash stays painted on top until the cinematic has rendered, then
//     we drop it on the next animation frame.
//   - On complete/skip OR reduced motion: tear everything down.

import { useEffect, useState } from "react";
import { HeroPlaneDrop } from "./HeroPlaneDrop";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface HeroOverlayMountProps {
  scrollLabel: string;
  liveLabel: string;
  sectorLabel: string;
  contextLabel: string;
  skipLabel: string;
}

export function HeroOverlayMount(props: HeroOverlayMountProps) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(true);
  const [cinematicReady, setCinematicReady] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    if (reduced) {
      setOpen(false);
      return;
    }
    setCinematicReady(true);
  }, [reduced]);

  useEffect(() => {
    if (!cinematicReady) return;
    // Wait two frames so the cinematic has a chance to paint before we drop
    // the splash — avoids any flicker of the underlying hero.
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSplashVisible(false));
    });
    return () => cancelAnimationFrame(id);
  }, [cinematicReady]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <style>{`html, body { overflow: hidden !important; }`}</style>
      {splashVisible ? <HeroSplash /> : null}
      {cinematicReady ? (
        <HeroPlaneDrop {...props} onComplete={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function HeroSplash() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9001,
        background:
          "radial-gradient(ellipse at 50% 30%, #2a0a14 0%, #14050a 35%, #050203 70%, #000 100%)",
        pointerEvents: "none",
      }}
    />
  );
}
