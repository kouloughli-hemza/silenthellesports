"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isTouchOrSmall = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouchOrSmall || reduced) return;

    setEnabled(true);

    const place = (x: number, y: number, visible = true) => {
      const el = dotRef.current;
      if (!el) return;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.opacity = visible ? "1" : "0";
    };

    const onMove = (e: MouseEvent) => place(e.clientX, e.clientY, true);
    const onLeave = () => {
      if (dotRef.current) dotRef.current.style.opacity = "0";
    };
    const onEnter = (e: MouseEvent) => place(e.clientX, e.clientY, true);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  if (!enabled) return null;

  return <div ref={dotRef} className="cursor-dot" aria-hidden />;
}
