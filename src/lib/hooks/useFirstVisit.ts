"use client";

import { useEffect, useState } from "react";

// SSR-safe first-visit gate backed by localStorage. The initial render is
// always `firstVisit: false` to keep the server HTML matching the client; the
// effect re-syncs on mount and the parent typically waits for the
// `firstVisitResolved` flag before triggering its cinematic.
export interface FirstVisitState {
  firstVisit: boolean;
  resolved: boolean;
  markSeen: () => void;
  resetForTesting: () => void;
}

export function useFirstVisit(key: string): FirstVisitState {
  const [firstVisit, setFirstVisit] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let initial = true;
    try {
      initial = window.localStorage.getItem(key) === null;
    } catch {
      // privacy mode / quota — pretend it's a return visit so we don't loop the cinematic.
      initial = false;
    }
    setFirstVisit(initial);
    setResolved(true);
  }, [key]);

  const markSeen = (): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      // ignore
    }
    setFirstVisit(false);
  };

  const resetForTesting = (): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setFirstVisit(true);
  };

  return { firstVisit, resolved, markSeen, resetForTesting };
}
