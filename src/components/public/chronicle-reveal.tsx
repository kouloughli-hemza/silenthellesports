"use client";

import { useEffect, useRef, useState } from "react";

interface ChronicleRevealProps {
  index: number;
  children: React.ReactNode;
}

// Fade + lift each timeline entry into view as it scrolls past the threshold.
// Skips the animation under prefers-reduced-motion.
export function ChronicleReveal({ index, children }: ChronicleRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 700ms ease ${index * 60}ms, transform 700ms ease ${
          index * 60
        }ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
