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

        {/* Parachute above crate */}
        <div
          ref={chuteRef}
          style={{
            position: "absolute",
            left: "50%",
            top: "calc(50% - 160px)",
            transform: "translate(-50%, 0)",
            width: 200,
            height: 100,
            pointerEvents: "none",
          }}
        >
          <svg width="200" height="100" viewBox="0 0 200 100" aria-hidden>
            <defs>
              <radialGradient id="ac-canopy" cx="0.5" cy="0.7">
                <stop offset="0%" stopColor="#FF4500" />
                <stop offset="55%" stopColor="#E60013" />
                <stop offset="100%" stopColor="#5a000c" />
              </radialGradient>
            </defs>
            <path
              d="M2 60 Q100 -16 198 60 L188 60 L172 38 L150 60 L128 38 L100 60 L72 38 L50 60 L28 38 L12 60 Z"
              fill="url(#ac-canopy)"
              stroke="#330006"
              strokeWidth="0.6"
            />
            <line x1="6" y1="60" x2="92" y2="98" stroke="#1a1a1a" strokeWidth="0.7" />
            <line x1="40" y1="60" x2="96" y2="98" stroke="#1a1a1a" strokeWidth="0.7" />
            <line x1="100" y1="60" x2="100" y2="98" stroke="#1a1a1a" strokeWidth="0.7" />
            <line x1="160" y1="60" x2="104" y2="98" stroke="#1a1a1a" strokeWidth="0.7" />
            <line x1="194" y1="60" x2="108" y2="98" stroke="#1a1a1a" strokeWidth="0.7" />
          </svg>
        </div>

        {/* Crate */}
        <div
          ref={crateRef}
          style={{
            position: "absolute",
            left: "50%",
            top: "calc(50% - 60px)",
            transform: "translate(-50%, 0)",
            width: 120,
            height: 120,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, #2a1208 0%, #1a0a04 50%, #0a0402 100%)",
              border: "2px solid #5a2a14",
              boxShadow: "0 0 24px rgba(230,0,19,0.4), inset 0 0 20px rgba(0,0,0,0.6)",
            }}
          />
          {/* Hazard stripes */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "40%",
              height: 14,
              background: "repeating-linear-gradient(45deg, var(--gold) 0 8px, #1a0a04 8px 16px)",
              opacity: 0.85,
            }}
          />
          {/* Crate label */}
          <div
            className="font-mono"
            style={{
              position: "absolute",
              bottom: 8,
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 9,
              letterSpacing: "0.25em",
              color: "var(--gold)",
              fontWeight: 700,
            }}
          >
            {badgeLabel}
          </div>

          {/* Lid */}
          <div
            ref={lidRef}
            style={{
              position: "absolute",
              left: -2,
              right: -2,
              top: -8,
              height: 14,
              background: "linear-gradient(135deg, #5a2a14 0%, #2a1208 100%)",
              border: "2px solid #5a2a14",
              willChange: "transform, opacity",
              transformOrigin: "50% 100%",
            }}
          />
        </div>

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
