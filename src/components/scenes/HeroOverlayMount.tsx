"use client";

// Always-on mount + scroll-lock wrapper for HeroPlaneDrop.
// Plays the cinematic on every page load (not just first visit) per user
// preference. Reduced motion still skips it.

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
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (reduced) return;
    setOpen(true);
  }, [hydrated, reduced]);

  // Body scroll lock while the overlay is up.
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
    <HeroPlaneDrop
      {...props}
      onComplete={() => {
        setOpen(false);
      }}
    />
  );
}
