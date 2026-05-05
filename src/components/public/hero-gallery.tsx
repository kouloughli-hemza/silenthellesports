"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { pickTranslation, type Locale, type Translated } from "@/types/domain";

interface GalleryItem {
  src: string;
  caption: Translated;
  meta: Translated;
}

// Static placeholders. Photos chosen for moody/dark/red palettes that read
// as Silent Hell, not generic gaming stock. Replace with admin-uploaded
// shots once /admin/gallery is wired up.
const ITEMS: GalleryItem[] = [
  {
    src: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
    caption: { en: "MAIN STAGE", ar: "المسرح الرئيسي" },
    meta: { en: "PMGC FINAL · ALGIERS · 2025", ar: "نهائي PMGC · الجزائر · ٢٠٢٥" },
  },
  {
    src: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80",
    caption: { en: "OPS ROOM", ar: "غرفة العمليات" },
    meta: { en: "LIVE FEED · GAME 06", ar: "بث مباشر · المباراة ٦" },
  },
  {
    src: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1200&q=80",
    caption: { en: "CHICKEN DINNER", ar: "العشاء الذهبي" },
    meta: { en: "ZONE 8 · 1ST PLACE", ar: "المنطقة ٨ · المركز الأول" },
  },
  {
    src: "https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=1200&q=80",
    caption: { en: "AFTER ACTION", ar: "ما بعد المعركة" },
    meta: { en: "DEBRIEF · DAY 03", ar: "استخلاص المعلومات · اليوم ٣" },
  },
];

const ROTATE_MS = 5500;

interface HeroGalleryProps {
  locale: Locale;
}

export function HeroGallery({ locale }: HeroGalleryProps) {
  const [idx, setIdx] = useState(0);
  const total = ITEMS.length;

  useEffect(() => {
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % total);
    }, ROTATE_MS);
    return () => window.clearInterval(t);
  }, [total]);

  const current = ITEMS[idx]!;
  const caption = pickTranslation(current.caption, locale);
  const meta = pickTranslation(current.meta, locale);
  const frameLabel = `FRAME ${String(idx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  return (
    <div
      className="hero-gallery-frame relative aspect-[3/4] w-full overflow-hidden"
      style={{ background: "var(--ash-3)" }}
      aria-roledescription="carousel"
      aria-label="Silent Hell gallery"
    >
      {/* Cross-fading photos. All sit in the same slot; only the active one
          is opaque. Each gets the slow Ken Burns zoom while it's visible. */}
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
            <Image
              src={item.src}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 360px"
              priority={i === 0}
              className={`hero-gallery-photo ${active ? "is-active" : ""}`}
            />
          </div>
        );
      })}

      {/* CRT scanlines */}
      <div aria-hidden className="hero-gallery-scanlines pointer-events-none absolute inset-0" />

      {/* Vignette + red wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 35%, rgba(10,10,10,0.7) 100%), linear-gradient(180deg, rgba(10,10,10,0.55) 0%, transparent 25%, transparent 55%, rgba(10,10,10,0.92) 100%), linear-gradient(135deg, transparent 60%, rgba(230,0,19,0.18) 100%)",
        }}
      />

      {/* Top bar — frame counter + recording dot */}
      <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
        <div
          className="flex items-center gap-2 px-2 py-1 font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{
            background: "rgba(10,10,10,0.7)",
            color: "var(--hell-red)",
            backdropFilter: "blur(4px)",
          }}
        >
          <span className="hero-gallery-rec" />
          REC
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

      {/* Red corner brackets */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2"
        style={{ borderColor: "var(--hell-red)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-2 bottom-2 h-4 w-4 border-r-2 border-b-2"
        style={{ borderColor: "var(--hell-red)" }}
      />

      {/* Caption + meta — keyed to idx so each rotation re-triggers the slide-in */}
      <div className="absolute right-5 bottom-5 left-5">
        <div
          key={`m-${idx}`}
          className="hero-gallery-meta font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {meta}
        </div>
        <div
          key={`c-${idx}`}
          className="hero-gallery-caption font-display mt-1 text-2xl leading-[0.95] font-black uppercase italic md:text-3xl"
          style={{ color: "var(--bone)" }}
        >
          {caption}
        </div>
      </div>

      {/* Progress segments — one per item, the active one fills via CSS keyframe */}
      <div className="absolute right-4 bottom-2 left-4 flex gap-1">
        {ITEMS.map((_, i) => (
          <div
            key={i}
            className="hero-gallery-bar h-[2px] flex-1 overflow-hidden"
            style={{ background: "rgba(245,240,232,0.15)" }}
          >
            <div
              className={`h-full ${i === idx ? "hero-gallery-bar-fill" : ""}`}
              style={{
                background: i < idx ? "var(--hell-red)" : "transparent",
                width: i < idx ? "100%" : i === idx ? "0%" : "0%",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
