"use client";

import { useMemo } from "react";

interface Ember {
  id: number;
  left: number;
  duration: number;
  delay: number;
  drift: string;
  size: number;
}

interface EmberFieldProps {
  count?: number;
  opacity?: number;
}

export function EmberField({ count = 30, opacity = 0.7 }: EmberFieldProps) {
  // Deterministic + fixed precision so SSR markup matches client hydration.
  // Without the .toFixed() rounding, Next.js serializes "17.694%" but client
  // React rehydrates with the raw "17.693971759581473%" → hydration mismatch.
  const embers = useMemo<Ember[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const seed = (i + 1) * (count + 1);
      const rand = (n: number): number => {
        const x = Math.sin(seed * n) * 10000;
        return x - Math.floor(x);
      };
      const round = (v: number, p = 3): number => Number(v.toFixed(p));
      return {
        id: i,
        left: round(rand(1) * 100),
        duration: round(6 + rand(2) * 8),
        delay: round(rand(3) * 8),
        drift: `${round((rand(4) - 0.5) * 80, 2)}px`,
        size: round(1 + rand(5) * 3, 2),
      };
    });
  }, [count]);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity }}
      aria-hidden
    >
      {embers.map((e) => (
        <span
          key={e.id}
          className="ember"
          style={
            {
              left: `${e.left}%`,
              width: `${e.size}px`,
              height: `${e.size}px`,
              animationDuration: `${e.duration}s`,
              animationDelay: `${e.delay}s`,
              "--drift": e.drift,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
