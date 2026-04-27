# Claude Code Kickoff — Animations Phase

## How to use

1. Drop the contents of this folder (`ANIMATIONS.md`, `prototype-hero-plane-drop.html`, `prototype-winner-winner.html`) into your project root next to the existing `SPEC.md`
2. Open Claude Code in the project folder: `claude`
3. Paste everything below the `--- PROMPT ---` line as your first message
4. Wait for it to study the prototypes, ask questions if any, propose its Phase A plan
5. Approve, then let it work — same phase-by-phase rhythm as the original build

---

--- PROMPT ---

You are extending the Silent Hell Esports site we already built (defined by `SPEC.md` and `silenthell-design/`) with a layer of cinematic animations. The existing build is **not** to be refactored — animations are additive only.

## Source of truth

- **`ANIMATIONS.md`** — the full animations spec. Read it end-to-end before doing anything.
- **`prototype-hero-plane-drop.html`** — open in a browser, watch it 5+ times, study the source. This is the visual quality bar for the hero entrance.
- **`prototype-winner-winner.html`** — same: open it, watch it, study it. This is the quality bar for the trophy reveal.
- **`SPEC.md`** — the existing build spec, still authoritative for everything else
- **`silenthell-design/`** — the design bundle, still authoritative for tokens, colors, fonts

The two prototype HTML files are not just inspiration — they're the actual reference implementation. When you build Hero (Scene 01) and Trophy (Scene 03), match those prototypes pixel-for-pixel and timing-for-timing. The other 8 scenes follow the same patterns described in `ANIMATIONS.md`.

## How to work

`ANIMATIONS.md` defines 6 phases (A through F). Same rhythm as the original build:

1. Read everything first — `ANIMATIONS.md` end-to-end, both prototypes opened in a browser, scanned for technique
2. Propose your Phase A plan — what you'll build, file paths, sequential vs subagent fan-out, where you'll converge
3. Wait for approval
4. Execute Phase A
5. Run `npm run build`, `npm run typecheck`, `npm run lint`, `npm test` — all must pass
6. Write a brief summary, then stop and wait for human review
7. Repeat for B → C → D → E → F

## Subagent strategy for this phase

Phase A (foundation) is sequential — single agent, one mind on the shared primitives.

Phases B and C build the two reference scenes (Hero and Trophy). These are independent files but they're also the scenes Claude Code is most likely to get wrong, so do them sequentially with the main agent so quality stays high.

Phases D, E, F can fan out — once the foundation and references exist, scenes are independent. Reasonable fan-out: one subagent per scene in those phases, all consuming the locked Phase A primitives.

## Quality bar — non-negotiable

- Match the reference prototypes. If your built version doesn't have the shockwaves, particle bursts, screen shake, and multi-layer composition — **rebuild it**. "Looks fine" is not the bar.
- GSAP timelines, not raw CSS keyframes
- Canvas particle systems, not CSS dots
- `prefers-reduced-motion` enforced at every scene with a static fallback
- Lighthouse Performance ≥ 90 on the homepage with all animations enabled
- Zero `any` types
- All RAF loops cleaned up on unmount, all GSAP timelines `.kill()`'d
- Mobile-tested on a real Android device, not just DevTools throttling

## Critical constraints

- **Do not refactor existing components.** Wrap, extend, compose — never rewrite. If you catch yourself touching `src/app/[locale]/page.tsx` to "make it animation-aware," stop and use composition instead.
- **Do not change** the database schema, the Yalidine integration, auth, the admin dashboard, the COD flow, or i18n routing. None of those are touched by this phase.
- **Hero plays once per visitor.** Use `localStorage` key `sh:hero-seen`. Returning visitors get a 1.2s logo fade-in, not the 7-second cinematic.
- **A `Skip intro` button must appear after 2 seconds** of the hero playing — keyboard accessible, focusable.
- **Body scroll is locked** during the hero entrance and unlocks on `onComplete`.
- **Reduced motion is a hard rule, not a nice-to-have.** Every scene must render correctly with `prefers-reduced-motion: reduce` set in the OS — test it before declaring any scene done.

## What to do right now

1. Open `prototype-hero-plane-drop.html` in your browser. Watch it 5 times. Note the exact timing of every beat.
2. Open `prototype-winner-winner.html`. Same.
3. Read `ANIMATIONS.md` end-to-end.
4. List any clarifying questions about the spec or the prototypes.
5. If no questions, propose your Phase A plan: which files you'll create, in what order, what the public API of `ParticleSystem`, `shakeStage`, `useReducedMotion`, `useScrollScene` will look like, and where you expect to fan out (you shouldn't, in Phase A).
6. Wait for approval before writing any code.

Do not start writing code in this first turn. Read, study, plan, propose. Then we go.
