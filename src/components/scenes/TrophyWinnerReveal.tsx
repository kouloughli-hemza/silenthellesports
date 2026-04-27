"use client";

// Scene 03 — Trophy "WINNER WINNER CHICKEN DINNER" reveal.
//
// Plays as a full-screen overlay the first time the trophy section enters the
// viewport in a given session (gated by sessionStorage). ~3.5s total.
//
// Reference: prototype-winner-winner.html. Beats:
//   t=0.00  brackets stagger in (scale 0.5→1, back.out(2))
//   t=0.20  diagonal sweep flash
//   t=0.60  burst1 (180 spark+ember+gold) + ring1 + 20px shake
//   t=0.75  WINNER chars rotateX(-90→0) back.out(1.8) stagger 0.025
//   t=1.20  burst2 (140) + ring2 + 14px shake
//   t=1.25  CHICKEN DINNER chars
//   t=1.70  burst3 (180) + ring3
//   t=1.90  subtitle fade
//   t=2.30  panel fade-out, overlay dismiss
//
// onComplete fires when the panel closes; parent unmounts the overlay.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ParticleSystem } from "@/lib/animations/particles";
import { createTimeline, shakeStage, splitChars } from "@/lib/animations/timeline";

interface TrophyWinnerRevealProps {
  winnerLine: string;
  chickenLine: string;
  subtitle: string;
  skipLabel: string;
  onComplete: () => void;
}

export function TrophyWinnerReveal({
  winnerLine,
  chickenLine,
  subtitle,
  skipLabel,
  onComplete,
}: TrophyWinnerRevealProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const shakeRef = useRef<HTMLDivElement | null>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const winnerRef = useRef<HTMLDivElement | null>(null);
  const chickenRef = useRef<HTMLDivElement | null>(null);
  const subtitleRef = useRef<HTMLDivElement | null>(null);
  const sweepRef = useRef<HTMLDivElement | null>(null);
  const scopeRef = useRef<HTMLDivElement | null>(null);
  const weaponsRef = useRef<HTMLDivElement | null>(null);
  const chickenSilhouetteRef = useRef<HTMLDivElement | null>(null);
  const ring1Ref = useRef<HTMLDivElement | null>(null);
  const ring2Ref = useRef<HTMLDivElement | null>(null);
  const ring3Ref = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const stage = stageRef.current;
    const shakeEl = shakeRef.current;
    const fx = fxCanvasRef.current;
    if (!stage || !shakeEl || !fx) return;

    fx.style.width = `${window.innerWidth}px`;
    fx.style.height = `${window.innerHeight}px`;
    const fxSys = new ParticleSystem(fx, { maxParticles: 700 });
    fxSys.start();

    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current();
    };

    const winnerChars = winnerRef.current ? splitChars(winnerRef.current) : [];
    const chickenChars = chickenRef.current ? splitChars(chickenRef.current) : [];

    gsap.set("[data-bracket]", { opacity: 0, scale: 0.5 });
    gsap.set(winnerChars, { opacity: 0, y: 30, scale: 0.6, transformOrigin: "50% 50%" });
    gsap.set(chickenChars, { opacity: 0, y: 30, scale: 0.6, transformOrigin: "50% 50%" });
    gsap.set(subtitleRef.current, { opacity: 0, y: 12 });
    gsap.set(sweepRef.current, { opacity: 0, x: "-150%" });
    gsap.set(scopeRef.current, { opacity: 0, scale: 0.4, rotation: -90 });
    gsap.set(weaponsRef.current, { opacity: 0, scale: 0.6 });
    gsap.set(chickenSilhouetteRef.current, { opacity: 0, x: "-30vw", y: 0 });
    gsap.set([ring1Ref.current, ring2Ref.current, ring3Ref.current], { scale: 0, opacity: 0 });

    const center = () => ({ x: stage.getBoundingClientRect().width / 2, y: stage.getBoundingClientRect().height / 2 });

    const tl = createTimeline({ onComplete: () => finish() });
    tlRef.current = tl;

    // Brackets
    tl.to("[data-bracket]", { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)", stagger: 0.05 }, 0);

    // Scope reticle rotates in behind text
    tl.to(scopeRef.current, { opacity: 0.85, scale: 1, rotation: 0, duration: 0.8, ease: "power3.out" }, 0.1);

    // Sweep flash
    tl.to(sweepRef.current, { opacity: 0.6, duration: 0.05 }, 0.2);
    tl.to(sweepRef.current, { x: "150%", duration: 0.7, ease: "power3.out" }, 0.2);
    tl.to(sweepRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" }, 0.6);

    // Burst 1 + ring 1 + shake
    tl.call(
      () => {
        const c = center();
        fxSys.spawn("burst", { x: c.x, y: c.y, count: 100 });
        fxSys.spawn("spark", { x: c.x, y: c.y, count: 50, direction: -Math.PI / 2, spread: Math.PI });
        fxSys.spawn("ember", { x: c.x, y: c.y, count: 30 });
      },
      undefined,
      0.6,
    );
    tl.to(ring1Ref.current, { scale: 8, opacity: 0.9, duration: 0.5, ease: "power2.out" }, 0.6);
    tl.to(ring1Ref.current, { opacity: 0, duration: 0.5, ease: "power2.in" }, 0.9);
    tl.add(shakeStage(shakeEl, 20, 0.5), 0.6);

    // WINNER chars
    tl.to(
      winnerChars,
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.8)", stagger: 0.04 },
      0.75,
    );

    // Burst 2 + ring 2 + shake
    tl.call(
      () => {
        const c = center();
        fxSys.spawn("burst", { x: c.x, y: c.y, count: 80 });
        fxSys.spawn("spark", { x: c.x, y: c.y, count: 40, direction: -Math.PI / 2, spread: Math.PI });
        fxSys.spawn("ember", { x: c.x, y: c.y, count: 20 });
      },
      undefined,
      1.2,
    );
    tl.to(ring2Ref.current, { scale: 10, opacity: 0.7, duration: 0.6, ease: "power2.out" }, 1.2);
    tl.to(ring2Ref.current, { opacity: 0, duration: 0.6, ease: "power2.in" }, 1.5);
    tl.add(shakeStage(shakeEl, 14, 0.45), 1.2);

    // CHICKEN DINNER chars
    tl.to(
      chickenChars,
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.8)", stagger: 0.04 },
      1.25,
    );

    // Burst 3 + ring 3
    tl.call(
      () => {
        const c = center();
        fxSys.spawn("burst", { x: c.x, y: c.y, count: 120 });
        fxSys.spawn("ember", { x: c.x, y: c.y, count: 40 });
      },
      undefined,
      1.7,
    );
    tl.to(ring3Ref.current, { scale: 12, opacity: 0.5, duration: 0.7, ease: "power2.out" }, 1.7);
    tl.to(ring3Ref.current, { opacity: 0, duration: 0.7, ease: "power2.in" }, 2.0);

    // Crossed weapons crash in behind the text
    tl.to(weaponsRef.current, { opacity: 0.85, scale: 1, duration: 0.4, ease: "back.out(1.8)" }, 1.7);

    // Chicken silhouette flies across L→R behind everything
    tl.to(
      chickenSilhouetteRef.current,
      { opacity: 0.9, duration: 0.3, ease: "power2.out" },
      1.8,
    );
    tl.to(
      chickenSilhouetteRef.current,
      { x: "30vw", y: -40, duration: 1.6, ease: "sine.inOut" },
      1.8,
    );
    tl.to(chickenSilhouetteRef.current, { opacity: 0, duration: 0.4, ease: "power2.in" }, 3.0);

    // Subtitle
    tl.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 1.9);

    // Hold the assembled scene for ~2.5s so the user can actually read it,
    // then fade out into the section underneath.
    tl.to({}, { duration: 2.5 }, 2.4);
    tl.to(stage, { opacity: 0, duration: 0.7, ease: "power2.in" }, "+=0");

    return () => {
      tl.kill();
      tlRef.current = null;
      fxSys.destroy();
    };
    // Build timeline once on mount; onComplete via ref.
  }, []);

  function handleSkip() {
    tlRef.current?.progress(1).kill();
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

  return (
    <div
      ref={stageRef}
      role="dialog"
      aria-label="Trophy reveal"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8500,
        background: "rgba(5,2,3,0.92)",
        backdropFilter: "blur(4px)",
        overflow: "hidden",
        perspective: "800px",
      }}
    >
      <div ref={shakeRef} style={{ position: "absolute", inset: 0, willChange: "transform" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, rgba(255,217,61,0.12) 0%, rgba(230,0,19,0.08) 30%, transparent 70%)",
          }}
        />

        <canvas ref={fxCanvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

        {/* Scope reticle behind text — the iconic PUBG crosshair circle */}
        <div
          ref={scopeRef}
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(560px, 78vw)",
            height: "min(560px, 78vw)",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <ScopeReticle />
        </div>

        {/* Chicken silhouette flying across — kept behind text via lower z */}
        <div
          ref={chickenSilhouetteRef}
          aria-hidden
          style={{
            position: "absolute",
            left: "20%",
            top: "55%",
            transform: "translate(-50%, -50%)",
            width: 110,
            height: 90,
            opacity: 0,
            pointerEvents: "none",
            color: "var(--gold)",
            filter: "drop-shadow(0 0 18px rgba(255,217,61,0.55))",
          }}
        >
          <ChickenSVG />
        </div>

        <Ring ref={ring1Ref} color="var(--gold)" />
        <Ring ref={ring2Ref} color="var(--ember)" />
        <Ring ref={ring3Ref} color="var(--hell-red)" />

        {/* Crossed weapons behind/under the text block */}
        <div
          ref={weaponsRef}
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(440px, 70vw)",
            opacity: 0,
            pointerEvents: "none",
            filter: "drop-shadow(0 0 20px rgba(255,217,61,0.45))",
          }}
        >
          <CrossedWeaponsSVG />
        </div>

        <div
          ref={sweepRef}
          style={{
            position: "absolute",
            top: "30%",
            left: 0,
            width: "60%",
            height: "40%",
            background: "linear-gradient(105deg, transparent 0%, rgba(255,217,61,0.4) 45%, rgba(230,0,19,0.5) 50%, rgba(255,217,61,0.4) 55%, transparent 100%)",
            transform: "skewX(-12deg)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            transform: "translateY(-50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div
            ref={winnerRef}
            className="font-display"
            style={{
              fontSize: "clamp(40px, 9vw, 110px)",
              fontWeight: 900,
              fontStyle: "italic",
              letterSpacing: "0.03em",
              color: "var(--gold)",
              textShadow: "0 0 30px rgba(255,217,61,0.6), 0 0 60px rgba(230,0,19,0.4)",
              lineHeight: 1,
            }}
          >
            {winnerLine}
          </div>
          <div
            ref={chickenRef}
            className="font-display"
            style={{
              marginTop: 14,
              fontSize: "clamp(34px, 8vw, 96px)",
              fontWeight: 900,
              fontStyle: "italic",
              letterSpacing: "0.04em",
              color: "var(--gold)",
              textShadow: "0 0 30px rgba(255,217,61,0.7), 0 0 60px rgba(255,69,0,0.4)",
              lineHeight: 1,
            }}
          >
            {chickenLine}
          </div>
          <div
            ref={subtitleRef}
            className="font-mono"
            style={{
              marginTop: 26,
              fontSize: 12,
              letterSpacing: "0.4em",
              color: "var(--hell-red)",
              textTransform: "uppercase",
            }}
          >
            {subtitle}
          </div>
        </div>

        <Bracket position="tl" />
        <Bracket position="tr" />
        <Bracket position="bl" />
        <Bracket position="br" />
      </div>

      <button
        type="button"
        onClick={handleSkip}
        aria-label={skipLabel}
        className="font-mono"
        style={{
          position: "absolute",
          bottom: 18,
          right: 18,
          background: "rgba(10,10,10,0.7)",
          border: "1px solid rgba(245,240,232,0.25)",
          color: "var(--bone)",
          padding: "8px 14px",
          fontSize: 11,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        {skipLabel} ▸
      </button>
    </div>
  );
}

function Ring({ ref, color }: { ref: React.RefObject<HTMLDivElement | null>; color: string }) {
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 60,
        height: 60,
        border: `2px solid ${color}`,
        borderRadius: "50%",
        transform: "translate(-50%, -50%) scale(0)",
        opacity: 0,
        pointerEvents: "none",
        boxShadow: `0 0 30px ${color}`,
      }}
    />
  );
}

function Bracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const corner: Record<typeof position, React.CSSProperties> = {
    tl: { top: 12, left: 12, borderRight: "none", borderBottom: "none" },
    tr: { top: 12, right: 12, borderLeft: "none", borderBottom: "none" },
    bl: { bottom: 12, left: 12, borderRight: "none", borderTop: "none" },
    br: { bottom: 12, right: 12, borderLeft: "none", borderTop: "none" },
  };
  return (
    <div
      data-bracket={position}
      style={{
        position: "absolute",
        width: 28,
        height: 28,
        border: "1.5px solid var(--gold)",
        opacity: 0,
        ...corner[position],
      }}
    />
  );
}

// Iconic PUBG scope reticle: outer ring, inner ring, crosshairs, tick marks.
function ScopeReticle() {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden>
      <defs>
        <radialGradient id="twr-scope-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(255,217,61,0)" />
          <stop offset="80%" stopColor="rgba(255,217,61,0.05)" />
          <stop offset="100%" stopColor="rgba(255,217,61,0.18)" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill="url(#twr-scope-glow)" />
      <circle cx="100" cy="100" r="96" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeOpacity="0.85" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="var(--gold)" strokeWidth="0.6" strokeOpacity="0.55" strokeDasharray="2 4" />
      <circle cx="100" cy="100" r="50" fill="none" stroke="var(--gold)" strokeWidth="1" strokeOpacity="0.7" />
      {/* Crosshair lines */}
      <line x1="100" y1="2" x2="100" y2="40" stroke="var(--gold)" strokeWidth="1.4" strokeOpacity="0.85" />
      <line x1="100" y1="160" x2="100" y2="198" stroke="var(--gold)" strokeWidth="1.4" strokeOpacity="0.85" />
      <line x1="2" y1="100" x2="40" y2="100" stroke="var(--gold)" strokeWidth="1.4" strokeOpacity="0.85" />
      <line x1="160" y1="100" x2="198" y2="100" stroke="var(--gold)" strokeWidth="1.4" strokeOpacity="0.85" />
      {/* Tick marks */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="100"
          y1="4"
          x2="100"
          y2="14"
          stroke="var(--gold)"
          strokeWidth="1"
          strokeOpacity="0.7"
          transform={`rotate(${deg} 100 100)`}
        />
      ))}
      {/* Central dot */}
      <circle cx="100" cy="100" r="2" fill="var(--gold)" />
    </svg>
  );
}

// Crossed weapons (Kar98 + AKM-style silhouettes) — iconic PUBG decoration.
function CrossedWeaponsSVG() {
  return (
    <svg viewBox="0 0 400 200" width="100%" height="auto" aria-hidden>
      {/* Top-left to bottom-right rifle (Kar98) */}
      <g transform="rotate(-22 200 100)">
        <rect x="50" y="92" width="300" height="6" fill="var(--gold)" opacity="0.9" />
        <rect x="48" y="86" width="40" height="18" rx="2" fill="var(--gold)" opacity="0.95" />
        <rect x="320" y="88" width="34" height="14" rx="1" fill="var(--gold)" opacity="0.85" />
        <rect x="180" y="78" width="50" height="10" rx="1" fill="var(--gold)" opacity="0.85" />
        <rect x="186" y="68" width="38" height="12" rx="1" fill="var(--gold)" opacity="0.75" />
        <rect x="86" y="98" width="14" height="22" fill="var(--gold)" opacity="0.95" />
        <rect x="100" y="106" width="8" height="14" fill="var(--gold)" opacity="0.85" />
      </g>
      {/* Top-right to bottom-left rifle (AKM) */}
      <g transform="rotate(22 200 100)">
        <rect x="50" y="92" width="300" height="6" fill="var(--gold)" opacity="0.9" />
        <rect x="46" y="84" width="50" height="20" rx="2" fill="var(--gold)" opacity="0.95" />
        <rect x="316" y="86" width="38" height="14" rx="1" fill="var(--gold)" opacity="0.85" />
        <rect x="170" y="78" width="44" height="14" rx="1" fill="var(--gold)" opacity="0.85" />
        <rect x="100" y="98" width="14" height="22" fill="var(--gold)" opacity="0.95" />
        <rect x="114" y="106" width="8" height="14" fill="var(--gold)" opacity="0.85" />
        <rect x="60" y="88" width="20" height="6" fill="var(--gold)" opacity="0.7" />
      </g>
    </svg>
  );
}

// Stylized chicken silhouette — body, head, beak, comb, tail, leg.
function ChickenSVG() {
  return (
    <svg viewBox="0 0 110 90" width="100%" height="100%" aria-hidden>
      <g fill="currentColor">
        {/* Body */}
        <ellipse cx="55" cy="50" rx="32" ry="22" />
        {/* Tail feathers */}
        <path d="M22 42 L4 28 L10 44 L2 56 L16 52 L8 68 L24 60 Z" />
        {/* Head */}
        <circle cx="82" cy="34" r="12" />
        {/* Comb */}
        <path d="M76 22 L78 16 L82 22 L84 14 L88 22 L90 18 L92 24 Z" />
        {/* Beak */}
        <path d="M93 34 L102 32 L96 38 Z" />
        {/* Wattle */}
        <path d="M84 42 L84 50 L88 46 Z" />
        {/* Legs */}
        <rect x="48" y="70" width="3" height="14" />
        <rect x="60" y="70" width="3" height="14" />
        <path d="M44 84 L52 84 L48 88 Z" />
        <path d="M56 84 L64 84 L60 88 Z" />
      </g>
      {/* Eye */}
      <circle cx="84" cy="32" r="1.5" fill="#0a0402" />
    </svg>
  );
}
