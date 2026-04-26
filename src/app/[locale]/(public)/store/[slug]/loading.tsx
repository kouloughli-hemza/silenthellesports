export default function ProductDetailLoading() {
  return (
    <section
      className="grain relative py-16 md:py-24"
      style={{ background: "var(--ash-3)" }}
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div
          className="h-3 w-40 animate-pulse"
          style={{ background: "rgba(230,0,19,0.4)" }}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* gallery skeleton */}
          <div className="space-y-3">
            <div
              className="notch aspect-[4/5] w-full animate-pulse"
              style={{
                background: "var(--ash-1)",
                border: "1px solid rgba(230,0,19,0.25)",
              }}
            />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="notch-sm aspect-square animate-pulse"
                  style={{
                    background: "var(--ash-1)",
                    border: "1px solid rgba(245,240,232,0.06)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* info skeleton */}
          <div className="space-y-5">
            <div
              className="h-3 w-32 animate-pulse"
              style={{ background: "rgba(230,0,19,0.4)" }}
            />
            <div
              className="h-12 w-3/4 animate-pulse md:h-16"
              style={{ background: "rgba(245,240,232,0.08)" }}
            />
            <div
              className="h-8 w-40 animate-pulse"
              style={{ background: "rgba(230,0,19,0.25)" }}
            />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3 w-full animate-pulse"
                  style={{ background: "rgba(245,240,232,0.06)" }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-12 animate-pulse"
                  style={{
                    background: "var(--ash-1)",
                    border: "1px solid rgba(245,240,232,0.06)",
                  }}
                />
              ))}
            </div>
            <div
              className="h-12 w-full animate-pulse"
              style={{ background: "rgba(230,0,19,0.4)" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
