"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

interface Point {
  x: number;
  y: number;
}

interface BoardPayload {
  id: string;
  title: string;
  description: string;
  mapName: string;
  mapImageUrl: string | null;
  drop: Point;
  rotation: Point[];
}

interface TacticsBoardClientProps {
  boards: BoardPayload[];
  dropLabel: string;
  rotationLabel: string;
}

// Both stock PUBG maps are 8 km × 8 km. Coords are 0–100% of map width/height,
// so 1% = 80 m. Used to surface the total rotation distance in the sidebar.
const MAP_SIDE_METRES = 8000;

export function TacticsBoardClient({
  boards,
  dropLabel,
  rotationLabel,
}: TacticsBoardClientProps) {
  const [activeId, setActiveId] = useState(boards[0]?.id ?? "");
  const active = boards.find((b) => b.id === activeId) ?? boards[0];

  return (
    <div>
      {boards.length > 1 ? (
        <div
          className="mb-5 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Tactics boards"
        >
          {boards.map((b) => {
            const selected = b.id === active?.id;
            return (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(b.id)}
                className="font-mono text-[10px] tracking-[0.25em] uppercase transition-colors md:text-[11px]"
                style={{
                  background: selected ? "var(--hell-red)" : "var(--ash-1)",
                  color: selected ? "var(--bone)" : "rgba(245,240,232,0.7)",
                  border: `1px solid ${selected ? "var(--hell-red)" : "rgba(245,240,232,0.15)"}`,
                  padding: "8px 14px",
                }}
              >
                {b.mapName} · {b.title}
              </button>
            );
          })}
        </div>
      ) : null}

      {active ? (
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <BoardCanvas
            board={active}
            dropLabel={dropLabel}
            rotationLabel={rotationLabel}
          />

          <BoardSidebar
            board={active}
            dropLabel={dropLabel}
            rotationLabel={rotationLabel}
          />
        </div>
      ) : null}
    </div>
  );
}

function BoardSidebar({
  board,
  dropLabel,
  rotationLabel,
}: {
  board: BoardPayload;
  dropLabel: string;
  rotationLabel: string;
}) {
  const totalDistance = useMemo(() => totalRotationMetres(board), [board]);
  return (
    <aside
      className="notch p-5 md:p-7"
      style={{
        background: "var(--ash-1)",
        border: "1px solid rgba(230,0,19,0.25)",
      }}
    >
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--ember)" }}
      >
        {`// ${board.mapName.toUpperCase()}`}
      </div>
      <h3
        className="font-display mt-2 text-2xl font-black uppercase italic md:text-3xl"
        style={{ color: "var(--bone)" }}
      >
        {board.title}
      </h3>
      {board.description ? (
        <p
          className="mt-3 text-sm leading-relaxed md:text-base"
          style={{ color: "rgba(245,240,232,0.78)" }}
        >
          {board.description}
        </p>
      ) : null}

      <dl
        className="mt-6 grid grid-cols-2 gap-px"
        style={{ background: "rgba(230,0,19,0.2)" }}
      >
        <Stat
          label={dropLabel}
          value={`${board.drop.x.toFixed(1)} · ${board.drop.y.toFixed(1)}`}
          accent="var(--hell-red)"
        />
        <Stat
          label={rotationLabel}
          value={`${board.rotation.length} pts`}
          accent="var(--bone)"
        />
        <Stat
          label="Total distance"
          value={
            totalDistance >= 1000
              ? `${(totalDistance / 1000).toFixed(2)} km`
              : `${totalDistance.toFixed(0)} m`
          }
          accent="var(--bone)"
        />
        <Stat label="Map size" value="8 × 8 km" accent="var(--bone)" />
      </dl>
    </aside>
  );
}

function totalRotationMetres(board: BoardPayload): number {
  const points = [board.drop, ...board.rotation];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    if (!a || !b) continue;
    const dx = (b.x - a.x) * (MAP_SIDE_METRES / 100);
    const dy = (b.y - a.y) * (MAP_SIDE_METRES / 100);
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

// Static map canvas: animated rotation polyline + pulsing drop marker.
// No zoom, no pan — purely a poster of the squad's plan.
function BoardCanvas({
  board,
  dropLabel,
  rotationLabel,
}: {
  board: BoardPayload;
  dropLabel: string;
  rotationLabel: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [drawProgress, setDrawProgress] = useState(0);

  useEffect(() => {
    setDrawProgress(0);
  }, [board.id]);

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
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const start = performance.now();
            const duration = 1400;
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
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [board.id]);

  const points = [board.drop, ...board.rotation];
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const pathLength = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const prev = points[i - 1];
    if (!prev) return sum;
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);

  return (
    <div className="relative">
      <div
        ref={ref}
        className="relative w-full overflow-hidden select-none"
        style={{
          aspectRatio: "1 / 1",
          background: "var(--ash-3)",
          border: "1px solid rgba(230,0,19,0.3)",
          boxShadow: "0 0 24px rgba(230,0,19,0.18) inset",
        }}
      >
        {board.mapImageUrl ? (
          <Image
            src={board.mapImageUrl}
            alt={`${board.mapName} — ${board.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            style={{ objectFit: "cover", pointerEvents: "none" }}
            loading="eager"
            draggable={false}
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(230,0,19,0.08) 0%, var(--ash-3) 75%)",
              backgroundColor: "var(--ash-3)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(245,240,232,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(245,240,232,0.06) 1px, transparent 1px)",
                backgroundSize: "10% 10%, 10% 10%",
              }}
            />
            <div
              className="font-display absolute inset-0 flex items-center justify-center text-5xl font-black uppercase italic md:text-7xl"
              style={{
                color: "rgba(230,0,19,0.18)",
                letterSpacing: "0.02em",
              }}
            >
              {board.mapName}
            </div>
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 100%)",
          }}
        />
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {board.rotation.length > 0 ? (
            <polyline
              points={polyline}
              fill="none"
              stroke="var(--hell-red)"
              strokeWidth={0.55}
              strokeDasharray={`${pathLength} ${pathLength}`}
              strokeDashoffset={(1 - drawProgress) * pathLength}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              style={{ opacity: 0.95 }}
            />
          ) : null}

          {board.rotation.map((p, i) => {
            const segIndex = i + 1;
            const segShare = segIndex / Math.max(1, points.length - 1);
            const visible = drawProgress >= segShare - 0.02 ? 1 : 0;
            return (
              <g
                key={`r-${i}`}
                style={{ opacity: visible, transition: "opacity 200ms ease" }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={1.6}
                  fill="var(--bone)"
                  stroke="var(--hell-red)"
                  strokeWidth={0.45}
                />
                <text
                  x={p.x + 2}
                  y={p.y + 0.8}
                  fontSize={3}
                  fill="var(--bone)"
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </text>
              </g>
            );
          })}

          <g
            style={{
              opacity: drawProgress > 0 ? 1 : 0,
              transition: "opacity 300ms ease",
            }}
          >
            <circle
              cx={board.drop.x}
              cy={board.drop.y}
              r={4}
              fill="var(--hell-red)"
              opacity={0.18}
            >
              <animate
                attributeName="r"
                from="4"
                to="6"
                dur="1.6s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.25"
                to="0"
                dur="1.6s"
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={board.drop.x}
              cy={board.drop.y}
              r={1.8}
              fill="var(--hell-red)"
              filter="url(#glow)"
            />
          </g>
        </svg>

        <div
          className="absolute bottom-3 left-3 flex flex-wrap gap-3 font-mono text-[9px] tracking-[0.2em] uppercase md:text-[10px]"
          style={{ color: "var(--bone)" }}
        >
          <span className="inline-flex items-center gap-1.5">
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
            {dropLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: 14,
                height: 2,
                background: "var(--hell-red)",
              }}
            />
            {rotationLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="px-3 py-3" style={{ background: "var(--ash-3)" }}>
      <div
        className="font-mono text-[9px] tracking-[0.25em] uppercase"
        style={{ color: "rgba(245,240,232,0.55)" }}
      >
        {label}
      </div>
      <div
        className="font-display mt-1 text-base font-bold italic"
        style={{ color: accent }}
      >
        {value}
      </div>
    </div>
  );
}
