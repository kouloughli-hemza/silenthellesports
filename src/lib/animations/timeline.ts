// GSAP timeline helpers with a baked-in reduced-motion guard.
//
// createTimeline() returns either a real GSAP timeline OR a no-op shim that
// fires onComplete once. Every scene composes its sequence on the returned
// object — the same call site works in both modes.

import { gsap } from "gsap";

const REDUCED_MEDIA = "(prefers-reduced-motion: reduce)";

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MEDIA).matches;
}

// Reduced-motion no-op shim. Every method returns the shim itself, every call
// is silent. We cast it to gsap.core.Timeline at the boundary so callers get
// the full GSAP API surface without runtime branching — the shim just no-ops.
function makeReducedShim(opts?: gsap.TimelineVars): gsap.core.Timeline {
  let killed = false;
  const shim = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "kill") {
          return () => {
            killed = true;
            return shim;
          };
        }
        if (prop === "progress" || prop === "duration" || prop === "time" || prop === "totalDuration" || prop === "totalTime") {
          return (..._args: unknown[]) => 0;
        }
        if (prop === "isActive" || prop === "paused" || prop === "reversed") {
          return () => false;
        }
        // Every other method/getter returns the shim so chains compose.
        return (..._args: unknown[]) => shim;
      },
    },
  ) as gsap.core.Timeline;

  if (opts?.onComplete) {
    queueMicrotask(() => {
      if (killed) return;
      try {
        opts.onComplete?.apply(opts.callbackScope ?? null, opts.onCompleteParams ?? []);
      } catch (err) {
        console.warn("[anim] onComplete threw:", err);
      }
    });
  }
  return shim;
}

export function createTimeline(opts?: gsap.TimelineVars): gsap.core.Timeline {
  if (reducedMotion()) return makeReducedShim(opts);
  return gsap.timeline(opts);
}

// Damped multi-axis shake. Returns a timeline that can be added to a parent
// timeline at a specific position. In reduced-motion: returns a no-op shim.
export function shakeStage(el: HTMLElement, intensity: number, durationSec: number): gsap.core.Timeline {
  if (reducedMotion()) return makeReducedShim();
  const tl = gsap.timeline();
  const stepDur = 0.04;
  const steps = Math.max(1, Math.floor(durationSec / stepDur));
  for (let i = 0; i < steps; i++) {
    const damping = 1 - i / steps;
    tl.to(el, {
      x: (Math.random() - 0.5) * intensity * damping,
      y: (Math.random() - 0.5) * intensity * damping,
      duration: stepDur,
      ease: "none",
    });
  }
  tl.to(el, { x: 0, y: 0, duration: stepDur });
  return tl;
}

// Character-by-character text reveal. Returns a stop() handle so callers can
// abort mid-flight (e.g. on skip-intro click). Reduced-motion: writes the
// final string immediately and resolves.
export interface TypeHandle {
  stop(): void;
  done: Promise<void>;
}

export function typeText(el: HTMLElement, text: string, speedMs = 45): TypeHandle {
  if (reducedMotion()) {
    el.textContent = text;
    return { stop: () => undefined, done: Promise.resolve() };
  }
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const done = new Promise<void>((resolve) => {
    let i = 0;
    el.textContent = "";
    const step = (): void => {
      if (cancelled) {
        resolve();
        return;
      }
      el.textContent = text.slice(0, i);
      if (i < text.length) {
        i++;
        timer = setTimeout(step, speedMs);
      } else {
        resolve();
      }
    };
    step();
  });
  return {
    stop: () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      el.textContent = text;
    },
    done,
  };
}

// Wraps each character of an element's textContent in a <span class="char">
// for stagger animations. Returns the created spans for direct GSAP targeting.
// Idempotent: calling twice on the same element re-uses existing spans if
// present (data-split="1").
export function splitChars(el: HTMLElement): HTMLSpanElement[] {
  if (el.dataset.split === "1") {
    return Array.from(el.querySelectorAll<HTMLSpanElement>("span.anim-char"));
  }
  const text = el.textContent ?? "";
  el.textContent = "";
  const spans: HTMLSpanElement[] = [];
  for (const ch of text) {
    const span = document.createElement("span");
    span.className = "anim-char";
    span.style.display = "inline-block";
    span.style.willChange = "transform, opacity";
    span.textContent = ch === " " ? " " : ch;
    el.appendChild(span);
    spans.push(span);
  }
  el.dataset.split = "1";
  return spans;
}

export { reducedMotion };
