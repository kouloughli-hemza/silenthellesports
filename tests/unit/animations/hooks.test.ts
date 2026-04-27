import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFirstVisit } from "@/lib/hooks/useFirstVisit";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

describe("useFirstVisit", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns firstVisit=true on a fresh key", () => {
    const { result } = renderHook(() => useFirstVisit("sh:test-fresh"));
    expect(result.current.resolved).toBe(true);
    expect(result.current.firstVisit).toBe(true);
  });

  it("markSeen flips firstVisit to false and persists", () => {
    const { result, rerender } = renderHook(({ key }: { key: string }) => useFirstVisit(key), {
      initialProps: { key: "sh:test-mark" },
    });
    act(() => result.current.markSeen());
    expect(result.current.firstVisit).toBe(false);
    expect(window.localStorage.getItem("sh:test-mark")).toBe("1");

    // Second mount with same key should see firstVisit=false.
    rerender({ key: "sh:test-mark" });
    const { result: result2 } = renderHook(() => useFirstVisit("sh:test-mark"));
    expect(result2.current.firstVisit).toBe(false);
  });

  it("resetForTesting wipes the key", () => {
    window.localStorage.setItem("sh:test-reset", "1");
    const { result } = renderHook(() => useFirstVisit("sh:test-reset"));
    expect(result.current.firstVisit).toBe(false);
    act(() => result.current.resetForTesting());
    expect(window.localStorage.getItem("sh:test-reset")).toBeNull();
    expect(result.current.firstVisit).toBe(true);
  });

  it("survives localStorage write failure without throwing", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    const { result } = renderHook(() => useFirstVisit("sh:test-write-throws"));
    expect(() => act(() => result.current.markSeen())).not.toThrow();
    vi.restoreAllMocks();
  });
});

describe("useReducedMotion", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("returns false when matchMedia reports no preference", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when matchMedia reports reduce", () => {
    (window.matchMedia as unknown as ReturnType<typeof vi.fn>).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
