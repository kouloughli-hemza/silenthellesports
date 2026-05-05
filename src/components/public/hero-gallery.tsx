"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { pickTranslation, type Locale, type Translated } from "@/types/domain";

export interface HeroGalleryItem {
  src: string;
  caption: Translated;
  meta: Translated;
  hud: { heading: string; zone: string; signal: string };
}

const ROTATE_MS = 5500;

interface HeroGalleryProps {
  locale: Locale;
  items: HeroGalleryItem[];
}

export function HeroGallery({ locale, items }: HeroGalleryProps) {
  // Hooks first — they must run on every render in the same order. The
  // empty-items guard sits AFTER all hook calls (Rules of Hooks).
  const [idx, setIdx] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [paused, setPaused] = useState(false);
  // Stays empty for SSR / first paint so the server-rendered HTML matches
  // the client's first render. The real clock takes over after mount.
  const [now, setNow] = useState<string>("--:--:--");
  const [typed, setTyped] = useState("");
  const frameRef = useRef<HTMLDivElement | null>(null);
  const total = items.length;

  const current = total > 0 ? items[idx % total] : null;
  const captionText = current ? pickTranslation(current.caption, locale) : "";
  const frameLabel = useMemo(
    () => `FRAME ${String(idx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    [idx, total],
  );

  // Rotation timer. Pauses while the cursor is over the frame.
  useEffect(() => {
    if (paused) return;
    if (total === 0) return;
    const t = window.setInterval(() => {
      setGlitch(true);
      window.setTimeout(() => setGlitch(false), 220);
      setIdx((i) => (i + 1) % total);
    }, ROTATE_MS);
    return () => window.clearInterval(t);
  }, [paused, total]);

  // Live timecode — set immediately on mount, then tick every second.
  useEffect(() => {
    setNow(formatClock(new Date()));
    const t = window.setInterval(() => setNow(formatClock(new Date())), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Typewriter caption — restart whenever the visible caption changes.
  useEffect(() => {
    setTyped("");
    if (!captionText) return;
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setTyped(captionText.slice(0, i));
      if (i >= captionText.length) window.clearInterval(t);
    }, 38);
    return () => window.clearInterval(t);
  }, [captionText]);

  // Cursor-tilt parallax. Skip on touch / reduced-motion.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onMove(e: PointerEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--tilt-x", `${(-y * 4).toFixed(2)}deg`);
      el.style.setProperty("--tilt-y", `${(x * 4).toFixed(2)}deg`);
    }
    function onLeave() {
      if (!el) return;
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    }
    window.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  function jumpTo(i: number) {
    if (i === idx) return;
    setGlitch(true);
    window.setTimeout(() => setGlitch(false), 220);
    setIdx(i);
  }

  // Empty-items guard placed AFTER all hooks so React's render-order
  // invariants stay intact. Parents already filter, but defending here
  // means future callers can't crash this component.
  if (!current) return null;

  const ITEMS = items;
  const next = ITEMS[(idx + 1) % total]!;
  const meta = pickTranslation(current.meta, locale);

  return (
    <div className="hero-gallery-stage">
      <div
        ref={frameRef}
        className={`hero-gallery-frame relative aspect-[3/4] w-full overflow-hidden ${glitch ? "is-glitching" : ""}`}
        style={{ background: "var(--ash-3)" }}
        aria-roledescription="carousel"
        aria-label="Silent Hell gallery"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Cross-fading photos with chromatic split layers. */}
        {ITEMS.map((item, i) => {
          const active = i === idx;
          return (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
                active ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={!active}
            >
              <div className="hero-gallery-rgb hero-gallery-rgb-r absolute inset-0">
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  priority={i === 0}
                  className={`hero-gallery-photo ${active ? "is-active" : ""}`}
                />
              </div>
              <div className="hero-gallery-rgb hero-gallery-rgb-c absolute inset-0">
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className={`hero-gallery-photo ${active ? "is-active" : ""}`}
                />
              </div>
              <Image
                src={item.src}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 360px"
                className={`hero-gallery-photo ${active ? "is-active" : ""}`}
              />
            </div>
          );
        })}

        {/* CRT scanlines + sweep */}
        <div aria-hidden className="hero-gallery-scanlines pointer-events-none absolute inset-0" />
        <div aria-hidden className="hero-gallery-scan-sweep pointer-events-none absolute inset-0" />

        {/* Vignette + red wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 35%, rgba(10,10,10,0.7) 100%), linear-gradient(180deg, rgba(10,10,10,0.55) 0%, transparent 25%, transparent 60%, rgba(10,10,10,0.95) 100%), linear-gradient(135deg, transparent 60%, rgba(230,0,19,0.18) 100%)",
          }}
        />

        {/* Top film-slate strip */}
        <div
          className="absolute top-0 right-0 left-0 flex items-center justify-between px-3 py-2 font-mono text-[9px] tracking-[0.3em] uppercase"
          style={{
            color: "rgba(245,240,232,0.7)",
            background: "linear-gradient(180deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0) 100%)",
          }}
        >
          <span style={{ color: "var(--hell-red)" }}>SHN · CAM 01</span>
          <span>3:4 · 4096</span>
        </div>

        {/* REC + frame counter row (below leader) */}
        <div className="absolute top-9 right-3 left-3 flex items-center justify-between">
          <div
            className="flex items-center gap-2 px-2 py-1 font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{
              background: "rgba(10,10,10,0.7)",
              color: "var(--hell-red)",
              backdropFilter: "blur(4px)",
            }}
          >
            <span className="hero-gallery-rec" />
            REC · {now}
          </div>
          <div
            className="px-2 py-1 font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{
              background: "rgba(10,10,10,0.7)",
              color: "rgba(245,240,232,0.7)",
              backdropFilter: "blur(4px)",
            }}
          >
            {frameLabel}
          </div>
        </div>

        {/* Picture-in-picture: NEXT preview */}
        <div className="absolute top-20 right-3 z-[3]">
          <div className="hero-gallery-pip relative h-16 w-20 overflow-hidden md:h-20 md:w-24">
            <Image
              key={`pip-${idx}`}
              src={next.src}
              alt=""
              fill
              sizes="100px"
              className="hero-gallery-pip-img"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 50%, rgba(10,10,10,0.8) 100%)" }}
            />
            <div
              className="absolute right-0 bottom-0 left-0 px-1 pb-0.5 font-mono text-[8px] tracking-[0.25em] uppercase"
              style={{ color: "var(--hell-red)" }}
            >
              NEXT
            </div>
          </div>
        </div>

        {/* Focus brackets */}
        <FocusCorner pos="tl" />
        <FocusCorner pos="tr" />
        <FocusCorner pos="bl" />
        <FocusCorner pos="br" />

        {/* Center crosshair */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ color: "rgba(245,240,232,0.18)" }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1">
            <line x1="11" y1="0" x2="11" y2="7" />
            <line x1="11" y1="15" x2="11" y2="22" />
            <line x1="0" y1="11" x2="7" y2="11" />
            <line x1="15" y1="11" x2="22" y2="11" />
            <circle cx="11" cy="11" r="1" fill="currentColor" />
          </svg>
        </div>

        {/* HUD data row above caption */}
        <div className="absolute right-5 bottom-[120px] left-5 flex items-center gap-3 font-mono text-[10px] tracking-[0.25em] uppercase">
          <span style={{ color: "var(--hell-red)" }}>HDG {current.hud.heading}</span>
          <span style={{ color: "rgba(245,240,232,0.4)" }}>·</span>
          <span style={{ color: "rgba(245,240,232,0.7)" }}>{current.hud.zone}</span>
          <span style={{ color: "rgba(245,240,232,0.4)" }}>·</span>
          <span style={{ color: "rgba(245,240,232,0.7)" }}>SIG {current.hud.signal}</span>
        </div>

        {/* Caption + meta */}
        <div className="absolute right-5 bottom-12 left-5">
          <div
            key={`m-${idx}`}
            className="hero-gallery-meta font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {meta}
          </div>
          <div
            className="font-display mt-1.5 text-[28px] leading-[0.92] font-black uppercase italic md:text-[34px]"
            style={{ color: "var(--bone)", textShadow: "0 2px 18px rgba(0,0,0,0.6)" }}
          >
            {typed}
            <span className="hero-gallery-cursor" aria-hidden>
              ▌
            </span>
          </div>
        </div>

        {/* Filmstrip thumbnails — replace the old abstract progress bars. */}
        <div className="absolute right-3 bottom-3 left-3 flex gap-1.5">
          {ITEMS.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => jumpTo(i)}
              className={`hero-gallery-thumb relative h-9 flex-1 overflow-hidden ${i === idx ? "is-active" : ""}`}
              aria-label={`Jump to frame ${i + 1}`}
            >
              <Image src={item.src} alt="" fill sizes="80px" className="hero-gallery-thumb-img" />
              <div aria-hidden className="absolute inset-0" style={{ background: "rgba(10,10,10,0.35)" }} />
              {i === idx && !paused ? <span className="hero-gallery-thumb-fill absolute right-0 bottom-0 left-0 h-[2px]" /> : null}
              {i === idx ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ boxShadow: "inset 0 0 0 1px var(--hell-red)" }}
                />
              ) : null}
            </button>
          ))}
        </div>

        {/* Paused indicator (pulses when cursor pauses rotation) */}
        {paused ? (
          <div
            className="absolute top-[58%] left-1/2 -translate-x-1/2 px-3 py-1.5 font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{
              color: "var(--bone)",
              background: "rgba(10,10,10,0.7)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(245,240,232,0.15)",
            }}
          >
            ⏸ PAUSED
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FocusCorner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "pointer-events-none absolute h-5 w-5";
  const styles: Record<string, string> = {
    tl: `${base} top-3 left-3 border-t-2 border-l-2`,
    tr: `${base} top-3 right-3 border-t-2 border-r-2`,
    bl: `${base} bottom-14 left-3 border-b-2 border-l-2`,
    br: `${base} bottom-14 right-3 border-b-2 border-r-2`,
  };
  return <span aria-hidden className={styles[pos]} style={{ borderColor: "var(--hell-red)" }} />;
}

function formatClock(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
