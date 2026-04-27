"use client";

import { useEffect, useRef, useState } from "react";

export interface ScrollSceneOpts {
  rootMargin?: string;
  threshold?: number | number[];
  // Only fire once per mount. Default true.
  once?: boolean;
}

export interface ScrollSceneState<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  visible: boolean;
  played: boolean;
}

// Scroll-triggered scene primitive. Returns a ref to attach to the trigger
// element, plus visibility state. Reduced-motion is *not* short-circuited
// here — scenes themselves call `useReducedMotion()` to decide what to render.
export function useScrollScene<T extends HTMLElement = HTMLDivElement>(
  opts: ScrollSceneOpts = {},
): ScrollSceneState<T> {
  const { rootMargin = "-100px", threshold = 0, once = true } = opts;
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            setPlayed(true);
            if (once) io.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, visible, played };
}
