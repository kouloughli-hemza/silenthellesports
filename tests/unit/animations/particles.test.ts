import { describe, it, expect, beforeEach, vi } from "vitest";
import { ParticleSystem } from "@/lib/animations/particles";
import { BUDGET } from "@/lib/animations/presets";

// jsdom has no canvas 2d implementation. Stub the methods ParticleSystem uses
// at construction + tick so the math under test runs unchanged.
function makeFakeContext(): CanvasRenderingContext2D {
  const noop = () => undefined;
  const grad = { addColorStop: noop } as unknown as CanvasGradient;
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    setTransform: noop,
    scale: noop,
    clearRect: noop,
    fillRect: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    fill: noop,
    stroke: noop,
    createRadialGradient: () => grad,
  } as unknown as CanvasRenderingContext2D;
  return ctx;
}

function makeCanvas(width = 400, height = 300): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  Object.defineProperty(canvas, "getBoundingClientRect", {
    value: () => ({ width, height, top: 0, left: 0, bottom: height, right: width, x: 0, y: 0, toJSON: () => ({}) }),
  });
  // jsdom returns null for getContext('2d') — stub it.
  vi.spyOn(canvas, "getContext").mockImplementation((type: string) => {
    if (type === "2d") return makeFakeContext() as unknown as RenderingContext;
    return null;
  });
  return canvas;
}

describe("ParticleSystem", () => {
  beforeEach(() => {
    // Force desktop scale for deterministic counts.
    Object.defineProperty(window, "innerWidth", { value: 1280, configurable: true });
  });

  it("starts with zero particles", () => {
    const sys = new ParticleSystem(makeCanvas());
    expect(sys.count).toBe(0);
    sys.destroy();
  });

  it("spawn(kind, { count }) adds that many particles", () => {
    const sys = new ParticleSystem(makeCanvas());
    sys.spawn("burst", { x: 100, y: 100, count: 30 });
    expect(sys.count).toBe(30);
    sys.spawn("ember", { x: 100, y: 100, count: 12 });
    expect(sys.count).toBe(42);
    sys.destroy();
  });

  it("enforces the global particle budget", () => {
    const sys = new ParticleSystem(makeCanvas(), { maxParticles: 50 });
    sys.spawn("burst", { x: 0, y: 0, count: 200 });
    expect(sys.count).toBeLessThanOrEqual(50);
    sys.destroy();
  });

  it("never exceeds BUDGET.maxParticlesGlobal even if higher cap requested", () => {
    const sys = new ParticleSystem(makeCanvas(), { maxParticles: 5_000 });
    sys.spawn("burst", { x: 0, y: 0, count: 5_000 });
    expect(sys.count).toBeLessThanOrEqual(BUDGET.maxParticlesGlobal);
    sys.destroy();
  });

  it("scales spawn counts on mobile", () => {
    Object.defineProperty(window, "innerWidth", { value: 375, configurable: true });
    const sys = new ParticleSystem(makeCanvas());
    sys.spawn("burst", { x: 0, y: 0, count: 100 });
    // mobileScale = 0.6 → ~60
    expect(sys.count).toBeGreaterThanOrEqual(50);
    expect(sys.count).toBeLessThanOrEqual(70);
    sys.destroy();
  });

  it("disabled system never spawns", () => {
    const sys = new ParticleSystem(makeCanvas(), { disabled: true });
    sys.spawn("burst", { x: 0, y: 0, count: 50 });
    expect(sys.count).toBe(0);
    sys.destroy();
  });

  it("stop() clears all active particles and emitters", () => {
    const sys = new ParticleSystem(makeCanvas());
    sys.spawn("ember", { x: 0, y: 0, count: 20 });
    const handle = sys.emit("ember", 30, { x: 0, y: 0 });
    expect(sys.count).toBe(20);
    sys.stop();
    expect(sys.count).toBe(0);
    handle.stop(); // safe to stop after system stop
    sys.destroy();
  });

  it("pool reuses indices — destroying particles does not grow the pool unboundedly", () => {
    const sys = new ParticleSystem(makeCanvas(), { maxParticles: 100 });
    for (let i = 0; i < 5; i++) {
      sys.spawn("spark", { x: 0, y: 0, count: 50 });
      sys.stop(); // releases all
    }
    expect(sys.count).toBe(0);
    // Spawn one more — pool size stays bounded.
    sys.spawn("spark", { x: 0, y: 0, count: 10 });
    expect(sys.count).toBe(10);
    sys.destroy();
  });

  it("bounds() reflects canvas CSS dimensions", () => {
    const sys = new ParticleSystem(makeCanvas(640, 200));
    expect(sys.bounds()).toEqual({ width: 640, height: 200 });
    sys.destroy();
  });

  it("emit handle stops the emitter without affecting other emitters", () => {
    const sys = new ParticleSystem(makeCanvas());
    const a = sys.emit("ember", 10, { x: 0, y: 0 });
    const b = sys.emit("smoke", 10, { x: 0, y: 0 });
    a.stop();
    // b is still live — system should still be willing to receive ticks (we
    // can't easily assert spawning here without animating, but stop() should
    // not throw and re-stopping a should be a no-op).
    expect(() => a.stop()).not.toThrow();
    expect(() => b.stop()).not.toThrow();
    sys.destroy();
  });

  it("destroy() empties the pool fully", () => {
    const sys = new ParticleSystem(makeCanvas());
    sys.spawn("burst", { x: 0, y: 0, count: 50 });
    sys.destroy();
    expect(sys.count).toBe(0);
  });

  it("spawn with no count defaults to 1", () => {
    const sys = new ParticleSystem(makeCanvas());
    sys.spawn("ember", { x: 0, y: 0 });
    expect(sys.count).toBe(1);
    sys.destroy();
  });

  it("rejects when 2d context unavailable", () => {
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue(null);
    Object.defineProperty(canvas, "getBoundingClientRect", {
      value: () => ({ width: 100, height: 100, top: 0, left: 0, bottom: 100, right: 100, x: 0, y: 0, toJSON: () => ({}) }),
    });
    expect(() => new ParticleSystem(canvas)).toThrow(/2d context/);
  });
});
