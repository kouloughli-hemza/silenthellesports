# Silent Hell Esports — Cinematic Animations Spec (ANIMATIONS.md)

> **Read me first.** This is an **additive** spec layered on top of the existing build defined in `SPEC.md` and the design bundle at `silenthell-design/`. It does not replace anything. Do not refactor existing components — wrap or extend them with the animation primitives defined here. If anything in this spec conflicts with `SPEC.md`, `SPEC.md` wins. If anything conflicts with the design bundle's locked tokens (colors, fonts), the design bundle wins.

---

## 1. Prerequisites

This spec assumes the work in `SPEC.md` has been built or is in progress. Specifically, you should already have:

- Next.js 15 + TypeScript + Tailwind v4 set up
- Design tokens in `globals.css` matching the `silenthell-design/` bundle
- Public site sections (`Hero`, `RosterStrip`, `TrophyCase`, `Events`, `Store`, `Giveaways`) rendering real or placeholder data
- Brand primitives (`SkullIcon`, `CustomCursor`, `EmberField`, `CountUp`, `SectionHeading`)

If any of those are missing, **stop and finish them first**. Animations layer on top of working sections, not the other way around.

## 2. Two reference prototypes

Two cinematic-grade reference prototypes ship alongside this spec. Open them in a browser and study them carefully. They define the visual language and the technical patterns that every other animation must match.

- `animations-handoff/prototype-hero-plane-drop.html` — the hero entrance
- `animations-handoff/prototype-winner-winner.html` — the trophy reveal

Both use exactly the patterns this spec defines. When in doubt about timing, easing, particle density, or shake intensity, **measure against these references**.

## 3. Visual quality bar — non-negotiable

Every animation in this spec must hit the same level as the two reference prototypes. That means:

- **GSAP timelines** for every choreographed sequence — never raw CSS keyframes for multi-step animations
- **Canvas particle systems** for fire, smoke, dust, embers, sparks — never CSS dots or SVG circles
- **Damped screen shake** on every impact moment — multi-axis, intensity drops linearly to zero
- **Multi-layer composition** — every scene must layer at minimum: atmospheric background, particle FX, primary subject, HUD chrome, vignette/grain
- **Cinematic eases** — `back.out(1.8)` for punches, `power3.out` for sweeps, `sine.inOut` for sways, `power2.in` for falls, `power1.inOut` for cruises. Never `linear` for motion that should feel weighted.
- **Multi-stage timelines** — no animation is one beat. Hero is plane → drop → chute → land → impact → logo → tag (7 stages). Every signature animation must have at least 4 distinct stages.

If a built animation looks "fine" but lacks shockwaves, particle bursts, or screen shake — it does not meet the bar. Compare side-by-side against the references and rebuild.

## 4. Shared animation foundation

Build these shared modules **once**, then every section consumes them. Do not duplicate particle code per section.

### 4.1 Install GSAP

```bash
npm install gsap
```

GSAP free is sufficient — no premium plugins (ScrollTrigger free version is in the standard package).

### 4.2 File structure

```
src/
├── lib/
│   ├── animations/
│   │   ├── timeline.ts          # GSAP wrapper, shake helper, reduced-motion guard
│   │   ├── particles.ts         # Canvas particle system (embers, dust, smoke, sparks, burst)
│   │   ├── scroll-trigger.ts    # IntersectionObserver wrapper for scroll-triggered scenes
│   │   ├── audio.ts             # Optional sound design controller
│   │   └── presets.ts           # Color palettes for particles, ease catalog, intensity scales
│   └── hooks/
│       ├── useReducedMotion.ts  # Returns boolean from matchMedia('(prefers-reduced-motion: reduce)')
│       ├── useFirstVisit.ts     # localStorage check for hero first-load gating
│       └── useScrollScene.ts    # Combines IntersectionObserver + GSAP timeline trigger
├── components/
│   ├── animations/
│   │   ├── ParticleCanvas.tsx   # Reusable canvas component (full-bleed or contained)
│   │   ├── ShakeWrapper.tsx     # Wraps children, exposes ref for shake helper
│   │   ├── AnimatedScene.tsx    # Base scroll-triggered scene component
│   │   └── HUDChrome.tsx        # Bracket corners, sector readout, live indicator (reusable)
│   └── scenes/
│       ├── HeroPlaneDrop.tsx    # Scene 01
│       ├── RosterParachute.tsx  # Scene 02
│       ├── TrophyWinner.tsx     # Scene 03
│       ├── EventBlueZone.tsx    # Scene 04
│       ├── StoreAirdrop.tsx     # Scene 05
│       ├── GiveawayCrate.tsx    # Scene 06
│       └── FooterFinalCircle.tsx # Scene 07
```

### 4.3 Particle system spec (`lib/animations/particles.ts`)

Build a single `ParticleSystem` class that handles all particle types via the `kind` parameter. The system must support:

- **`ember`** — slow upward drift, flicker via sin wave, varying speed/size, spawned continuously at a rate parameter, color from `[ember, hell-red]` weighted random
- **`smoke`** — slow drift in spawn-direction, grows over life, soft radial gradient fill, alpha decays, color from `[hell-red, ember]`
- **`dust`** — fast horizontal explosion at impact point, decelerates with drag, low gravity, brown-tinted (`[120,60,40]`), grows over life
- **`spark`** — radial burst, fast decay, gravity, drag, with motion-trail rendering, gold/ember colored
- **`burst`** — radial omni-directional spread, gravity, drag, mixed gold/red/ember, used for celebratory moments (winner, giveaway crate open, store airdrop landing)

Single `RAF` loop. Instances are pooled — never `new` particles in the hot path. Reuse via free-list. DPR-aware canvas sizing.

The two prototypes contain a working reference implementation — port it to TypeScript with proper types and the pooling improvement. Do not reinvent.

### 4.4 Timeline helpers (`lib/animations/timeline.ts`)

Export at minimum:

- `createTimeline(opts)` — wrapper that respects `prefers-reduced-motion` (returns a no-op timeline that just fires `onComplete` when reduced)
- `shakeStage(element, intensity, duration)` — damped multi-axis shake, returns a timeline for sequencing
- `typeText(element, text, speedMs)` — character-by-character reveal, cursor optional
- `splitChars(element)` — wraps each character of an element in `<span>` for stagger animations (used by WINNER WINNER reveal)

### 4.5 Reduced motion — hard rule

Every scene must check `prefers-reduced-motion: reduce` via the `useReducedMotion` hook. When reduced motion is true:

- No timelines run — sections render in their final state immediately
- Particle canvases stop their RAF loop and clear (no continuous embers either)
- Screen shake is a no-op
- Cloud parallax stops
- Custom cursor disables
- Page transitions become instant cross-fades, not spectator-cam reveals

This is non-negotiable. Test with macOS System Settings → Accessibility → Display → Reduce motion enabled.

### 4.6 Performance budget

- **CPU:** total particle count never exceeds 800 simultaneously across the whole page
- **GPU:** all canvases that aren't currently animating must `cancelAnimationFrame` and clear — no continuous loops outside the active section
- **Memory:** use IntersectionObserver to pause particle systems for offscreen sections (within 200% rootMargin so they ramp up before entering)
- **Mobile:** halve particle counts and disable smoke trails when `window.innerWidth < 768`. Test on real mid-range Android — Tecno, Infinix, Redmi A-series — these are the actual Algerian phones the audience uses.
- **Frame rate:** 60fps target on a 2020 mid-range Android. If a scene drops below, cut particle counts before you cut visual quality elsewhere.

## 5. Per-section animation specs

### 5.1 Hero — plane drop (Scene 01)

**Reference:** `prototype-hero-plane-drop.html` — match exactly.

**Trigger:** First visit only. Use `useFirstVisit` hook (localStorage key `sh:hero-seen`). Returning visitors get a 1.2s logo fade-in instead.

**Timing:** 7 seconds total. The user can skip with a "Skip intro ▸" button bottom-right after 2s.

**What's in it (from prototype):**
- Atmospheric multi-layer sky (3 gradient layers + 80-star canvas with twinkle + 6 parallax cloud rows)
- C-130 SVG with light/shadow gradients, glowing engines, prop blur, banking rotation across 5.5s
- Paratrooper free-falls 0.6s, chute snap-deploys with `back.out(2.5)`, body jolts on deceleration, sways during 3s descent
- Live red+ember smoke trail particles spawning from trooper position
- Impact: 120 dust particles + 60 sparks with trails + 40 rising embers, screen flash, three expanding shockwaves, ground line
- Damped screen shake (28px) on impact, aftershock (8px) on logo reveal
- Logo punches up with `back.out(1.6)`, pulses once
- Tagline types out at 45ms/char with blinking cursor
- HUD brackets snap in during descent

**Production differences from prototype:**
- Replace the placeholder logo SVG with the real Silent Hell logo (already in design bundle at `silenthell-design/project/uploads/Silent_Hell_Esports_allmode.png` — but commission a clean SVG version)
- Add a `Skip intro` button that's keyboard-accessible (Tab, Enter, Esc)
- Pull the tagline from `site_config.hero_tagline` so admin can edit it
- The hero entrance must complete before the homepage becomes scrollable — lock body scroll until `onComplete`

**Mobile:** Drop plane size to 140px wide, particle counts to 60% values, paratrooper drift simplified.

### 5.2 Roster — squad ready-up (Scene 02)

**Trigger:** Scroll-triggered when section enters viewport (use `useScrollScene` hook with `rootMargin: -100px` so it triggers when card row is fully in view).

**Pattern:** Each player card descends with a parachute, exactly like the hero paratrooper, staggered 250ms apart. Same chute SVG, same snap-deploy, same sway, same dust shockwave on landing.

**Timing:**
- Cards start 400px above their final position with parachutes attached
- Card N starts dropping at `N * 250ms`
- Each card falls in 1.2s with `power2.in` ease for the descent and a brief deceleration at the end via `back.out(1.4)`
- On landing, parachute fades out over 0.4s, dust shockwave (40 particles, dust kind) spawns, card settles
- After all cards land, a brief unified shake (6px) signals "squad assembled"

**Hover state (desktop only):**
- Scope reticle SVG fades in over the player photo (already in `silenthell-design/project/home.jsx` as the `RosterStrip` component — port it)
- Card border becomes hell-red
- Slight zoom on the photo (1.04x) over 200ms
- Chromatic aberration: subtle red/cyan offset on the photo, achieved via two stacked photo elements with `mix-blend-mode` and offset transforms (3px max)

**Touch state (mobile):** Tap toggles the scope overlay. No hover effect.

**Reduced motion:** Cards fade in stacked, no parachutes, no dust.

### 5.3 Trophy — winner winner (Scene 03)

**Reference:** `prototype-winner-winner.html` — match exactly.

**Trigger:** Scroll-triggered when the trophy section's heading enters viewport.

**What's in it (from prototype):**
- Bracket corners snap in with `back.out(2)`, staggered
- Gold-red sweep crosses the screen in 0.4s, exits 0.3s later
- 180-particle radial burst at center (gold/red/ember mix) timed with the central flash
- Three expanding light rings (gold, hell-red, ember) at sequential moments
- "WINNER" then "WINNER" characters drop from above with rotateX flip and `back.out(1.8)`
- Second 140-particle burst as line 2 begins
- "CHICKEN DINNER" same character treatment
- Third 180-particle burst, third ring, gold chicken silhouette flies left-to-right with drop-shadow glow
- Subtitle fades in
- Kill feed cascades in from the right, one entry at a time (each entry: killer/weapon/victim, real Silent Hell IGNs)
- Trophy cards slide up from below, staggered
- Final 6px aftershock shake

**Production differences from prototype:**
- Pull trophy data from the database (no hardcoded names)
- Pull kill feed names from the active roster (use first 4 active players' IGNs and rotate weapons)
- The chicken silhouette is fine as-is — it's an iconic PUBG element, not a real bird
- Show only the top 3-4 trophies in the cascading row; full list lives below the animation in the existing `TrophyCase` grid

**Reduced motion:** Trophy grid renders normally. Add a small static "★ WINNER WINNER CHICKEN DINNER" header above it. No animation.

### 5.4 Events — blue zone closing (Scene 04)

**Trigger:** Each event card has its own zone effect. Idle when card is in viewport — gas density reflects the slot fill percentage. Click "Sign Up" → animated update.

**Visual elements:**
- Card has a circular SVG ring positioned behind it, larger than the card
- Ring radius shrinks toward the card as `slots_filled / capacity` increases (full size at 0%, just-larger-than-card at 100%)
- At >70% capacity: red volumetric gas particles begin drifting in from the card edges (smoke kind, very slow, sparse)
- At >85%: ring pulses red (1s sine wave), particle gas density doubles
- At 100%: ring contracts to card boundary, gas overlay reaches full density, "SLOTS CLOSED" stamp slams in with `back.out(2)` + 14px shake

**Sign-up click feedback:**
- Counter ticks up with `CountUp` (already exists in design bundle)
- Ring contracts smoothly (0.7s `power2.out`)
- Brief red flash on card border
- 20-particle burst (burst kind, hell-red weighted) emanating from the sign-up button
- 6px localized shake on the card itself

**Hot event indicator:** When >80% filled and >2 hours until close, badge "HOT" appears top-right with continuous flicker animation.

**Reduced motion:** Static circular progress indicator inside card, no gas, no shake.

### 5.5 Store — airdrop crate (Scene 05)

**Trigger:** Scroll-triggered when featured product row enters viewport. Plays once per session (track in sessionStorage).

**Animation:**
- Full-section overlay: red smoke plume rises from the product row position
- Featured product crate falls from above (small wooden crate SVG with red flare attached, similar to in-game supply drop)
- Crate has a smoke trail (smoke kind particles, hell-red, sparse)
- Crate slows on approach, lands with 80-particle dust burst + 16px screen shake
- Lid blows off with rotation, products lift on golden vertical light beams (gradient column from gold transparent to gold solid, fades top)
- Each product card emerges with a slight bounce
- Loot beams fade after 1s, leaving products in their final state

**Hover on product cards:**
- Card lifts 4px with shadow expanding
- A subtle gold beam re-appears under the card (200ms fade-in)
- Image zooms slightly (1.03x)

**Limited drops:** Cards in a "Limited" collection have a continuous slow-pulse red glow on their border (2s sine wave) and a "MYTHIC" badge with subtle shimmer.

**Reduced motion:** Skip the airdrop entirely, products fade in stacked. No hover beam.

### 5.6 Giveaways — mythic crate opening (Scene 06)

**Trigger:** Idle state shows the sealed crate. User clicks "Reveal Prize" or completes all entry methods.

**Idle state:**
- Crate sits center, slow vertical bob (sine wave, 4px amplitude, 3s period)
- Subtle gold glow underneath (radial gradient, pulsing 0.7-1.0 over 2s)
- Lock icon visible

**Open animation (~2.5s):**
- Lock icon shakes 0.3s, then bursts apart (15-particle spark burst)
- Crate lid blows off with rotation, falls out of frame
- 800-particle radial burst (burst kind, equal mix gold/red/ember) — biggest particle effect on the whole site
- Central white-gold flash, rapid bloom
- Three sequential expanding rings (gold, gold, hell-red)
- Light beam shoots up from crate
- Prize image rises from inside the crate, scales from 0 to final, glow underneath
- Camera shake (24px damped over 0.6s)
- Subtitle types out: "{User's name}, you've claimed: {prize}"

**Entry method completion feedback:**
- Each checkbox check triggers a small green flash + 6 sparks
- Progress bar fills with red→gold gradient as more methods complete
- When all complete: brief pulse of the entire entry block + the "Reveal Prize" button becomes available with a subtle continuous gold glow

**Reduced motion:** Crate fades out, prize fades in. No particles, no shake.

### 5.7 Footer — final circle (Scene 07)

**Trigger:** When footer enters viewport.

**Animation:**
- Red gas overlay (smoke particles) creeps in from the four edges of the viewport, contracting toward the Discord CTA in the footer center
- Within 1.5s, the gas forms a ring around just the CTA — everything outside is faintly red-tinted
- Discord button gets a continuous slow-pulse glow (gold this time, signaling "the safe zone")
- Button hover: ring contracts by another 10px, glow brightens, slight shake on hover release

**Reduced motion:** Static red border on the CTA, no gas.

### 5.8 Page transitions — spectator cam (Scene 08)

**Trigger:** Next.js `loading.tsx` and route transitions.

**Animation:**
- Black overlay sweeps in from right with a red-edged wipe (200ms)
- Centered: "SPECTATING [PAGE NAME]" in HUD font with bracket corners
- 400ms hold
- Overlay sweeps out from left
- Total: ~700ms

**Reduced motion:** 150ms cross-fade only, no overlay text.

### 5.9 404 — knocked down (Scene 09)

**Trigger:** Next.js `not-found.tsx`.

**Visual:**
- Full-page background of a darkened, desaturated random PUBG-style scene image (blurred)
- Foreground: HUD overlay reading "YOU'VE BEEN KNOCKED DOWN"
- Below: "404 — page not found" in mono
- A "REVIVE TO HOME" button with a circular progress ring around it that fills as you hover (1.5s) — clicking before fill complete navigates immediately, just for visual flavor
- Continuous low-level red gas particles at the edges
- Subtle camera sway (sine wave, 2px amplitude, very slow)

**Reduced motion:** Static text, button without ring fill animation.

### 5.10 Loading state — respawn timer (Scene 10)

**Trigger:** Next.js `loading.tsx` for any route.

**Visual:**
- Centered "RESPAWNING..." in display italic, 32px
- Below: animated count `3...2...1...` with each number scaling in/out
- A horizontal red bar fills left-to-right
- Subtle ember field background (the same `EmberField` component, lower density)
- If load takes >3s, switch to "STILL RESPAWNING — HEAVY FIRE" with continued bar pulses

**Reduced motion:** Simple "Loading..." text and a static spinner.

## 6. Implementation phases

Build in **6 phases**. Stop at each checkpoint and validate before continuing.

### Phase A — Foundation
Build the shared modules in `src/lib/animations/` and `src/components/animations/`. Install GSAP. Implement particle system with all 5 kinds. Implement `useReducedMotion`, `useFirstVisit`, `useScrollScene` hooks. Implement `ShakeWrapper` and `ParticleCanvas` components. Reduced-motion guard tested at every layer.

**Validation:** Build a `/admin/animations-debug` page that renders each particle kind and each helper in isolation so the team can verify they work.

### Phase B — Hero plane drop (Scene 01)
Port the prototype to a real Next.js component. Wire to `useFirstVisit`. Add the Skip button. Pull tagline from `site_config`. Lock body scroll until complete.

**Validation:** First visit shows full sequence. Reload shows fade-in only. `localStorage.removeItem('sh:hero-seen')` resets. Reduced-motion shows static logo.

### Phase C — Trophy winner reveal (Scene 03)
Port the prototype. Wire trophy data from DB. Wire kill feed to roster. Scroll-trigger via IntersectionObserver.

**Validation:** Scrolling to trophy section triggers exactly once per page load. Reload re-triggers. Trophy data updates when admin edits.

### Phase D — Roster + Events scenes (Scenes 02, 04)
Both reuse Phase A primitives heavily — no new heavy lifting expected. Roster reuses the hero parachute SVG. Events reuses smoke particles and shake helper.

**Validation:** Test event card sign-up at 47/100, 75/100, 90/100, 100/100 — all states must look correct.

### Phase E — Store + Giveaways (Scenes 05, 06)
The crate animations require new SVG art (wooden crate, mythic crate). Use simple geometric SVGs in Silent Hell colors — no need to commission art.

**Validation:** Airdrop plays once per session. Giveaway open is unrepeatable per giveaway per user.

### Phase F — Footer, transitions, 404, loading (Scenes 07-10)
Lighter scenes. Should go fast if Phases A-E are solid.

**Validation:** Click between every page in the app and verify the spectator-cam transition. Hit a bad URL and verify the knocked-down page. Throttle network in DevTools to verify the loading state.

After each phase: run typecheck, lint, build, and Lighthouse. Performance score must stay ≥90 even with all animations enabled (test on the homepage which has Hero + lots of below-the-fold scenes lazy-loaded).

## 7. Quality bar

Same as `SPEC.md` §10, plus:

- **No `any`** in animation code — particle types, GSAP refs, all typed
- **Memory leaks:** every component using particles must `cancelAnimationFrame` and clear canvas in cleanup
- **GSAP cleanup:** every component creating timelines must store the timeline in a ref and call `.kill()` in unmount
- **Tests:** Vitest unit tests for particle system math (spawn rate, decay, bounds), `useFirstVisit`, `useReducedMotion`. Playwright e2e test that verifies hero plays once and not twice.
- **Lighthouse Performance ≥90** with animations enabled — non-negotiable. If a scene drops it below, optimize particle counts before cutting the scene.
- **Mobile real-device test** — don't trust DevTools throttling alone for the final pass

## 8. What this spec does not change

For total clarity, none of the following are touched by this work:

- Database schema, RLS policies, server actions
- The Yalidine integration
- Auth, admin dashboard CRUD operations, order processing
- COD checkout flow
- Liquipedia seeder
- i18n (en/ar) — all animation copy must still go through `next-intl` translation files
- Existing public site sections render — animations wrap or extend them, never replace them

If you find yourself rewriting an existing component to add animations, **stop**. Wrap it in an `AnimatedScene` component or extend it with composition. The animation layer is additive.

## 9. Hand-off checklist

Before declaring this work complete:

- [ ] Both reference prototypes have been opened and watched at least 5 times each
- [ ] Phase A foundation modules have unit tests
- [ ] All 10 scenes built, each tested on desktop Chrome, Firefox, Safari, and a real Android phone
- [ ] All 10 scenes have a verified reduced-motion fallback
- [ ] Lighthouse Performance ≥ 90 on homepage with all animations enabled
- [ ] Build, typecheck, lint pass with zero warnings
- [ ] No leaked RAF loops (verified by Chrome DevTools Performance recording — only the active section's RAF should be running)
- [ ] Hero first-visit logic works correctly with localStorage cleared
- [ ] Per-phase summary written for human review
