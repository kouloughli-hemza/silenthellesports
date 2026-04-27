"use client";

// Scene 01 — Hero plane drop overlay.
//
// Mounts FULL-SCREEN over the page on first visit. C-130 sweeps L→R, paratrooper
// jumps + chute snap-deploy + sway, impact dust + sparks + embers + 3 shockwaves
// + 28px damped shake, logo punches in, tagline types out. ~7s. User can skip
// after 2s. Marks `sh:hero-seen` on complete OR skip — whichever fires first.
//
// Reference: prototype-hero-plane-drop.html. Timings ported directly.

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ParticleSystem } from "@/lib/animations/particles";
import { createTimeline, shakeStage } from "@/lib/animations/timeline";

interface HeroPlaneDropProps {
  scrollLabel: string;
  liveLabel: string;
  sectorLabel: string;
  contextLabel: string;
  skipLabel: string;
  onComplete: () => void;
}

export function HeroPlaneDrop({
  scrollLabel,
  liveLabel,
  sectorLabel,
  contextLabel,
  skipLabel,
  onComplete,
}: HeroPlaneDropProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const shakeRef = useRef<HTMLDivElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const planeTiltRef = useRef<HTMLDivElement | null>(null);
  const trooperRef = useRef<HTMLDivElement | null>(null);
  const chuteRef = useRef<SVGGElement | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);
  const screenFlashRef = useRef<HTMLDivElement | null>(null);
  const groundLineRef = useRef<HTMLDivElement | null>(null);
  const sw1Ref = useRef<HTMLDivElement | null>(null);
  const sw2Ref = useRef<HTMLDivElement | null>(null);
  const sw3Ref = useRef<HTMLDivElement | null>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const smokeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [skipVisible, setSkipVisible] = useState(false);

  // Stars: simple twinkle field. Lives the whole sequence then dies on cleanup.
  useEffect(() => {
    const canvas = starsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.6,
      size: Math.random() * 1.2 + 0.3,
      base: 0.2 + Math.random() * 0.5,
      tw: Math.random() * Math.PI * 2,
      tws: 0.01 + Math.random() * 0.03,
    }));
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.tw += s.tws;
        const a = s.base * (0.7 + 0.3 * Math.sin(s.tw));
        ctx.fillStyle = `rgba(245,240,232,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Particle systems for impact FX + smoke trail.
  useEffect(() => {
    const fx = fxCanvasRef.current;
    const smoke = smokeCanvasRef.current;
    const stage = stageRef.current;
    const trooper = trooperRef.current;
    if (!fx || !smoke || !stage || !trooper) return;

    // Explicitly size canvases to viewport so ParticleSystem's resize() picks
    // up the correct dimensions (CSS inset:0 alone can hand back 300x150 if
    // layout hasn't settled when the constructor runs).
    const sizeCanvas = (c: HTMLCanvasElement) => {
      c.style.width = `${window.innerWidth}px`;
      c.style.height = `${window.innerHeight}px`;
    };
    sizeCanvas(fx);
    sizeCanvas(smoke);

    const fxSys = new ParticleSystem(fx, { maxParticles: 600 });
    const smokeSys = new ParticleSystem(smoke, { maxParticles: 200 });
    fxSys.start();
    smokeSys.start();

    // Continuous ember rise from along the bottom edge of the viewport.
    let emberRaf = 0;
    const emberTick = () => {
      const r = fxSys.bounds();
      if (r.width > 100 && Math.random() < 0.5) {
        fxSys.spawn("ember", { x: Math.random() * r.width, y: r.height - 4, count: 1 });
      }
      emberRaf = requestAnimationFrame(emberTick);
    };
    emberTick();

    // Trooper smoke trail — handle is started by the timeline
    let smokeTrailActive = false;
    let smokeRaf = 0;
    const smokeTick = () => {
      if (smokeTrailActive) {
        const sRect = stage.getBoundingClientRect();
        const tRect = trooper.getBoundingClientRect();
        const x = tRect.left - sRect.left + tRect.width / 2;
        const y = tRect.top - sRect.top + tRect.height * 0.85;
        smokeSys.spawn("smoke", { x, y, count: 2 });
      }
      smokeRaf = requestAnimationFrame(smokeTick);
    };
    smokeTick();

    // Expose to timeline via shared mutable refs on the stage element
    (stage as unknown as { __startSmoke: () => void }).__startSmoke = () => {
      smokeTrailActive = true;
    };
    (stage as unknown as { __stopSmoke: () => void }).__stopSmoke = () => {
      smokeTrailActive = false;
    };
    (stage as unknown as { __spawnImpact: () => void }).__spawnImpact = () => {
      const r = fxSys.bounds();
      const cx = r.width / 2;
      const cy = r.height * 0.86;
      fxSys.spawn("dust", { x: cx, y: cy, count: 120 });
      fxSys.spawn("spark", { x: cx, y: cy, count: 60, direction: -Math.PI / 2, spread: Math.PI });
      fxSys.spawn("ember", { x: cx, y: cy, count: 40, sizeMin: 1, sizeMax: 2.8 });
    };

    return () => {
      cancelAnimationFrame(emberRaf);
      cancelAnimationFrame(smokeRaf);
      fxSys.destroy();
      smokeSys.destroy();
    };
  }, []);

  // Cloud parallax — pure CSS animations would be simpler, but we use GSAP for
  // the same time-base everything else uses.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const w = stage.getBoundingClientRect().width;
    const clouds = stage.querySelectorAll<HTMLElement>("[data-cloud]");
    const cfg = [
      { dur: 60, delay: 0 },
      { dur: 80, delay: -20 },
      { dur: 45, delay: -10 },
      { dur: 50, delay: -30 },
      { dur: 30, delay: -5 },
      { dur: 35, delay: -15 },
    ];
    const tweens: gsap.core.Tween[] = [];
    clouds.forEach((el, i) => {
      const c = cfg[i] ?? { dur: 50, delay: 0 };
      tweens.push(gsap.fromTo(el, { x: -400 }, { x: w + 400, duration: c.dur, ease: "none", repeat: -1, delay: c.delay }));
    });
    return () => tweens.forEach((t) => t.kill());
  }, []);

  // Main GSAP timeline.
  useEffect(() => {
    const stage = stageRef.current;
    const shakeEl = shakeRef.current;
    if (!stage || !shakeEl) return;

    const stageRect = stage.getBoundingClientRect();

    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current();
    };

    gsap.set(planeRef.current, { x: -240, y: 0 });
    gsap.set(planeTiltRef.current, { rotation: 2 });
    gsap.set(trooperRef.current, { x: 0, y: 0, opacity: 0, scale: 0.7, rotation: 0 });
    gsap.set(chuteRef.current, { scaleY: 0, scaleX: 1, transformOrigin: "50% 100%" });
    gsap.set(flashRef.current, { scale: 0, opacity: 0 });
    gsap.set(screenFlashRef.current, { opacity: 0 });
    gsap.set([sw1Ref.current, sw2Ref.current, sw3Ref.current], { scale: 0, opacity: 0 });
    gsap.set(groundLineRef.current, { scaleX: 0, opacity: 0 });
    gsap.set("[data-bracket]", { opacity: 0, scale: 0.5 });
    gsap.set("[data-hud]", { opacity: 0 });

    const tl = createTimeline({
      onComplete: () => {
        finish();
      },
    });
    tlRef.current = tl;

    const startSmoke = () => (stage as unknown as { __startSmoke?: () => void }).__startSmoke?.();
    const stopSmoke = () => (stage as unknown as { __stopSmoke?: () => void }).__stopSmoke?.();
    const spawnImpact = () => (stage as unknown as { __spawnImpact?: () => void }).__spawnImpact?.();

    // Plane sweep
    tl.to(planeRef.current, { x: stageRect.width + 240, duration: 5.5, ease: "none" }, 0);
    tl.to(planeTiltRef.current, { rotation: -2, duration: 5.5, ease: "sine.inOut" }, 0);

    // Trooper jump + chute deploy
    tl.to(trooperRef.current, { opacity: 1, scale: 0.9, duration: 0.2, ease: "power2.out" }, 1.6);
    tl.to(trooperRef.current, { y: 60, rotation: 25, duration: 0.6, ease: "power2.in" }, 1.6);
    tl.to(chuteRef.current, { scaleY: 1.15, duration: 0.25, ease: "back.out(2.5)" }, 2.2);
    tl.to(chuteRef.current, { scaleY: 1, duration: 0.15, ease: "power1.out" }, 2.45);
    tl.to(trooperRef.current, { y: 40, rotation: 0, scale: 1, duration: 0.3, ease: "power2.out" }, 2.2);
    tl.to(chuteRef.current, { rotation: 4, duration: 0.6, ease: "sine.inOut", repeat: 5, yoyo: true, transformOrigin: "50% 100%" }, 2.5);

    // Trooper descent — move within the visible stage
    tl.to(trooperRef.current, { y: stageRect.height * 0.55, x: 30, duration: 3.0, ease: "power1.in" }, 2.5);

    // Smoke trail
    tl.call(() => startSmoke(), undefined, 2.3);
    tl.call(() => stopSmoke(), undefined, 5.4);

    // HUD chrome
    tl.to("[data-bracket]", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.05 }, 3.0);
    tl.to("[data-hud]", { opacity: 0.7, duration: 0.5, ease: "power2.out", stagger: 0.1 }, 3.2);

    // Impact at t=5.5
    const impact = 5.5;
    tl.to(trooperRef.current, { opacity: 0, duration: 0.05 }, impact);
    tl.call(() => spawnImpact(), undefined, impact);
    tl.to(screenFlashRef.current, { opacity: 0.7, duration: 0.08, ease: "power2.out" }, impact);
    tl.to(screenFlashRef.current, { opacity: 0, duration: 0.4, ease: "power2.in" }, impact + 0.08);
    tl.to(flashRef.current, { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" }, impact);
    tl.to(flashRef.current, { opacity: 0, duration: 0.7, ease: "power2.in" }, impact + 0.2);
    tl.to(sw1Ref.current, { scale: 6, opacity: 0.9, duration: 0.5, ease: "power2.out" }, impact);
    tl.to(sw1Ref.current, { opacity: 0, duration: 0.4, ease: "power2.in" }, impact + 0.3);
    tl.to(sw2Ref.current, { scale: 9, opacity: 0.7, duration: 0.7, ease: "power2.out" }, impact + 0.1);
    tl.to(sw2Ref.current, { opacity: 0, duration: 0.5, ease: "power2.in" }, impact + 0.4);
    tl.to(sw3Ref.current, { scale: 12, opacity: 0.4, duration: 0.9, ease: "power2.out" }, impact + 0.2);
    tl.to(sw3Ref.current, { opacity: 0, duration: 0.5, ease: "power2.in" }, impact + 0.6);
    tl.to(groundLineRef.current, { scaleX: 1, opacity: 1, duration: 0.4, ease: "power3.out" }, impact);
    tl.to(groundLineRef.current, { opacity: 0.3, duration: 0.5 }, impact + 0.5);
    tl.add(shakeStage(shakeEl, 28, 0.7), impact);

    // No giant centered logo — the actual hero (already on the page) carries
    // the brand mark. The cinematic just punches the impact, holds briefly,
    // then dissolves so the user lands directly on the header.
    const dissolveT = impact + 1.0;
    tl.add(shakeStage(shakeEl, 8, 0.35), dissolveT - 0.6);
    tl.to(stage, { opacity: 0, duration: 0.55, ease: "power2.in" }, dissolveT);

    // Skip button visibility timer
    const skipTimer = setTimeout(() => setSkipVisible(true), 1500);

    return () => {
      clearTimeout(skipTimer);
      tl.kill();
      tlRef.current = null;
    };
  }, []);

  function handleSkip() {
    tlRef.current?.progress(1).kill();
    completedRef.current = true;
    onCompleteRef.current();
  }

  // Esc to skip — keyboard accessible
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
      aria-label="Silent Hell — intro animation"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        background: "#000",
        overflow: "hidden",
        perspective: "800px",
      }}
    >
      <div ref={shakeRef} style={{ position: "absolute", inset: 0, willChange: "transform" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, #2a0a14 0%, #14050a 35%, #050203 70%, #000 100%)" }} />
        <canvas ref={starsCanvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 80%, rgba(230,0,19,0.08) 0%, transparent 60%)" }} />

        {/* parallax clouds */}
        <Cloud kind="back" top="18%" />
        <Cloud kind="back" top="35%" />
        <Cloud kind="mid" top="22%" />
        <Cloud kind="mid" top="45%" />
        <Cloud kind="near" top="30%" />
        <Cloud kind="near" top="55%" />

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: "linear-gradient(to top, rgba(230,0,19,0.18) 0%, rgba(230,0,19,0.08) 30%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "18%", background: "linear-gradient(to top, rgba(255,69,0,0.25) 0%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "12%", left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(230,0,19,0.4) 50%, transparent 100%)" }} />

        <canvas ref={smokeCanvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

        <div ref={planeRef} style={{ position: "absolute", top: "26%", left: -240, willChange: "transform" }}>
          <div ref={planeTiltRef} style={{ transformOrigin: "center", willChange: "transform" }}>
            <PlaneSVG />
          </div>
        </div>

        <div ref={trooperRef} style={{ position: "absolute", left: "38%", top: "28%", opacity: 0, willChange: "transform, opacity", transformOrigin: "center top" }}>
          <TrooperSVG chuteRef={chuteRef} />
        </div>

        <canvas ref={fxCanvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

        <div ref={groundLineRef} style={{ position: "absolute", bottom: "14%", left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, var(--hell-red) 50%, transparent 100%)", opacity: 0, transform: "scaleX(0)", transformOrigin: "center" }} />
        <div ref={flashRef} style={{ position: "absolute", left: "50%", bottom: "14%", width: 600, height: 600, transform: "translate(-50%, 50%) scale(0)", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,217,61,0.5) 0%, rgba(255,69,0,0.4) 25%, rgba(230,0,19,0.2) 50%, transparent 70%)", opacity: 0, pointerEvents: "none", mixBlendMode: "screen" }} />
        <Shockwave ref={sw1Ref} color="var(--ember)" />
        <Shockwave ref={sw2Ref} color="var(--hell-red)" />
        <Shockwave ref={sw3Ref} color="var(--ember)" />
        <div ref={screenFlashRef} style={{ position: "absolute", inset: 0, background: "var(--hell-red)", opacity: 0, pointerEvents: "none", mixBlendMode: "screen" }} />

        <Bracket position="tl" />
        <Bracket position="tr" />
        <Bracket position="bl" />
        <Bracket position="br" />

        <div data-hud className="font-mono" style={{ position: "absolute", top: 14, left: 16, fontSize: 9, letterSpacing: "0.3em", color: "var(--bone)", opacity: 0 }}>{sectorLabel}</div>
        <div data-hud className="font-mono" style={{ position: "absolute", top: 14, right: 16, fontSize: 9, letterSpacing: "0.3em", color: "var(--hell-red)", opacity: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <span className="live-dot" /> {liveLabel}
        </div>
        <div data-hud className="font-mono" style={{ position: "absolute", bottom: 14, left: 16, fontSize: 9, letterSpacing: "0.3em", color: "var(--bone)", opacity: 0 }}>{contextLabel}</div>

        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.7) 100%)" }} />
      </div>

      {/* Scroll cue */}
      <div className="font-mono" style={{ position: "absolute", bottom: 18, left: 0, right: 0, textAlign: "center", fontSize: 9, letterSpacing: "0.3em", color: "rgba(245,240,232,0.4)", textTransform: "uppercase", pointerEvents: "none" }}>
        {scrollLabel}
      </div>

      {/* Skip button — fades in after 2s */}
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
          opacity: skipVisible ? 1 : 0,
          transition: "opacity 300ms ease",
          pointerEvents: skipVisible ? "auto" : "none",
        }}
      >
        {skipLabel} ▸
      </button>

      <style jsx>{`
        @keyframes ht-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}

function Cloud({ kind, top }: { kind: "back" | "mid" | "near"; top: string }) {
  const cfg = {
    back: { width: 200, height: 50, opacity: 0.35, color: "rgba(60,30,40,0.6)" },
    mid: { width: 280, height: 60, opacity: 0.4, color: "rgba(80,40,50,0.7)" },
    near: { width: 360, height: 80, opacity: 0.3, color: "rgba(100,50,60,0.5)" },
  }[kind];
  return (
    <div
      data-cloud
      style={{
        position: "absolute",
        top,
        width: cfg.width,
        height: cfg.height,
        opacity: cfg.opacity,
        background: `radial-gradient(ellipse at center, ${cfg.color} 0%, transparent 70%)`,
        willChange: "transform",
      }}
    />
  );
}

function Shockwave({ ref, color }: { ref: React.RefObject<HTMLDivElement | null>; color: string }) {
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: "50%",
        bottom: "14%",
        width: 80,
        height: 12,
        border: `2px solid ${color}`,
        borderRadius: "50%",
        transform: "translate(-50%, 50%) scale(0)",
        opacity: 0,
        pointerEvents: "none",
      }}
    />
  );
}

function Bracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const corner: Record<typeof position, React.CSSProperties> = {
    tl: { top: 8, left: 8, borderRight: "none", borderBottom: "none" },
    tr: { top: 8, right: 8, borderLeft: "none", borderBottom: "none" },
    bl: { bottom: 8, left: 8, borderRight: "none", borderTop: "none" },
    br: { bottom: 8, right: 8, borderLeft: "none", borderTop: "none" },
  };
  return (
    <div
      data-bracket={position}
      style={{
        position: "absolute",
        width: 22,
        height: 22,
        border: "1.5px solid var(--hell-red)",
        opacity: 0,
        ...corner[position],
      }}
    />
  );
}

function PlaneSVG() {
  // C-130 Hercules silhouette — long fuselage, T-tail, 4 turboprop engines on a
  // straight high wing, open rear cargo ramp. Nose right, tail left (matches
  // the L→R sweep). Light grey livery to match the actual PUBG cargo plane,
  // with weathering streaks + faint orange exhaust glow.
  return (
    <svg width="280" height="100" viewBox="0 0 280 100" aria-hidden>
      <defs>
        <linearGradient id="hpd-fuselage" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#aab0a8" />
          <stop offset="55%" stopColor="#7c8278" />
          <stop offset="100%" stopColor="#4a4e48" />
        </linearGradient>
        <linearGradient id="hpd-wing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a8f86" />
          <stop offset="100%" stopColor="#454944" />
        </linearGradient>
        <radialGradient id="hpd-prop" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="rgba(245,240,232,0.55)" />
          <stop offset="60%" stopColor="rgba(245,240,232,0.15)" />
          <stop offset="100%" stopColor="rgba(245,240,232,0)" />
        </radialGradient>
        <linearGradient id="hpd-exhaust" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,69,0,0.35)" />
          <stop offset="100%" stopColor="rgba(255,69,0,0)" />
        </linearGradient>
      </defs>

      {/* Fuselage — long tube, slight droop toward tail */}
      <path
        d="M30 50
           L42 38
           L240 38
           Q260 38 268 46
           Q272 52 268 58
           L262 62
           Q252 66 240 66
           L52 66
           L34 62
           Q26 56 30 50 Z"
        fill="url(#hpd-fuselage)"
        stroke="#0a0b05"
        strokeWidth="0.6"
      />

      {/* Belly highlight */}
      <ellipse cx="148" cy="64" rx="100" ry="2.2" fill="rgba(245,240,232,0.05)" />

      {/* Cockpit windows (right side / nose) — multiple panes */}
      <path d="M250 46 Q260 46 264 50 L262 54 L252 56 Z" fill="#1a1d1f" />
      <path d="M252 48 L255 48 L255 51 L252 51 Z" fill="rgba(255,217,61,0.55)" />
      <path d="M256 48 L260 49 L260 51 L256 51 Z" fill="rgba(255,217,61,0.45)" />
      <path d="M252 52 L260 52 L260 54 L253 53.5 Z" fill="rgba(255,217,61,0.25)" />

      {/* Side passenger windows — small dark dots along the fuselage */}
      {[60, 76, 92, 108, 124, 140, 156, 172, 188, 204, 220, 236].map((x) => (
        <rect key={x} x={x} y="48" width="2.4" height="2" fill="#1a1d1f" />
      ))}

      {/* Open rear cargo ramp — wedge cut at the tail showing dark interior */}
      <path d="M30 66 L52 66 L46 80 L34 76 Z" fill="#1a1c1c" />
      <path d="M34 70 L48 74" stroke="#FF4500" strokeWidth="0.4" opacity="0.45" />

      {/* Wing — straight high wing, drawn ABOVE the fuselage so it reads as a
          high-wing transport in side view */}
      <rect x="62" y="28" width="174" height="5" fill="url(#hpd-wing)" stroke="#2a2c2a" strokeWidth="0.4" />
      <line x1="62" y1="28" x2="236" y2="28" stroke="rgba(245,240,232,0.25)" strokeWidth="0.5" />

      {/* 4 engine nacelles hanging UNDER the wing, visibly extending below
          the fuselage so they read clearly */}
      {[88, 124, 168, 204].map((x) => (
        <g key={x}>
          {/* pylon connecting wing to engine */}
          <rect x={x - 1} y="33" width="2" height="6" fill="#3a3d38" />
          {/* nacelle — long cigar shape */}
          <ellipse cx={x} cy="44" rx="9" ry="5.5" fill="#6a6e68" stroke="#2a2c2a" strokeWidth="0.4" />
          <ellipse cx={x} cy="44" rx="9" ry="2" fill="rgba(245,240,232,0.18)" />
          {/* exhaust strip on nacelle bottom */}
          <line x1={x + 4} y1="48" x2={x + 8} y2="48" stroke="#1a1c1c" strokeWidth="0.6" />
          {/* propeller motion-blur disk in front of the nacelle */}
          <ellipse cx={x - 9} cy="44" rx="2.8" ry="10" fill="url(#hpd-prop)" />
          <ellipse cx={x - 9} cy="44" rx="0.9" ry="10" fill="rgba(245,240,232,0.32)" />
          {/* spinner cone */}
          <ellipse cx={x - 9} cy="44" rx="1.4" ry="1.6" fill="#2a2c2a" />
        </g>
      ))}

      {/* Vertical tail — large, sweeps back-up from the rear */}
      <path d="M34 50 L10 14 L26 16 L40 50 Z" fill="#5a5e58" stroke="#2a2c2a" strokeWidth="0.5" />
      <line x1="14" y1="20" x2="36" y2="48" stroke="rgba(245,240,232,0.12)" strokeWidth="0.4" />

      {/* T-tail horizontal stabilizer at top of the vertical fin */}
      <rect x="0" y="11" width="36" height="3.5" fill="#6a6e68" stroke="#2a2c2a" strokeWidth="0.3" />
      <rect x="0" y="11" width="36" height="0.8" fill="rgba(245,240,232,0.18)" />

      {/* Engine exhaust glow trailing left */}
      <ellipse cx="14" cy="52" rx="18" ry="2.4" fill="url(#hpd-exhaust)" />

      {/* Wingtip nav lights */}
      <circle cx="232" cy="37" r="1.3" fill="#E60013" />
      <circle cx="232" cy="37" r="3" fill="rgba(230,0,19,0.35)" />
      <circle cx="78" cy="37" r="1.1" fill="#33ff66" opacity="0.85" />

      {/* Faint registration stencil */}
      <text x="118" y="60" fontSize="4" fill="rgba(40,42,40,0.85)" fontFamily="monospace" letterSpacing="1.4">SH-130</text>

      {/* Subtle weathering — darker streaks along the belly */}
      <line x1="60" y1="63" x2="240" y2="63" stroke="rgba(20,20,20,0.4)" strokeWidth="0.4" />
      <line x1="80" y1="65" x2="220" y2="65" stroke="rgba(20,20,20,0.25)" strokeWidth="0.3" />
    </svg>
  );
}

function TrooperSVG({ chuteRef }: { chuteRef: React.RefObject<SVGGElement | null> }) {
  // PUBG default-style parachute: dark domed canopy with vertical fabric
  // segments + heavy shroud-line bundle to a paratrooper with helmet, plate
  // carrier, backpack and slung rifle. chuteRef wraps the dome so it scales
  // open + sways without moving the trooper body.
  return (
    <svg width="80" height="118" viewBox="0 0 80 118" aria-hidden>
      <defs>
        <linearGradient id="hpd-canopy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3d3a" />
          <stop offset="55%" stopColor="#22241f" />
          <stop offset="100%" stopColor="#0c0d0a" />
        </linearGradient>
        <linearGradient id="hpd-canopy-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </linearGradient>
      </defs>

      {/* Domed canopy — full curved arch with vertical fabric segments */}
      <g ref={chuteRef} style={{ transformOrigin: "50% 100%" }}>
        {/* Outer dome silhouette */}
        <path d="M2 38 Q40 -4 78 38 Q72 38 70 38 Q40 30 10 38 Q8 38 2 38 Z" fill="url(#hpd-canopy)" stroke="#0c0d0a" strokeWidth="0.5" />
        {/* Vertical segment seams converge at apex */}
        {[
          "M40 -2 Q40 18 40 38",
          "M40 -2 Q26 16 12 36",
          "M40 -2 Q14 12 4 36",
          "M40 -2 Q54 16 68 36",
          "M40 -2 Q66 12 76 36",
          "M40 -2 Q34 16 22 36",
          "M40 -2 Q46 16 58 36",
        ].map((d) => (
          <path key={d} d={d} stroke="rgba(245,240,232,0.18)" strokeWidth="0.45" fill="none" />
        ))}
        {/* Underside shading */}
        <path d="M4 32 Q40 26 76 32 Q72 38 70 38 Q40 30 10 38 Q8 38 4 32 Z" fill="url(#hpd-canopy-shade)" />
        {/* Top accent stripe */}
        <path d="M6 38 Q40 -2 74 38" stroke="rgba(245,240,232,0.22)" strokeWidth="0.5" fill="none" />
        {/* Apex highlight */}
        <ellipse cx="40" cy="6" rx="3" ry="1.4" fill="rgba(245,240,232,0.3)" />
      </g>

      {/* Shroud lines — converge from canopy down to risers */}
      <line x1="6" y1="36" x2="36" y2="62" stroke="#1a1a1a" strokeWidth="0.55" />
      <line x1="18" y1="36" x2="38" y2="62" stroke="#1a1a1a" strokeWidth="0.55" />
      <line x1="30" y1="36" x2="39" y2="62" stroke="#1a1a1a" strokeWidth="0.55" />
      <line x1="40" y1="36" x2="40" y2="62" stroke="#1a1a1a" strokeWidth="0.55" />
      <line x1="50" y1="36" x2="41" y2="62" stroke="#1a1a1a" strokeWidth="0.55" />
      <line x1="62" y1="36" x2="42" y2="62" stroke="#1a1a1a" strokeWidth="0.55" />
      <line x1="74" y1="36" x2="44" y2="62" stroke="#1a1a1a" strokeWidth="0.55" />

      {/* Heavy risers between shroud convergence and harness */}
      <line x1="36" y1="60" x2="38" y2="68" stroke="#0a0a0a" strokeWidth="1.6" />
      <line x1="44" y1="60" x2="42" y2="68" stroke="#0a0a0a" strokeWidth="1.6" />

      {/* Helmet (round, with chinstrap suggestion) */}
      <ellipse cx="40" cy="72" rx="6.2" ry="5.6" fill="#1a1d12" stroke="#0a0b05" strokeWidth="0.4" />
      <path d="M34 71 Q40 65 46 71" stroke="rgba(245,240,232,0.08)" strokeWidth="0.6" fill="none" />
      <path d="M34 76 L37 80 L43 80 L46 76" stroke="#0a0b05" strokeWidth="0.7" fill="none" />
      {/* night-vision mount stub */}
      <rect x="38.5" y="70.5" width="3" height="1.6" fill="#0a0b05" />

      {/* Tactical vest / torso — blocky armored shape */}
      <path d="M31 78 L49 78 L51 96 L46 100 L34 100 L29 96 Z" fill="#0a0a0a" stroke="#1a1c12" strokeWidth="0.3" />
      {/* vest plates */}
      <rect x="33" y="83" width="14" height="1.4" fill="#1a1c12" />
      <rect x="34" y="86" width="5.5" height="6" fill="#1a1c12" stroke="#5a2a14" strokeWidth="0.3" />
      <rect x="40.5" y="86" width="5.5" height="6" fill="#1a1c12" stroke="#5a2a14" strokeWidth="0.3" />
      {/* backpack outline (subtle, behind torso) */}
      <rect x="34" y="80" width="12" height="14" fill="#1a1c12" opacity="0.25" />
      {/* unit patch */}
      <rect x="38" y="93" width="4" height="2.5" fill="#E60013" />

      {/* Legs — slight tuck (paratrooper drop pose) */}
      <line x1="36" y1="100" x2="33" y2="108" stroke="#0a0a0a" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="44" y1="100" x2="47" y2="108" stroke="#0a0a0a" strokeWidth="2.6" strokeLinecap="round" />

      {/* Slung rifle across the back */}
      <line x1="32" y1="82" x2="22" y2="100" stroke="#2a1208" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="22" y1="100" x2="20" y2="103" stroke="#2a1208" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="29" y1="86" x2="25" y2="94" stroke="#5a2a14" strokeWidth="0.5" />
    </svg>
  );
}
