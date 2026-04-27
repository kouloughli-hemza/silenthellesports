"use client";

import { useEffect, useRef, useState } from "react";
import { ParticleCanvas, type ParticleCanvasHandle } from "@/components/animations/ParticleCanvas";
import { ShakeWrapper } from "@/components/animations/ShakeWrapper";
import { HUDChrome } from "@/components/animations/HUDChrome";
import { createTimeline, shakeStage, splitChars, typeText } from "@/lib/animations/timeline";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useFirstVisit } from "@/lib/hooks/useFirstVisit";
import type { ParticleKind } from "@/lib/animations/particles";

const KINDS: ParticleKind[] = ["ember", "smoke", "dust", "spark", "burst"];

export function DebugLab() {
  const reduced = useReducedMotion();
  const visit = useFirstVisit("sh:debug-lab-seen");

  return (
    <div className="mt-6 space-y-6">
      <Section title={`REDUCED MOTION: ${reduced ? "ON" : "OFF"}`}>
        <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.7)" }}>
          Toggle macOS → System Settings → Accessibility → Display → Reduce motion. Reload this page.
          When ON, all canvases below should stay blank and shake / typing should resolve instantly.
        </p>
      </Section>

      <Section title={`useFirstVisit · resolved=${visit.resolved} · firstVisit=${visit.firstVisit}`}>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" style={{ padding: "8px 14px", fontSize: 11 }} onClick={visit.markSeen}>
            MARK SEEN
          </button>
          <button type="button" className="btn-hell" style={{ padding: "8px 14px", fontSize: 11 }} onClick={visit.resetForTesting}>
            RESET
          </button>
        </div>
      </Section>

      {KINDS.map((kind) => (
        <ParticleDemo key={kind} kind={kind} />
      ))}

      <ShakeDemo />
      <TypeDemo />
      <SplitCharsDemo />

      <Section title="HUD CHROME (static, brackets fade in via scene)">
        <div className="relative" style={{ height: 160, background: "var(--ash-3)", border: "1px solid var(--ash-2)" }}>
          <HUDChrome />
        </div>
      </Section>
    </div>
  );
}

function ParticleDemo({ kind }: { kind: ParticleKind }) {
  const handleRef = useRef<ParticleCanvasHandle>(null);
  const [emitting, setEmitting] = useState(false);
  const emitRef = useRef<{ stop: () => void } | null>(null);

  function fireBurst() {
    const sys = handleRef.current?.system;
    if (!sys) return;
    const r = sys.bounds();
    const counts: Record<ParticleKind, number> = { ember: 30, smoke: 12, dust: 80, spark: 60, burst: 150 };
    sys.spawn(kind, { x: r.width / 2, y: r.height / 2, count: counts[kind] });
  }

  function toggleEmit() {
    const sys = handleRef.current?.system;
    if (!sys) return;
    if (emitRef.current) {
      emitRef.current.stop();
      emitRef.current = null;
      setEmitting(false);
      return;
    }
    const r = sys.bounds();
    const rates: Record<ParticleKind, number> = { ember: 30, smoke: 18, dust: 8, spark: 12, burst: 14 };
    emitRef.current = sys.emit(kind, rates[kind], { x: r.width / 2, y: r.height * (kind === "ember" ? 1 : 0.5) });
    setEmitting(true);
  }

  return (
    <Section title={`PARTICLE: ${kind.toUpperCase()}`}>
      <div className="flex gap-2 mb-3">
        <button type="button" className="btn-hell" style={{ padding: "8px 14px", fontSize: 11 }} onClick={fireBurst}>
          FIRE BURST
        </button>
        <button type="button" className="btn-ghost" style={{ padding: "8px 14px", fontSize: 11 }} onClick={toggleEmit}>
          {emitting ? "STOP EMIT" : "START EMIT"}
        </button>
      </div>
      <div className="relative" style={{ height: 220, background: "var(--ash-3)", border: "1px solid var(--ash-2)" }}>
        <ParticleCanvas ref={handleRef} />
      </div>
    </Section>
  );
}

function ShakeDemo() {
  const ref = useRef<HTMLDivElement | null>(null);
  function fire(intensity: number) {
    if (!ref.current) return;
    shakeStage(ref.current, intensity, 0.7);
  }
  return (
    <Section title="SHAKE STAGE">
      <div className="flex gap-2 mb-3">
        {[8, 14, 28].map((i) => (
          <button key={i} type="button" className="btn-hell" style={{ padding: "8px 14px", fontSize: 11 }} onClick={() => fire(i)}>
            SHAKE {i}px
          </button>
        ))}
      </div>
      <ShakeWrapper ref={ref}>
        <div className="p-6 font-mono text-xs" style={{ background: "var(--ash-1)", border: "1px solid var(--ash-2)" }}>
          The square shakes when buttons are clicked. Reduced-motion: should not shake.
        </div>
      </ShakeWrapper>
    </Section>
  );
}

function TypeDemo() {
  const ref = useRef<HTMLDivElement | null>(null);
  function fire() {
    if (!ref.current) return;
    typeText(ref.current, "The last sound you don't hear.", 45);
  }
  return (
    <Section title="TYPE TEXT">
      <button type="button" className="btn-hell mb-3" style={{ padding: "8px 14px", fontSize: 11 }} onClick={fire}>
        TYPE
      </button>
      <div ref={ref} className="font-mono text-sm" style={{ color: "var(--bone)", minHeight: 24 }} />
    </Section>
  );
}

function SplitCharsDemo() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [count, setCount] = useState(0);

  function fire() {
    const el = ref.current;
    if (!el) return;
    el.dataset.split = "";
    el.textContent = "WINNER WINNER";
    const spans = splitChars(el);
    setCount(spans.length);
    spans.forEach((s) => {
      s.style.opacity = "0";
      s.style.transform = "translateY(40px)";
    });
    const tl = createTimeline();
    tl.to(spans, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.8)", stagger: 0.025 });
  }

  useEffect(() => {
    if (!ref.current) return;
    ref.current.textContent = "WINNER WINNER";
  }, []);

  return (
    <Section title={`SPLIT CHARS · ${count} spans`}>
      <button type="button" className="btn-hell mb-3" style={{ padding: "8px 14px", fontSize: 11 }} onClick={fire}>
        SPLIT + ANIMATE
      </button>
      <div
        ref={ref}
        className="font-display italic font-black"
        style={{ color: "var(--gold, #FFD93D)", fontSize: 36 }}
      />
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="notch p-5" style={{ background: "var(--ash-1)" }}>
      <div className="mb-4 font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--hell-red)" }}>
        {`// ${title}`}
      </div>
      {children}
    </section>
  );
}
