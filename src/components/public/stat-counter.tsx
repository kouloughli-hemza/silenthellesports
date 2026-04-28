"use client";

import { useEffect, useRef, useState } from "react";

interface StatCounterProps {
  value: number;
  suffix: string;
  label: string;
  index: number;
}

// Animates the number from 0 -> value the first time the cell enters the
// viewport. Uses an ease-out so big numbers feel like they "land". Respects
// prefers-reduced-motion: skips the animation and just shows the final value.
export function StatCounter({ value, suffix, label, index }: StatCounterProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [display, setDisplay] = useState(0);
  const [ignited, setIgnited] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setDisplay(value);
      setIgnited(true);
      return;
    }

    let raf = 0;
    let done = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !done) {
            done = true;
            setIgnited(true);
            const duration = 1400 + index * 80; // each tile lands slightly later
            const start = performance.now();
            const tick = (now: number) => {
              const elapsed = now - start;
              const t = Math.min(1, elapsed / duration);
              // easeOutQuint
              const eased = 1 - Math.pow(1 - t, 5);
              setDisplay(Math.round(eased * value));
              if (t < 1) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, index]);

  return (
    <div
      ref={ref}
      className="group relative flex flex-col items-start justify-end overflow-hidden px-3 py-7 sm:px-4 sm:py-8 md:px-6 md:py-10"
      style={{
        background: "var(--ash-1)",
        transition: "background 200ms ease",
        minWidth: 0,
      }}
    >
      {/* hover sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(180deg, rgba(230,0,19,0) 0%, rgba(230,0,19,0.07) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -top-3 -right-3 font-mono text-[10px] tracking-[0.25em] uppercase opacity-30"
        style={{ color: "var(--hell-red)" }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <div
        className="font-display leading-none font-black tracking-tight whitespace-nowrap italic"
        style={{
          color: ignited ? "var(--bone)" : "rgba(245,240,232,0.4)",
          transition: "color 600ms ease, text-shadow 600ms ease",
          textShadow: ignited
            ? "0 0 18px rgba(230,0,19,0.35), 0 0 4px rgba(230,0,19,0.5)"
            : "none",
          fontVariantNumeric: "tabular-nums",
          // Fluid sizing: scales from ~30px on tiny phones up to 88px on
          // wide desktop. Caps prevent runaway sizes at edges.
          fontSize: "clamp(1.875rem, 7.5vw, 5.5rem)",
          // Reserve the final number's footprint up-front so the row never
          // reflows mid-animation. Width holder is rendered invisibly inside;
          // the animated number sits on top via absolute positioning.
          position: "relative",
          display: "inline-block",
          maxWidth: "100%",
        }}
      >
        {/* invisible sizer: the FINAL string, claims width + height once and
            never changes. Animated number floats on top. */}
        <span style={{ visibility: "hidden" }} aria-hidden>
          {value.toLocaleString()}
          {suffix ?? ""}
        </span>
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
          }}
        >
          {display.toLocaleString()}
          {suffix ? (
            <span style={{ color: "var(--hell-red)" }}>{suffix}</span>
          ) : null}
        </span>
      </div>
      <div
        className="mt-3 h-px w-12"
        style={{ background: "var(--hell-red)" }}
        aria-hidden
      />
      <div
        className="mt-3 font-mono text-[10px] leading-tight tracking-[0.2em] uppercase sm:text-[11px] sm:tracking-[0.25em] md:text-xs"
        style={{ color: "rgba(245,240,232,0.7)" }}
      >
        {label}
      </div>
    </div>
  );
}
