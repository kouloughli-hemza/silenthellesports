"use client";

// Mounts TrophyWinnerReveal every time the trophy section enters the viewport.
// Uses the parent <section> as the IO target (instead of a 1x1 sentinel) so
// the trigger is reliable even after layout/resize shenanigans.

import { useEffect, useRef, useState } from "react";
import { TrophyWinnerReveal } from "./TrophyWinnerReveal";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface TrophyRevealMountProps {
  winnerLine: string;
  chickenLine: string;
  subtitle: string;
  skipLabel: string;
}

export function TrophyRevealMount(props: TrophyRevealMountProps) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const trigger = triggerRef.current;
    if (!trigger) return;
    // Observe the parent section so any portion entering the viewport fires.
    const target = (trigger.closest("section") as HTMLElement | null) ?? trigger;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setOpen(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px", threshold: 0.05 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div ref={triggerRef} aria-hidden style={{ width: 1, height: 1 }} />
      {open ? (
        <TrophyWinnerReveal {...props} onComplete={() => setOpen(false)} />
      ) : null}
    </>
  );
}
