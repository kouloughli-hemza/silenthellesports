"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Top progress bar shown immediately on internal link clicks until the
// pathname changes. Gives the user instant feedback that their click
// registered, especially in dev where route compilation adds 1-2s.
export function NavProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const lastPath = useRef(pathname);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect navigation completion: pathname changed.
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      finish();
    }
  }, [pathname]);

  // Capture-phase click listener catches every internal link/form submit.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        // skip same-page anchor jumps
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        return;
      }
      start();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // start/finish only mutate refs and call stable setState, so omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function start() {
    setActive(true);
    setProgress(8);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setProgress((p) => {
        // ease toward 90% — never reach it until finish()
        const next = p + Math.max(0.5, (90 - p) * 0.06);
        return Math.min(90, next);
      });
    }, 120);
    // Safety: cap any single navigation at 8s so the bar can't get stuck.
    if (safetyRef.current) clearTimeout(safetyRef.current);
    safetyRef.current = setTimeout(finish, 8000);
  }

  function finish() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
    setProgress(100);
    if (finishRef.current) clearTimeout(finishRef.current);
    finishRef.current = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 220);
  }

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (finishRef.current) clearTimeout(finishRef.current);
      if (safetyRef.current) clearTimeout(safetyRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 9999,
        pointerEvents: "none",
        opacity: active ? 1 : 0,
        transition: "opacity 200ms ease",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, var(--hell-red), var(--ember))",
          boxShadow: "0 0 12px var(--hell-red), 0 0 6px var(--ember)",
          transition: "width 180ms ease-out",
        }}
      />
    </div>
  );
}
