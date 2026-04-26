"use client";

import { useEffect, useState } from "react";
import { countdownTo, type Countdown } from "@/lib/utils/format";

interface CountdownTickerProps {
  initial: Countdown;
  target: string;
  labels: { days: string; hours: string; minutes: string; seconds: string };
  size?: "lg" | "md";
}

const pad = (n: number): string => String(Math.max(0, n)).padStart(2, "0");

export function CountdownTicker({ initial, target, labels, size = "lg" }: CountdownTickerProps) {
  const [c, setC] = useState<Countdown>(initial);

  useEffect(() => {
    const id = window.setInterval(() => {
      setC(countdownTo(target));
    }, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const cells: Array<{ v: string; l: string }> = [
    { v: pad(c.days), l: labels.days },
    { v: pad(c.hours), l: labels.hours },
    { v: pad(c.minutes), l: labels.minutes },
    { v: pad(c.seconds), l: labels.seconds },
  ];

  const numberClass =
    size === "lg"
      ? "stat-number font-bold text-3xl md:text-5xl"
      : "stat-number font-bold text-2xl md:text-3xl";
  const padClass = size === "lg" ? "px-4 md:px-8 py-5" : "px-3 md:px-5 py-3";

  return (
    <div
      className="grid grid-cols-4 gap-px"
      style={{ background: "rgba(230,0,19,0.4)" }}
      role="timer"
      aria-live="polite"
    >
      {cells.map((t, i) => (
        <div
          key={i}
          className={`${padClass} flex items-baseline justify-between`}
          style={{ background: "var(--ash-3)" }}
        >
          <span className={numberClass} style={{ color: "var(--hell-red)" }}>
            {t.v}
          </span>
          <span
            className="ml-2 font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(245,240,232,0.5)" }}
          >
            {t.l}
          </span>
        </div>
      ))}
    </div>
  );
}
