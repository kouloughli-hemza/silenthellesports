// Brand color palettes for particle systems and shared timing constants.
// Pulled directly from globals.css tokens so the animation layer can't drift
// from the rest of the brand.

export type RGB = readonly [number, number, number];

export const COLORS = {
  hellRed: [230, 0, 19] as RGB,
  ember: [255, 69, 0] as RGB,
  gold: [255, 217, 61] as RGB,
  goldDeep: [255, 165, 0] as RGB,
  bone: [245, 240, 232] as RGB,
  dust: [120, 60, 40] as RGB,
  smokeRed: [230, 0, 19] as RGB,
  smokeEmber: [255, 69, 0] as RGB,
} as const;

// Color picker per particle kind. Returns one of the listed RGB tuples,
// weighted by the included `weights` array (must sum to 1).
export interface PaletteEntry {
  color: RGB;
  weight: number;
}

export const PALETTES = {
  ember: [
    { color: COLORS.ember, weight: 0.7 },
    { color: COLORS.hellRed, weight: 0.3 },
  ],
  smoke: [
    { color: COLORS.smokeRed, weight: 0.5 },
    { color: COLORS.smokeEmber, weight: 0.5 },
  ],
  dust: [{ color: COLORS.dust, weight: 1 }],
  spark: [
    { color: COLORS.gold, weight: 0.5 },
    { color: COLORS.ember, weight: 0.5 },
  ],
  burst: [
    { color: COLORS.gold, weight: 0.55 },
    { color: COLORS.hellRed, weight: 0.27 },
    { color: COLORS.ember, weight: 0.18 },
  ],
} as const satisfies Record<string, PaletteEntry[]>;

export function pickColor(palette: readonly PaletteEntry[]): RGB {
  if (palette.length === 0) return COLORS.bone;
  const r = Math.random();
  let acc = 0;
  for (const entry of palette) {
    acc += entry.weight;
    if (r <= acc) return entry.color;
  }
  // Numerical-safety fallback to last entry.
  return (palette[palette.length - 1] as PaletteEntry).color;
}

// Cinematic eases — kept as string constants so we never typo them and the
// catalog is in one place. Use the GSAP names directly.
export const EASE = {
  punch: "back.out(1.6)",
  punchHard: "back.out(2)",
  punchHardest: "back.out(2.5)",
  charDrop: "back.out(1.8)",
  sweep: "power3.out",
  sweepIn: "power3.in",
  fall: "power2.in",
  land: "power2.out",
  cruise: "power1.inOut",
  drift: "sine.inOut",
  flicker: "none",
} as const;

// Performance budgets enforced inside ParticleSystem.
export const BUDGET = {
  maxParticlesGlobal: 800,
  mobileBreakpoint: 768,
  // Multiplied into spawn counts when window.innerWidth < mobileBreakpoint.
  mobileScale: 0.6,
} as const;
