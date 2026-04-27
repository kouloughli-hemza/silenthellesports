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
import Image from "next/image";
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

    // Drop the crate when the plane's center reaches viewport center, so it
    // visually falls FROM the plane mid-screen. dropTime is computed from the
    // plane sweep math (CSS-left:-240, transform from -240 to width+240,
    // linear ease over planeSweepDur). All downstream tweens (catch, descent,
    // smoke, impact, dissolve) hang off dropTime.
    const planeSweepDur = 5.5;
    const planeWidth = 180;
    const dropFraction =
      (stageRect.width / 2 - planeWidth / 2 + 480) / (stageRect.width + 480);
    const dropTime = dropFraction * planeSweepDur;
    const planeXAtDrop = -240 + (stageRect.width + 480) * dropFraction;
    const planeRearViewportPx = -240 + planeXAtDrop + 30;
    const crateBaseLeftPx = stageRect.width * 0.38;
    const crateInitialX = planeRearViewportPx - crateBaseLeftPx;
    // Land near viewport center (where impact effects fire)
    const crateLandingX = stageRect.width * 0.5 - crateBaseLeftPx - 36;

    gsap.set(planeRef.current, { x: -240, y: 0 });
    gsap.set(planeTiltRef.current, { rotation: 2 });
    gsap.set(trooperRef.current, { x: crateInitialX, y: 0, opacity: 0, scale: 0.7, rotation: 0 });
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

    // Airdrop crate (chute baked into the PNG) — appears when the plane is
    // mid-screen, free-falls briefly, then "chute catches" with a small jerk
    // and starts the gentle descent + sway. Velocity change sells the
    // deploy moment.
    tl.to(trooperRef.current, { opacity: 1, scale: 0.85, duration: 0.2, ease: "power2.out" }, dropTime);
    tl.to(trooperRef.current, { y: 110, rotation: 6, duration: 0.6, ease: "power2.in" }, dropTime);
    // Catch jerk — velocity drops, crate jolts upward and squares up
    tl.to(trooperRef.current, { y: 100, rotation: 0, scale: 1, duration: 0.2, ease: "back.out(1.4)" }, dropTime + 0.6);
    // Gentle sway during descent
    tl.to(trooperRef.current, { rotation: 3, duration: 0.6, ease: "sine.inOut", repeat: 5, yoyo: true, transformOrigin: "50% 0%" }, dropTime + 0.9);

    // Crate descent under the canopy — drifts horizontally to the landing
    // center while gravity pulls it down
    tl.to(trooperRef.current, { y: stageRect.height * 0.55, x: crateLandingX, duration: 2.3, ease: "power1.in" }, dropTime + 0.8);

    // Impact lands ~3.1s after the crate first appears
    const impact = dropTime + 3.1;

    // Smoke trail
    tl.call(() => startSmoke(), undefined, dropTime + 0.7);
    tl.call(() => stopSmoke(), undefined, impact - 0.1);

    // HUD chrome — appears just before the drop so the scope-onto-target read
    // is established by the time the crate exits the plane
    tl.to("[data-bracket]", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.05 }, Math.max(0.5, dropTime - 0.6));
    tl.to("[data-hud]", { opacity: 0.7, duration: 0.5, ease: "power2.out", stagger: 0.1 }, Math.max(0.7, dropTime - 0.4));
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
            <Image
              src="/cinematic/c130.png"
              alt=""
              width={180}
              height={100}
              priority
              style={{ display: "block" }}
            />
          </div>
        </div>

        <div ref={trooperRef} style={{ position: "absolute", left: "38%", top: "28%", opacity: 0, willChange: "transform, opacity", transformOrigin: "center top" }}>
          <Image
            src="/cinematic/airdrop-crate.png"
            alt=""
            width={72}
            height={100}
            priority
            style={{ display: "block" }}
          />
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

