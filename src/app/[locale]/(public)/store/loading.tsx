export default function StoreLoading() {
  return (
    <section
      className="grain relative py-20 md:py-28"
      style={{ background: "var(--ash-3)" }}
      aria-busy
      aria-live="polite"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        {/* heading skeleton */}
        <div className="mb-10 space-y-4">
          <div
            className="h-3 w-40 animate-pulse"
            style={{ background: "rgba(230,0,19,0.4)" }}
          />
          <div
            className="h-12 w-3/4 animate-pulse md:h-16"
            style={{ background: "rgba(245,240,232,0.08)" }}
          />
        </div>

        {/* filter row skeleton */}
        <div
          className="notch mb-10 flex flex-wrap gap-3 p-5"
          style={{
            background: "var(--ash-1)",
            border: "1px solid rgba(230,0,19,0.18)",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-7 w-20 animate-pulse"
              style={{ background: "rgba(245,240,232,0.06)" }}
            />
          ))}
        </div>

        {/* product grid skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="notch aspect-[4/5] animate-pulse"
              style={{
                background: "var(--ash-1)",
                border: "1px solid rgba(245,240,232,0.04)",
              }}
            >
              <span className="sr-only">Loading product</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
