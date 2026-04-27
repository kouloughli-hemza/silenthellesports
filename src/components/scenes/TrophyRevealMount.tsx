"use client";

// Mounts TrophyWinnerReveal the first time the trophy section enters the
// viewport for a given browser. localStorage gates it so returning visitors
// don't get the chicken-dinner stamp on every visit.

import { useEffect, useRef, useState } from "react";
import { TrophyWinnerReveal } from "./TrophyWinnerReveal";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const STORAGE_KEY = "sh:trophy-reveal-seen";

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
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // storage blocked — treat as already-seen so we don't loop on every visit
      return;
    }
    const trigger = triggerRef.current;
    if (!trigger) return;
    // Observe the parent section so any portion entering the viewport fires.
    const target = (trigger.closest("section") as HTMLElement | null) ?? trigger;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            try {
              localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              /* storage blocked — fall through, the IO disconnect still prevents re-fire this page */
            }
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
