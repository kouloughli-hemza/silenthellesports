"use client";

import { useEffect, useState } from "react";
import { countdownTo } from "@/lib/utils/format";

interface GiveawayCountdownProps {
  endsAt: string;
  daysLabel: string;
  hoursLabel: string;
  minutesLabel: string;
  secondsLabel: string;
}

export function GiveawayCountdown({
  endsAt,
  daysLabel,
  hoursLabel,
  minutesLabel,
  secondsLabel,
}: GiveawayCountdownProps) {
  // SSR renders zeros so server/client HTML matches; live countdown starts after mount.
  const [c, setC] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setC(countdownTo(endsAt));
    const id = setInterval(() => setC(countdownTo(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const cells = [
    { v: String(c.days).padStart(2, "0"), l: daysLabel },
    { v: String(c.hours).padStart(2, "0"), l: hoursLabel },
    { v: String(c.minutes).padStart(2, "0"), l: minutesLabel },
    { v: String(c.seconds).padStart(2, "0"), l: secondsLabel },
  ];

  return (
    <div
      className="mb-px grid grid-cols-4 gap-px"
      style={{ background: "rgba(230,0,19,0.4)" }}
    >
      {cells.map((cell, i) => (
        <div
          key={i}
          className="flex items-baseline justify-between px-4 py-5 md:px-8"
          style={{ background: "var(--ash-3)" }}
        >
          <span
            className="stat-number text-3xl font-bold md:text-5xl"
            style={{ color: "var(--hell-red)" }}
          >
            {cell.v}
          </span>
          <span
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(245,240,232,0.5)" }}
          >
            {cell.l}
          </span>
        </div>
      ))}
    </div>
  );
}
