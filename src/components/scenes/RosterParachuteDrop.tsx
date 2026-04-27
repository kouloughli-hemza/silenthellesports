"use client";

// Scene 02 — Roster parachute drop.
//
// Side-effect-only client component. Mounted inside RosterStrip (a server
// component) — it reads the existing card DOM nodes on mount, sets initial
// transform to translateY(-200%) opacity:0 + a chute SVG above each, then
// runs a staggered drop on first viewport entry of the strip container.
//
// Reduced motion: leave cards as-is (they render in their final positions).

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const CARD_SELECTOR = "[data-roster-card]";

export function RosterParachuteDrop() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Find the parent section so we can scope card queries.
    const section = sentinel.closest("section");
    if (!section) return;
    const cards = Array.from(section.querySelectorAll<HTMLElement>(CARD_SELECTOR));
    if (cards.length === 0) return;

    // Pre-stage: cards above viewport, transparent. Insert a parachute span
    // inside each card (positioned absolutely above) so GSAP can animate it.
    const chutes: HTMLDivElement[] = [];
    cards.forEach((card) => {
      card.style.willChange = "transform, opacity";
      gsap.set(card, { y: -window.innerHeight * 0.6, opacity: 0 });
      const chute = document.createElement("div");
      chute.setAttribute("aria-hidden", "true");
      chute.dataset.parachute = "1";
      chute.style.cssText = [
        "position:absolute",
        "top:-72px",
        "left:50%",
        "transform:translate(-50%, 0) scaleY(0)",
        "transform-origin:50% 100%",
        "width:100px",
        "height:60px",
        "pointer-events:none",
        "z-index:2",
      ].join(";");
      chute.innerHTML = `
        <svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="rpd-canopy" cx="0.5" cy="0.7">
              <stop offset="0%" stop-color="#FF4500"/>
              <stop offset="55%" stop-color="#E60013"/>
              <stop offset="100%" stop-color="#5a000c"/>
            </radialGradient>
          </defs>
          <path d="M2 36 Q50 -8 98 36 L92 36 L84 22 L74 36 L64 22 L50 36 L36 22 L26 36 L16 22 L8 36 Z" fill="url(#rpd-canopy)" stroke="#330006" stroke-width="0.5"/>
          <line x1="6" y1="36" x2="46" y2="58" stroke="#1a1a1a" stroke-width="0.6"/>
          <line x1="22" y1="36" x2="48" y2="58" stroke="#1a1a1a" stroke-width="0.6"/>
          <line x1="50" y1="36" x2="50" y2="58" stroke="#1a1a1a" stroke-width="0.6"/>
          <line x1="78" y1="36" x2="52" y2="58" stroke="#1a1a1a" stroke-width="0.6"/>
          <line x1="94" y1="36" x2="54" y2="58" stroke="#1a1a1a" stroke-width="0.6"/>
        </svg>
      `;
      // Force the card's positioning context so the chute lays out correctly.
      const computedPos = window.getComputedStyle(card).position;
      if (computedPos === "static") card.style.position = "relative";
      card.appendChild(chute);
      chutes.push(chute);
    });

    let triggered = false;
    const tweens: Array<{ kill: () => void }> = [];
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || triggered) continue;
          triggered = true;
          io.disconnect();
          // Run drop sequence
          cards.forEach((card, i) => {
            const chute = chutes[i];
            const delay = i * 0.25;
            if (chute) {
              tweens.push(
                gsap.to(chute, { scaleY: 1.1, duration: 0.25, ease: "back.out(2.5)", delay }),
              );
              tweens.push(
                gsap.to(chute, { scaleY: 1, duration: 0.15, ease: "power1.out", delay: delay + 0.25 }),
              );
              tweens.push(
                gsap.to(chute, { rotation: 4, duration: 0.6, ease: "sine.inOut", repeat: 3, yoyo: true, delay: delay + 0.4, transformOrigin: "50% 100%" }),
              );
              tweens.push(
                gsap.to(chute, { opacity: 0, duration: 0.4, ease: "power2.in", delay: delay + 1.4 }),
              );
            }
            tweens.push(
              gsap.to(card, {
                opacity: 1,
                y: 0,
                duration: 1.6,
                ease: "power2.out",
                delay,
                onComplete: () => {
                  card.style.willChange = "";
                  card.style.transform = "";
                },
              }),
            );
          });
        }
      },
      { rootMargin: "-80px" },
    );
    io.observe(section);

    return () => {
      io.disconnect();
      tweens.forEach((t) => t.kill());
      chutes.forEach((c) => c.remove());
    };
  }, [reduced]);

  return <div ref={sentinelRef} aria-hidden style={{ width: 0, height: 0 }} />;
}
