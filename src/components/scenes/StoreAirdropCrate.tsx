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

        {/* Domed parachute above the crate — dark canopy with red seam glow */}
        <div
          ref={chuteRef}
          style={{
            position: "absolute",
            left: "50%",
            top: "calc(50% - 220px)",
            transform: "translate(-50%, 0)",
            width: 260,
            height: 150,
            pointerEvents: "none",
          }}
        >
          <svg width="260" height="150" viewBox="0 0 260 150" aria-hidden>
            <defs>
              <linearGradient id="ac-canopy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2a2a2a" />
                <stop offset="55%" stopColor="#161616" />
                <stop offset="100%" stopColor="#080808" />
              </linearGradient>
              <linearGradient id="ac-canopy-shade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
              </linearGradient>
            </defs>
            {/* Outer dome silhouette */}
            <path d="M6 84 Q130 4 254 84 Q240 84 236 84 Q130 70 24 84 Q20 84 6 84 Z" fill="url(#ac-canopy)" stroke="#000" strokeWidth="0.6" />
            {/* Vertical fabric seams converging at apex */}
            {[
              "M130 -4 Q130 40 130 84",
              "M130 -4 Q90 36 50 80",
              "M130 -4 Q50 28 10 78",
              "M130 -4 Q170 36 210 80",
              "M130 -4 Q210 28 250 78",
              "M130 -4 Q110 36 70 80",
              "M130 -4 Q150 36 190 80",
            ].map((d) => (
              <path key={d} d={d} stroke="rgba(230,0,19,0.2)" strokeWidth="0.5" fill="none" />
            ))}
            {/* Underside shading */}
            <path d="M10 76 Q130 64 250 76 Q240 84 236 84 Q130 70 24 84 Q20 84 10 76 Z" fill="url(#ac-canopy-shade)" />
            {/* Top accent stripe (red) */}
            <path d="M8 84 Q130 -4 252 84" stroke="rgba(230,0,19,0.3)" strokeWidth="0.6" fill="none" />
            {/* Apex highlight */}
            <ellipse cx="130" cy="6" rx="6" ry="2" fill="rgba(230,0,19,0.35)" />
            {/* Shroud lines converging to crate hardpoints */}
            {[16, 44, 78, 112, 130, 148, 182, 216, 244].map((x, i) => (
              <line key={i} x1={x} y1="84" x2={130 + (x - 130) * 0.2} y2="148" stroke="#1a1a1a" strokeWidth="0.7" />
            ))}
          </svg>
        </div>

        {/* Crate — PUBG SHAPE (cube + X-strap + lid) in night-drop palette:
            dark silhouette, red strobe, faint red seam glow */}
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
          {/* Body — near-black with red glow seeping from edges */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(155deg, #1a1a1a 0%, #0e0e0e 55%, #050505 100%)",
              border: "1.5px solid #000",
              boxShadow: "0 0 40px rgba(230,0,19,0.5), inset 0 0 30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(230,0,19,0.25)",
            }}
          />

          {/* Faint red seam glow on top + bottom edges */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1.5, background: "rgba(230,0,19,0.45)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: "rgba(230,0,19,0.2)" }} />

          {/* Vertical strap */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 12,
              background: "#000",
              borderLeft: "1px solid #1a1a1a",
              borderRight: "1px solid #1a1a1a",
            }}
          />

          {/* Horizontal strap */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              height: 12,
              background: "#000",
              borderTop: "1px solid #1a1a1a",
              borderBottom: "1px solid #1a1a1a",
            }}
          />

          {/* Buckle — center hardware with red diode */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 20,
              height: 20,
              background: "linear-gradient(135deg, #2a2a2a 0%, #050505 100%)",
              border: "1px solid #000",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "radial-gradient(circle, #FF4500 0%, #E60013 60%, #5a000c 100%)",
                boxShadow: "0 0 8px rgba(230,0,19,0.8)",
              }}
            />
          </div>

          {/* AIR DROP stencil — faint white, top-left quadrant */}
          <div
            className="font-mono"
            style={{
              position: "absolute",
              top: 18,
              left: 14,
              fontSize: 8,
              letterSpacing: "0.25em",
              color: "rgba(245,240,232,0.3)",
              fontWeight: 700,
              textShadow: "0 1px 0 rgba(0,0,0,0.7)",
            }}
          >
            AIR DROP
          </div>

          {/* Silent Hell badge — bottom-right quadrant in faint gold */}
          <div
            className="font-mono"
            style={{
              position: "absolute",
              bottom: 14,
              right: 14,
              fontSize: 7,
              letterSpacing: "0.3em",
              color: "var(--gold)",
              fontWeight: 700,
              opacity: 0.55,
              textShadow: "0 1px 0 rgba(0,0,0,0.7)",
            }}
          >
            {badgeLabel}
          </div>

          {/* Strobe light atop the crate — pulsing red */}
          <div
            style={{
              position: "absolute",
              top: -10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "radial-gradient(circle, #FF4500 0%, #E60013 60%, #5a000c 100%)",
              boxShadow: "0 0 16px #FF4500, 0 0 28px rgba(230,0,19,0.7)",
              animation: "ac-strobe 0.65s ease-in-out infinite",
              zIndex: 2,
            }}
          />

          {/* Lid — slightly lighter dark shade */}
          <div
            ref={lidRef}
            style={{
              position: "absolute",
              left: -4,
              right: -4,
              top: -18,
              height: 22,
              background: "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 60%, #0e0e0e 100%)",
              border: "1.5px solid #000",
              borderBottom: "none",
              boxShadow: "inset 0 2px 0 rgba(230,0,19,0.18), 0 -2px 8px rgba(230,0,19,0.25)",
              willChange: "transform, opacity",
              transformOrigin: "50% 100%",
            }}
          >
            {/* Dark seam grid — same X read on the lid */}
            <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, transform: "translateX(-50%)", background: "#000" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1.2, background: "rgba(0,0,0,0.7)" }} />
            <div style={{ position: "absolute", top: 1.5, left: 4, right: 4, height: 1, background: "rgba(230,0,19,0.25)" }} />
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
