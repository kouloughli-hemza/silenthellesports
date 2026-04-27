// Single particle system that handles all 5 kinds (ember, smoke, dust, spark,
// burst) via one RAF loop and one shared free-list. Pooled so the hot path
// never allocates. DPR-aware. IntersectionObserver-pause safe.
//
// Reference implementation: see prototype-hero-plane-drop.html and
// prototype-winner-winner.html. The math here is ported from those, just with
// pooling, types, a single class API, and global-budget enforcement.

import { BUDGET, COLORS, PALETTES, pickColor, type RGB } from "./presets";

export type ParticleKind = "ember" | "smoke" | "dust" | "spark" | "burst";

export interface SpawnOpts {
  x: number;
  y: number;
  count?: number;
  // Optional overrides for tuning at the call site.
  speedMin?: number;
  speedMax?: number;
  sizeMin?: number;
  sizeMax?: number;
  decayMin?: number;
  decayMax?: number;
  color?: RGB;
  // Direction in radians, used by spark/burst (omits → omni). Spread is +/- in radians.
  direction?: number;
  spread?: number;
  // Vertical bias (e.g. dust spreads more horizontally than vertically).
  vyScale?: number;
}

interface Particle {
  active: boolean;
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  growRate: number;
  gravity: number;
  drag: number;
  color: RGB;
  flicker: number; // phase, 0 if disabled
  flickerEnabled: boolean;
  trail: boolean;
}

export interface EmitHandle {
  stop(): void;
}

interface SystemOpts {
  maxParticles?: number;
  // Manual override (defaults to BUDGET.mobileScale on small screens).
  mobileScale?: number;
  // Disable spawning entirely (used by reduced-motion).
  disabled?: boolean;
}

// Reusable per-instance scratch.
const TWO_PI = Math.PI * 2;

export class ParticleSystem {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly pool: Particle[] = [];
  private readonly free: number[] = []; // indices into pool that are inactive
  private readonly maxParticles: number;
  private readonly mobileScale: number;
  private readonly emitters: Array<{ kind: ParticleKind; rate: number; opts: Omit<SpawnOpts, "count">; carry: number; live: boolean }> = [];
  private dpr = 1;
  private width = 0;
  private height = 0;
  private raf = 0;
  private running = false;
  private lastT = 0;
  private disabled = false;

  constructor(canvas: HTMLCanvasElement, opts: SystemOpts = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("ParticleSystem: 2d context unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.maxParticles = Math.min(opts.maxParticles ?? BUDGET.maxParticlesGlobal, BUDGET.maxParticlesGlobal);
    const isMobile = typeof window !== "undefined" && window.innerWidth < BUDGET.mobileBreakpoint;
    this.mobileScale = opts.mobileScale ?? (isMobile ? BUDGET.mobileScale : 1);
    this.disabled = opts.disabled ?? false;
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    this.dpr = dpr;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  spawn(kind: ParticleKind, opts: SpawnOpts): void {
    if (this.disabled) return;
    const requested = Math.max(1, Math.round((opts.count ?? 1) * this.mobileScale));
    for (let i = 0; i < requested; i++) {
      if (this.activeCount() >= this.maxParticles) break;
      const p = this.acquire();
      this.configure(p, kind, opts);
    }
  }

  emit(kind: ParticleKind, ratePerSec: number, opts: Omit<SpawnOpts, "count"> = { x: 0, y: 0 }): EmitHandle {
    const entry = { kind, rate: ratePerSec, opts, carry: 0, live: true };
    this.emitters.push(entry);
    return {
      stop: () => {
        entry.live = false;
      },
    };
  }

  start(): void {
    if (this.running || this.disabled) return;
    this.running = true;
    this.lastT = performance.now();
    this.tick();
  }

  pause(): void {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  // Stop AND clear all state. Use when leaving a section.
  stop(): void {
    this.pause();
    this.emitters.length = 0;
    for (const p of this.pool) p.active = false;
    this.free.length = 0;
    for (let i = 0; i < this.pool.length; i++) this.free.push(i);
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  destroy(): void {
    this.stop();
    this.pool.length = 0;
    this.free.length = 0;
  }

  get count(): number {
    return this.activeCount();
  }

  // Logical (CSS pixel) bounds — useful for callers that want to spawn at a
  // computed point inside the canvas without leaking the DOM ref.
  bounds(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  private activeCount(): number {
    return this.pool.length - this.free.length;
  }

  private acquire(): Particle {
    const free = this.free.pop();
    if (free !== undefined) {
      const p = this.pool[free] as Particle;
      p.active = true;
      return p;
    }
    const fresh: Particle = {
      active: true,
      kind: "ember",
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 1,
      decay: 0.01,
      size: 1,
      growRate: 0,
      gravity: 0,
      drag: 1,
      color: COLORS.ember,
      flicker: 0,
      flickerEnabled: false,
      trail: false,
    };
    this.pool.push(fresh);
    return fresh;
  }

  private release(idx: number): void {
    (this.pool[idx] as Particle).active = false;
    this.free.push(idx);
  }

  private configure(p: Particle, kind: ParticleKind, opts: SpawnOpts): void {
    p.kind = kind;
    const palette = PALETTES[kind];
    p.color = opts.color ?? pickColor(palette);

    if (kind === "ember") {
      p.x = opts.x + (Math.random() - 0.5) * 4;
      p.y = opts.y;
      p.vx = (Math.random() - 0.5) * (opts.speedMax ?? 0.4);
      p.vy = -(opts.speedMin ?? 0.3) - Math.random() * ((opts.speedMax ?? 0.7) - (opts.speedMin ?? 0.3));
      p.life = 1;
      p.decay = (opts.decayMin ?? 0.003) + Math.random() * ((opts.decayMax ?? 0.005) - (opts.decayMin ?? 0.003));
      p.size = (opts.sizeMin ?? 0.6) + Math.random() * ((opts.sizeMax ?? 1.8) - (opts.sizeMin ?? 0.6));
      p.growRate = 0;
      p.gravity = 0;
      p.drag = 1;
      p.flicker = Math.random() * TWO_PI;
      p.flickerEnabled = true;
      p.trail = false;
      return;
    }
    if (kind === "smoke") {
      p.x = opts.x + (Math.random() - 0.5) * 4;
      p.y = opts.y + Math.random() * 3;
      p.vx = (Math.random() - 0.5) * 0.3;
      p.vy = 0.2 + Math.random() * 0.3;
      p.life = 1;
      p.decay = (opts.decayMin ?? 0.005) + Math.random() * ((opts.decayMax ?? 0.013) - (opts.decayMin ?? 0.005));
      p.size = (opts.sizeMin ?? 3) + Math.random() * ((opts.sizeMax ?? 8) - (opts.sizeMin ?? 3));
      p.growRate = 0.15;
      p.gravity = 0;
      p.drag = 1;
      p.flicker = 0;
      p.flickerEnabled = false;
      p.trail = false;
      return;
    }
    if (kind === "dust") {
      const angle = (Math.random() - 0.5) * Math.PI * 0.6 + (Math.random() < 0.5 ? 0 : Math.PI);
      const speed = (opts.speedMin ?? 4) + Math.random() * ((opts.speedMax ?? 13) - (opts.speedMin ?? 4));
      p.x = opts.x + (Math.random() - 0.5) * 30;
      p.y = opts.y + (Math.random() - 0.5) * 8;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed * (opts.vyScale ?? 0.3) - Math.random() * 1.5;
      p.life = 1;
      p.decay = (opts.decayMin ?? 0.004) + Math.random() * ((opts.decayMax ?? 0.012) - (opts.decayMin ?? 0.004));
      p.size = (opts.sizeMin ?? 4) + Math.random() * ((opts.sizeMax ?? 12) - (opts.sizeMin ?? 4));
      p.growRate = 0.3;
      p.gravity = 0.05;
      p.drag = 0.96;
      p.flicker = 0;
      p.flickerEnabled = false;
      p.trail = false;
      return;
    }
    if (kind === "spark") {
      const dir = opts.direction ?? Math.random() * TWO_PI;
      const spread = opts.spread ?? Math.PI;
      const angle = dir + (Math.random() - 0.5) * spread;
      const speed = (opts.speedMin ?? 3) + Math.random() * ((opts.speedMax ?? 13) - (opts.speedMin ?? 3));
      p.x = opts.x;
      p.y = opts.y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - Math.random() * 4;
      p.life = 1;
      p.decay = (opts.decayMin ?? 0.012) + Math.random() * ((opts.decayMax ?? 0.027) - (opts.decayMin ?? 0.012));
      p.size = (opts.sizeMin ?? 1) + Math.random() * ((opts.sizeMax ?? 3) - (opts.sizeMin ?? 1));
      p.growRate = 0;
      p.gravity = 0.15;
      p.drag = 0.97;
      p.flicker = 0;
      p.flickerEnabled = false;
      p.trail = true;
      return;
    }
    // burst — radial omni-directional with mixed palette, gold-heavy
    const angle = Math.random() * TWO_PI;
    const speed = (opts.speedMin ?? 2) + Math.random() * ((opts.speedMax ?? 10) - (opts.speedMin ?? 2));
    p.x = opts.x;
    p.y = opts.y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed - 1;
    p.life = 1;
    p.decay = (opts.decayMin ?? 0.005) + Math.random() * ((opts.decayMax ?? 0.017) - (opts.decayMin ?? 0.005));
    p.size = (opts.sizeMin ?? 1) + Math.random() * ((opts.sizeMax ?? 3.5) - (opts.sizeMin ?? 1));
    p.growRate = 0;
    p.gravity = 0.04 + Math.random() * 0.03;
    p.drag = 0.985 + Math.random() * 0.01;
    p.flicker = 0;
    p.flickerEnabled = false;
    p.trail = true;
  }

  private tick = (): void => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(48, now - this.lastT); // cap at ~20fps slice to avoid huge jumps after tab focus
    this.lastT = now;

    // Continuous emitters
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const e = this.emitters[i];
      if (!e) continue;
      if (!e.live) {
        this.emitters.splice(i, 1);
        continue;
      }
      e.carry += (e.rate * dt) / 1000;
      const toSpawn = Math.floor(e.carry);
      if (toSpawn > 0) {
        e.carry -= toSpawn;
        this.spawn(e.kind, { ...e.opts, count: toSpawn });
      }
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i] as Particle;
      if (!p.active) continue;

      // physics
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      if (p.growRate) p.size += p.growRate;
      p.life -= p.decay;
      if (p.flickerEnabled) p.flicker += 0.18;

      if (p.life <= 0 || p.y < -20 || p.y > this.height + 100 || p.x < -100 || p.x > this.width + 100) {
        this.release(i);
        continue;
      }

      const flick = p.flickerEnabled ? 0.6 + 0.4 * Math.sin(p.flicker) : 1;
      const alpha = Math.max(0, p.life * flick);

      // render
      const [r, g, b] = p.color;
      if (p.kind === "smoke" || p.kind === "dust") {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        const a = alpha * (p.kind === "smoke" ? 0.55 : 0.4);
        grad.addColorStop(0, `rgba(${r},${g},${b},${a})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
        ctx.fill();
        continue;
      }

      if (p.trail) {
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.5})`;
        ctx.lineWidth = p.size * 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 2, p.y - p.vy * 2);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
      ctx.fill();
      if (p.kind === "ember" || p.trail) {
        // soft halo
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.2})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.kind === "ember" ? 3 : 2.5), 0, TWO_PI);
        ctx.fill();
      }
    }

    this.raf = requestAnimationFrame(this.tick);
  };
}
