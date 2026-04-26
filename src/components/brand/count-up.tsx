"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function CountUp({
  to,
  duration = 1800,
  prefix = "",
  suffix = "",
  decimals = 0,
}: CountUpProps) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVal(to);
      started.current = true;
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              setVal(eased * to);
              if (t < 1) requestAnimationFrame(tick);
              else setVal(to);
            };
            requestAnimationFrame(tick);
          }
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);

  const formatted = decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toLocaleString();

  return (
    <span ref={ref} className="stat-number">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
