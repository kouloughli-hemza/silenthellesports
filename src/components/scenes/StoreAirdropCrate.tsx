"use client";

// Scene 05 — Store airdrop crate.
//
// Once per session (sessionStorage). When the store section enters viewport,
// a parachuted crate descends from the top of the viewport, lands with shake
// + dust burst, lid pops off, "NEW DROP" badge stamps in, then the whole
// overlay fades out into the existing section. ~3.2s total.

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ParticleSystem } from "@/lib/animations/particles";
import { createTimeline, shakeStage } from "@/lib/animations/timeline";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const SESSION_KEY = "sh:store-airdrop";

interface StoreAirdropCrateProps {
  badgeLabel: string;
  newDropLabel: string;
}

export function StoreAirdropCrate({ badgeLabel, newDropLabel }: StoreAirdropCrateProps) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (reduced) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {
      return;
    }
    const el = triggerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          try {
            sessionStorage.setItem(SESSION_KEY, "1");
          } catch {
            /* ignore */
          }
          setOpen(true);
          io.disconnect();
          break;
        }
      },
      { rootMargin: "-100px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <>
      <div ref={triggerRef} aria-hidden style={{ width: 1, height: 1 }} />
      {open ? (
        <CrateOverlay badgeLabel={badgeLabel} newDropLabel={newDropLabel} onComplete={() => setOpen(false)} />
      ) : null}
    </>
  );
}

interface CrateOverlayProps {
  badgeLabel: string;
  newDropLabel: string;
  onComplete: () => void;
}

function CrateOverlay({ badgeLabel, newDropLabel, onComplete }: CrateOverlayProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const shakeRef = useRef<HTMLDivElement | null>(null);
  const fxRef = useRef<HTMLCanvasElement | null>(null);
  const chuteRef = useRef<HTMLDivElement | null>(null);
  const crateRef = useRef<HTMLDivElement | null>(null);
  const lidRef = useRef<HTMLDivElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const stage = stageRef.current;
    const shakeEl = shakeRef.current;
    const fx = fxRef.current;
    if (!stage || !shakeEl || !fx) return;

    fx.style.width = `${window.innerWidth}px`;
    fx.style.height = `${window.innerHeight}px`;
    const fxSys = new ParticleSystem(fx, { maxParticles: 400 });
    fxSys.start();

    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current();
    };

    gsap.set(chuteRef.current, { y: -window.innerHeight * 0.55, opacity: 0, scaleY: 0, transformOrigin: "50% 100%" });
    gsap.set(crateRef.current, { y: -window.innerHeight * 0.55, opacity: 0, rotation: -2 });
    gsap.set(lidRef.current, { y: 0, rotation: 0, opacity: 1 });
    gsap.set(badgeRef.current, { opacity: 0, scale: 0.6, rotation: -8 });

    const tl = createTimeline({ onComplete: () => finish() });

    // Drop in
    tl.to(chuteRef.current, { opacity: 1, scaleY: 1, duration: 0.25, ease: "back.out(2.5)" }, 0);
    tl.to(crateRef.current, { opacity: 1, duration: 0.2 }, 0);
    tl.to([crateRef.current, chuteRef.current], { y: 0, duration: 1.6, ease: "power2.in" }, 0.05);

    // Land at t≈1.65
    const land = 1.7;
    tl.to(chuteRef.current, { opacity: 0, duration: 0.4 }, land);
    tl.add(shakeStage(shakeEl, 18, 0.5), land);
    tl.call(
      () => {
        const r = stage.getBoundingClientRect();
        fxSys.spawn("dust", { x: r.width / 2, y: r.height * 0.62, count: 80 });
        fxSys.spawn("spark", { x: r.width / 2, y: r.height * 0.62, count: 40, direction: -Math.PI / 2, spread: Math.PI });
        fxSys.spawn("ember", { x: r.width / 2, y: r.height * 0.62, count: 25 });
      },
      undefined,
      land,
    );

    // Lid blows off
    tl.to(lidRef.current, { y: -180, rotation: 35, opacity: 0, duration: 0.7, ease: "power2.out" }, land + 0.1);

    // Badge stamp
    tl.to(badgeRef.current, { opacity: 1, scale: 1, rotation: -8, duration: 0.35, ease: "back.out(2)" }, land + 0.35);

    // Hold + fade
    tl.to({}, { duration: 0.8 }, land + 0.7);
    tl.to(stage, { opacity: 0, duration: 0.5, ease: "power2.in" }, "+=0");

    return () => {
      tl.kill();
      fxSys.destroy();
    };
  }, []);

  function handleSkip() {
    completedRef.current = true;
    onCompleteRef.current();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") handleSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      ref={stageRef}
      role="dialog"
      aria-label="Store airdrop"
      aria-modal="true"
      onClick={handleSkip}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8400,
        background: "rgba(5,2,3,0.85)",
        backdropFilter: "blur(3px)",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <div ref={shakeRef} style={{ position: "absolute", inset: 0, willChange: "transform" }}>
        <canvas ref={fxRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

        {/* Ram-air parafoil above the crate (red, with visible cells + slight tear) */}
        <div
          ref={chuteRef}
          style={{
            position: "absolute",
            left: "50%",
            top: "calc(50% - 200px)",
            transform: "translate(-50%, 0)",
            width: 240,
            height: 120,
            pointerEvents: "none",
          }}
        >
          <svg width="240" height="120" viewBox="0 0 240 120" aria-hidden>
            <defs>
              <linearGradient id="ac-canopy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF4500" />
                <stop offset="55%" stopColor="#E60013" />
                <stop offset="100%" stopColor="#5a000c" />
              </linearGradient>
              <linearGradient id="ac-canopy-shade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
              </linearGradient>
            </defs>
            {/* Canopy wing shape */}
            <path d="M6 50 Q120 6 234 50 L234 70 Q120 56 6 70 Z" fill="url(#ac-canopy)" stroke="#330006" strokeWidth="0.6" />
            {/* Cell dividers */}
            {[34, 64, 94, 120, 146, 176, 206].map((x) => (
              <line key={x} x1={x} y1="42" x2={x} y2="66" stroke="#330006" strokeWidth="0.6" />
            ))}
            {/* Underside shading */}
            <path d="M6 64 Q120 50 234 64 L234 70 Q120 56 6 70 Z" fill="url(#ac-canopy-shade)" />
            {/* Leading-edge highlight */}
            <path d="M8 50 Q120 8 232 50" stroke="rgba(255,217,61,0.4)" strokeWidth="0.7" fill="none" />
            {/* Slight tear notch */}
            <path d="M198 50 L202 56 L206 50" stroke="#330006" strokeWidth="0.6" fill="none" />
            {/* Shroud lines converging to crate hardpoints */}
            {[12, 36, 64, 92, 120, 148, 176, 204, 228].map((x, i) => (
              <line key={i} x1={x} y1="70" x2={120 + (x - 120) * 0.18} y2="118" stroke="#1a1a1a" strokeWidth="0.7" />
            ))}
          </svg>
        </div>

        {/* Crate — canonical PUBG airdrop: red body, blue top, black cross straps */}
        <div
          ref={crateRef}
          style={{
            position: "absolute",
            left: "50%",
            top: "calc(50% - 60px)",
            transform: "translate(-50%, 0)",
            width: 140,
            height: 140,
            pointerEvents: "none",
          }}
        >
          {/* Body — bright crimson with inset shading */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(155deg, #d8232f 0%, #b81824 55%, #82111a 100%)",
              border: "2px solid #4a070d",
              boxShadow: "0 0 36px rgba(216,35,47,0.55), inset 0 0 30px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.12)",
            }}
          />

          {/* Vertical black strap (front center) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 14,
              background: "linear-gradient(90deg, #050505 0%, #1a1a1a 50%, #050505 100%)",
              borderLeft: "1px solid #000",
              borderRight: "1px solid #000",
            }}
          />

          {/* Horizontal black strap (front mid) */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              height: 14,
              background: "linear-gradient(180deg, #050505 0%, #1a1a1a 50%, #050505 100%)",
              borderTop: "1px solid #000",
              borderBottom: "1px solid #000",
            }}
          />

          {/* Strap buckle / hardware in center */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 18,
              height: 18,
              background: "linear-gradient(135deg, #2a2a2a 0%, #050505 100%)",
              border: "1px solid #000",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          />

          {/* Silent Hell badge — sits in one of the red panels */}
          <div
            className="font-mono"
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              fontSize: 8,
              letterSpacing: "0.25em",
              color: "#fff",
              fontWeight: 700,
              opacity: 0.92,
              textShadow: "0 1px 0 rgba(0,0,0,0.6)",
            }}
          >
            {badgeLabel}
          </div>

          {/* Strobe light on top — pulsing red */}
          <div
            style={{
              position: "absolute",
              top: -10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "radial-gradient(circle, #FFD93D 0%, #FF4500 30%, #E60013 70%, #5a000c 100%)",
              boxShadow: "0 0 16px #FF4500, 0 0 28px rgba(230,0,19,0.7)",
              animation: "ac-strobe 0.65s ease-in-out infinite",
              zIndex: 2,
            }}
          />

          {/* BLUE top / lid — segmented grid like the real crate */}
          <div
            ref={lidRef}
            style={{
              position: "absolute",
              left: -6,
              right: -6,
              top: -22,
              height: 28,
              background: "linear-gradient(180deg, #2a86d6 0%, #1f6cb6 60%, #16548f 100%)",
              border: "2px solid #0d3a66",
              borderBottom: "none",
              boxShadow: "inset 0 2px 0 rgba(255,255,255,0.18), 0 -2px 6px rgba(31,108,182,0.3)",
              willChange: "transform, opacity",
              transformOrigin: "50% 100%",
            }}
          >
            {/* 3-cell grid pattern on the blue top */}
            <div style={{ position: "absolute", top: 0, bottom: 0, left: "33.3%", width: 2, background: "rgba(13,58,102,0.8)" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, left: "66.6%", width: 2, background: "rgba(13,58,102,0.8)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1.5, background: "rgba(13,58,102,0.6)" }} />
            {/* highlight strip */}
            <div style={{ position: "absolute", top: 2, left: 4, right: 4, height: 1.5, background: "rgba(255,255,255,0.25)" }} />
          </div>
        </div>

        <style jsx>{`
          @keyframes ac-strobe {
            0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
            50% { opacity: 0.4; transform: translateX(-50%) scale(0.85); }
          }
        `}</style>

        {/* NEW DROP badge stamp */}
        <div
          ref={badgeRef}
          className="font-display"
          style={{
            position: "absolute",
            left: "50%",
            top: "calc(50% + 90px)",
            transform: "translate(-50%, 0) rotate(-8deg) scale(0.6)",
            padding: "10px 22px",
            border: "3px solid var(--hell-red)",
            color: "var(--hell-red)",
            background: "rgba(10,10,10,0.85)",
            fontSize: 28,
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            opacity: 0,
            boxShadow: "0 0 28px rgba(230,0,19,0.55)",
            pointerEvents: "none",
          }}
        >
          {newDropLabel}
        </div>
      </div>
    </div>
  );
}
