"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useScrollScene } from "@/lib/hooks/useScrollScene";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface AnimatedSceneProps {
  children: ReactNode;
  // Called once when the scene first enters the viewport.
  onPlay?: (el: HTMLDivElement) => void | (() => void);
  // Called on unmount (after onPlay returned a cleanup, that runs first).
  onCleanup?: () => void;
  rootMargin?: string;
  className?: string;
  style?: React.CSSProperties;
  // If true, fires onPlay even with reduced motion. Most scenes leave this
  // false so reduced-motion users get the static fallback only.
  fireOnReducedMotion?: boolean;
  id?: string;
}

// Boilerplate scene shell:
//   - attaches IntersectionObserver via useScrollScene
//   - calls onPlay(el) the first time the section enters view
//   - stores any cleanup returned by onPlay and runs it on unmount
//   - respects reduced-motion via useReducedMotion (skips onPlay by default)
export function AnimatedScene({
  children,
  onPlay,
  onCleanup,
  rootMargin = "-100px",
  className,
  style,
  fireOnReducedMotion = false,
  id,
}: AnimatedSceneProps) {
  const reduced = useReducedMotion();
  const { ref, played } = useScrollScene<HTMLDivElement>({ rootMargin });
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!played) return;
    if (reduced && !fireOnReducedMotion) return;
    const el = ref.current;
    if (!el || !onPlay) return;
    const ret = onPlay(el);
    if (typeof ret === "function") cleanupRef.current = ret;
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      onCleanup?.();
    };
  }, [played, reduced, fireOnReducedMotion, onPlay, onCleanup, ref]);

  return (
    <div ref={ref} id={id} className={className} style={style}>
      {children}
    </div>
  );
}
