"use client";

import { useEffect, useState } from "react";
import { SkullIcon } from "@/components/brand";
import { countdownTo } from "@/lib/utils/format";

interface FeaturedDropProps {
  endsAt: string;
  featuredLabel: string;
  title: string;
  hrsLabel: string;
  minLabel: string;
  secLabel: string;
}

export function FeaturedDrop({
  endsAt,
  featuredLabel,
  title,
  hrsLabel,
  minLabel,
  secLabel,
}: FeaturedDropProps) {
  // SSR renders zeros so server/client HTML matches. Real countdown starts
  // after mount, avoiding the Date.now() drift that caused hydration errors.
  const [c, setC] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setC(countdownTo(endsAt));
    const id = setInterval(() => setC(countdownTo(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const totalHours = Math.min(99, c.days * 24 + c.hours);

  const cells = [
    { v: String(totalHours).padStart(2, "0"), l: hrsLabel },
    { v: String(c.minutes).padStart(2, "0"), l: minLabel },
    { v: String(c.seconds).padStart(2, "0"), l: secLabel },
  ];

  return (
    <div
      className="notch-sm flex items-center gap-5 p-5"
      style={{
        background: "var(--ash-1)",
        border: "1px solid rgba(230,0,19,0.3)",
      }}
    >
      <div className="flex-shrink-0">
        <SkullIcon size={36} />
      </div>
      <div className="flex-1">
        <div
          className="font-mono text-[10px] tracking-[0.25em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {featuredLabel}
        </div>
        <div className="font-display mt-1 text-lg leading-tight font-black uppercase italic">
          {title}
        </div>
        <div className="mt-3 flex gap-1">
          {cells.map((cell, i) => (
            <div
              key={i}
              className="px-3 py-1.5"
              style={{ background: "var(--black)" }}
            >
              <span
                className="stat-number text-base font-bold"
                style={{ color: "var(--hell-red)" }}
              >
                {cell.v}
              </span>
              <span
                className="ml-1.5 font-mono text-[9px] tracking-[0.25em]"
                style={{ color: "rgba(245,240,232,0.4)" }}
              >
                {cell.l}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
