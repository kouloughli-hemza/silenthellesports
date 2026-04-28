"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Locale, TeamMilestone } from "@/types/domain";

interface CareerPoint {
  id: string;
  title: string;
  description: string;
  occurredOn: string;
  category: TeamMilestone["category"];
  categoryLabel: string;
  x: number;
  y: number;
  landmark: string;
}

interface CareerMapClientProps {
  points: CareerPoint[];
  mapImageUrl: string;
  locale: Locale;
  hereLabel: string;
  landmarkLabel: string;
  tapHint: string;
}

export function CareerMapClient({
  points,
  mapImageUrl,
  locale,
  hereLabel,
  landmarkLabel,
  tapHint,
}: CareerMapClientProps) {
  const latestIndex = points.length - 1;
  const [selectedIdx, setSelectedIdx] = useState(latestIndex >= 0 ? latestIndex : 0);
  const [drawProgress, setDrawProgress] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDrawProgress(1);
      return;
    }
    let raf = 0;
    // Wait until the map is firmly in the viewport before starting the draw.
    // 0.6 threshold + a negative rootMargin biased towards the centre means
    // the user has to actually be looking at the map; we don't want them
    // arriving to find the route already 70% drawn.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const start = performance.now();
            const duration = 4800;
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              setDrawProgress(eased);
              if (t < 1) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: [0, 0.3, 0.6, 0.9], rootMargin: "-10% 0px -10% 0px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const polyline = useMemo(
    () => points.map((p) => `${p.x},${p.y}`).join(" "),
    [points],
  );

  // Per-segment cumulative lengths so we can place a "comet" at the leading
  // edge of the drawing line without touching the DOM.
  const segments = useMemo(() => {
    const out: Array<{
      from: CareerPoint;
      to: CareerPoint;
      len: number;
      cumStart: number;
    }> = [];
    let cum = 0;
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      out.push({ from: a, to: b, len, cumStart: cum });
      cum += len;
    }
    return { list: out, total: cum };
  }, [points]);

  const comet = useMemo(() => {
    if (segments.total === 0) return null;
    if (drawProgress <= 0 || drawProgress >= 1) return null;
    const target = drawProgress * segments.total;
    const seg = segments.list.find(
      (s) => target >= s.cumStart && target <= s.cumStart + s.len,
    );
    if (!seg) return null;
    const local = (target - seg.cumStart) / Math.max(0.0001, seg.len);
    return {
      x: seg.from.x + (seg.to.x - seg.from.x) * local,
      y: seg.from.y + (seg.to.y - seg.from.y) * local,
    };
  }, [drawProgress, segments]);

  const selected = points[selectedIdx] ?? points[0];

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div ref={ref} className="relative w-full" style={{ minWidth: 0 }}>
        <div
          className="relative mx-auto block w-full overflow-hidden select-none"
          style={{
            aspectRatio: "1 / 1",
            maxWidth: "100%",
            background: "var(--black)",
            border: "1px solid rgba(230,0,19,0.3)",
            boxShadow: "0 0 24px rgba(230,0,19,0.18) inset",
          }}
        >
          {/* Base map: desaturated, darkened, brand-tinted.
              loading="eager" — the polyline draw kicks off when the section
              enters viewport, so we want the map texture to already be there
              instead of drawing the route on a black box. */}
          <Image
            src={mapImageUrl}
            alt="Erangel career map"
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            style={{
              objectFit: "cover",
              pointerEvents: "none",
              filter:
                "grayscale(0.55) brightness(0.72) contrast(1.2) sepia(0.08) saturate(1.05)",
            }}
            loading="eager"
            draggable={false}
          />

          {/* Red duotone wash — softer, lets terrain breathe through */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(230,0,19,0.12), rgba(230,0,19,0.02) 60%, rgba(0,0,0,0.18))",
              mixBlendMode: "multiply",
            }}
          />

          {/* Vignette — gentler so corners don't swallow the map */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.45) 100%)",
            }}
          />

          {/* Scanline grain */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 3px)",
            }}
          />

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            <defs>
              <filter id="career-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.9" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id="career-comet"
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
              >
                <feGaussianBlur stdDeviation="1.6" />
              </filter>
            </defs>

            {points.length > 1 ? (
              <>
                {/* Underglow trail */}
                <polyline
                  points={polyline}
                  fill="none"
                  stroke="var(--hell-red)"
                  strokeWidth={1.6}
                  strokeDasharray={`${segments.total} ${segments.total}`}
                  strokeDashoffset={(1 - drawProgress) * segments.total}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#career-glow)"
                  style={{ opacity: 0.35, pointerEvents: "none" }}
                />
                {/* Main red trail */}
                <polyline
                  points={polyline}
                  fill="none"
                  stroke="var(--hell-red)"
                  strokeWidth={0.6}
                  strokeDasharray={`${segments.total} ${segments.total}`}
                  strokeDashoffset={(1 - drawProgress) * segments.total}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: 0.95, pointerEvents: "none" }}
                />
              </>
            ) : null}

            {/* Comet leading the draw */}
            {comet ? (
              <g style={{ pointerEvents: "none" }}>
                <circle
                  cx={comet.x}
                  cy={comet.y}
                  r={2.8}
                  fill="var(--bone)"
                  filter="url(#career-comet)"
                  opacity={0.9}
                />
                <circle
                  cx={comet.x}
                  cy={comet.y}
                  r={0.9}
                  fill="var(--bone)"
                />
              </g>
            ) : null}

            {points.map((p, i) => {
              const segShare = points.length <= 1 ? 1 : i / (points.length - 1);
              const visible = drawProgress >= segShare - 0.02;
              const isSelected = i === selectedIdx;
              const isLatest = i === latestIndex;
              return (
                <g
                  key={p.id}
                  className="career-node"
                  onClick={() => setSelectedIdx(i)}
                  role="button"
                  aria-label={`${p.title} — ${p.occurredOn}`}
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: `scale(${visible ? 1 : 0.4})`,
                    transformOrigin: `${p.x}px ${p.y}px`,
                    transformBox: "fill-box" as never,
                    transition:
                      "opacity 320ms ease, transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {/* invisible larger hit area — generous for fingertips */}
                  <circle cx={p.x} cy={p.y} r={6} fill="transparent" />

                  {isLatest ? (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={4}
                      fill="var(--hell-red)"
                      opacity={0.18}
                    >
                      <animate
                        attributeName="r"
                        from="4"
                        to="6.5"
                        dur="1.6s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.32"
                        to="0"
                        dur="1.6s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  ) : null}

                  {isSelected ? (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={3.4}
                      fill="none"
                      stroke="var(--hell-red)"
                      strokeWidth={0.4}
                      strokeDasharray="0.8 0.6"
                      opacity={0.85}
                    />
                  ) : null}

                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 2.4 : 1.7}
                    fill={isSelected || isLatest ? "var(--hell-red)" : "var(--bone)"}
                    stroke="var(--hell-red)"
                    strokeWidth={isSelected ? 0.7 : 0.45}
                    filter={isSelected ? "url(#career-glow)" : undefined}
                  />
                </g>
              );
            })}
          </svg>

          {/* Year labels — HTML overlay so size stays readable on mobile */}
          {points.map((p, i) => {
            const segShare = points.length <= 1 ? 1 : i / (points.length - 1);
            const visible = drawProgress >= segShare - 0.02;
            // Flip label to the inside-left of the dot when the dot sits near
            // the right edge so it never gets clipped on small screens.
            const flipLeft = p.x > 78;
            // Push label below when near top edge; default is above.
            const below = p.y < 14;
            return (
              <div
                key={`yr-${p.id}`}
                aria-hidden
                className="pointer-events-none absolute font-mono font-bold tracking-[0.05em] text-[10px] md:text-[11px]"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: `translate(${
                    flipLeft ? "calc(-100% - 8px)" : "8px"
                  }, ${below ? "8px" : "calc(-100% - 8px)"})`,
                  color: "var(--bone)",
                  textShadow:
                    "0 0 3px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.8), 0 1px 0 rgba(0,0,0,0.9)",
                  opacity: visible ? 1 : 0,
                  transition: "opacity 320ms ease",
                }}
              >
                {p.occurredOn.slice(0, 4)}
              </div>
            );
          })}

          {/* Tap-highlight + focus-ring kill */}
          <style>{`
            .career-node, .career-node * {
              -webkit-tap-highlight-color: transparent;
              outline: none !important;
            }
            .career-node:focus, .career-node:focus-visible {
              outline: none !important;
            }
          `}</style>

          {/* Hint pill */}
          <div
            className="absolute bottom-2 left-2 max-w-[60%] font-mono text-[8px] leading-tight tracking-[0.2em] uppercase md:bottom-3 md:left-3 md:text-[10px] md:tracking-[0.25em]"
            style={{
              color: "rgba(245,240,232,0.7)",
              textShadow: "0 1px 4px rgba(0,0,0,0.95)",
            }}
          >
            {tapHint}
          </div>

          {/* "We are here" pill on the latest dot */}
          {latestIndex >= 0 && drawProgress > 0.85 ? (
            <HereTag
              x={points[latestIndex]!.x}
              y={points[latestIndex]!.y}
              label={hereLabel}
            />
          ) : null}
        </div>
      </div>

      <aside
        className="notch p-4 md:p-7"
        style={{
          background: "var(--ash-1)",
          border: "1px solid rgba(230,0,19,0.25)",
          minWidth: 0,
        }}
      >
        {selected ? (
          <>
            <div
              className="font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "var(--ember)" }}
            >
              {`// ${String(selectedIdx + 1).padStart(2, "0")} · ${selected.categoryLabel}`}
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <span
                className="font-display text-4xl leading-none font-black italic md:text-6xl"
                style={{ color: "var(--hell-red)" }}
              >
                {selected.occurredOn.slice(0, 4)}
              </span>
              <span
                className="font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ color: "rgba(245,240,232,0.5)" }}
              >
                {formatDate(selected.occurredOn, locale)}
              </span>
            </div>
            <h3
              className="font-display mt-3 text-2xl font-black uppercase italic md:text-3xl"
              style={{ color: "var(--bone)" }}
            >
              {selected.title}
            </h3>
            {selected.description ? (
              <p
                className="mt-3 text-sm leading-relaxed md:text-base"
                style={{ color: "rgba(245,240,232,0.78)" }}
              >
                {selected.description}
              </p>
            ) : null}
            <div
              className="mt-5 flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] uppercase"
              style={{ color: "rgba(245,240,232,0.55)" }}
            >
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  background: "var(--hell-red)",
                  boxShadow: "0 0 6px var(--hell-red)",
                }}
              />
              {landmarkLabel}: {selected.landmark}
            </div>

            <div
              className="mt-6 -mx-1 flex gap-2 overflow-x-auto pb-2"
              role="tablist"
              aria-label="Career milestones"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "thin",
              }}
            >
              {points.map((p, i) => {
                const sel = i === selectedIdx;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={sel}
                    onClick={() => setSelectedIdx(i)}
                    className="font-mono text-[10px] tracking-[0.2em] uppercase whitespace-nowrap"
                    style={{
                      background: sel ? "var(--hell-red)" : "transparent",
                      color: sel ? "var(--bone)" : "rgba(245,240,232,0.7)",
                      border: `1px solid ${sel ? "var(--hell-red)" : "rgba(245,240,232,0.18)"}`,
                      padding: "6px 10px",
                      flex: "0 0 auto",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")} · {p.occurredOn.slice(0, 4)}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
}

function HereTag({
  x,
  y,
  label,
}: {
  x: number;
  y: number;
  label: string;
}) {
  // Flip left aggressively (any time the dot is past horizontal centre) so
  // the pill never extends beyond the map's right edge on narrow phones —
  // "We are here" + wide tracking is ~130px and easily overflows otherwise.
  const right = x > 50;
  const flipBelow = y < 22;
  const yOffset = flipBelow ? "calc(50% + 22px)" : "calc(-50% - 22px)";
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(${right ? "calc(-100% - 12px)" : "12px"}, ${yOffset})`,
      }}
    >
      <div
        className="font-mono text-[9px] tracking-[0.3em] whitespace-nowrap uppercase md:text-[10px]"
        style={{
          background: "rgba(230,0,19,0.92)",
          color: "var(--bone)",
          padding: "4px 8px",
          border: "1px solid rgba(245,240,232,0.4)",
          boxShadow: "0 0 10px rgba(230,0,19,0.5)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function formatDate(iso: string, locale: Locale): string {
  try {
    return new Date(iso).toLocaleDateString(
      locale === "ar" ? "ar-DZ" : "en-US",
      { day: "numeric", month: "short", year: "numeric" },
    );
  } catch {
    return "";
  }
}
