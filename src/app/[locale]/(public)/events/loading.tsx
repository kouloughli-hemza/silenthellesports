// Events index — loading skeleton.
// Mirrors the page grid: heading + 4-up event cards.

export default function EventsLoading() {
  return (
    <section
      className="grain relative py-24 md:py-32"
      style={{ background: "var(--black)" }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        {/* heading skeleton */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-4">
            <div
              className="placeholder-stripe h-4 w-40 animate-pulse"
              style={{ border: "1px solid rgba(230,0,19,0.4)" }}
            />
            <div
              className="placeholder-stripe h-16 w-72 animate-pulse md:h-24 md:w-[28rem]"
              style={{ border: "1px solid rgba(230,0,19,0.25)" }}
            />
          </div>
          <div
            className="placeholder-stripe h-10 w-44 animate-pulse"
            style={{ border: "1px solid rgba(230,0,19,0.25)" }}
          />
        </div>

        {/* grid skeleton */}
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <EventCardSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EventCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="notch animate-pulse p-6"
      style={{
        background: "var(--ash-1)",
        border: "1px solid rgba(230,0,19,0.25)",
        animationDelay: `${index * 80}ms`,
      }}
      aria-hidden
    >
      <div className="mb-5 space-y-3">
        <div className="placeholder-stripe h-3 w-24" />
        <div className="placeholder-stripe h-10 w-40" />
        <div className="placeholder-stripe h-3 w-48" />
      </div>

      <div
        className="mb-5 grid grid-cols-3 gap-px"
        style={{ background: "rgba(245,240,232,0.06)" }}
      >
        {Array.from({ length: 3 }).map((__, i) => (
          <div
            key={i}
            className="px-3 py-4"
            style={{ background: "var(--ash-3)" }}
          >
            <div className="placeholder-stripe h-2 w-12" />
            <div className="placeholder-stripe mt-2 h-4 w-16" />
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-end justify-between">
        <div className="space-y-2">
          <div className="placeholder-stripe h-2 w-16" />
          <div className="placeholder-stripe h-8 w-24" />
        </div>
        <div className="space-y-2 text-right">
          <div className="placeholder-stripe ml-auto h-2 w-12" />
          <div className="placeholder-stripe ml-auto h-8 w-20" />
        </div>
      </div>

      <div className="slot-bar mb-5">
        <div style={{ width: "30%" }} />
      </div>

      <div
        className="placeholder-stripe h-12 w-full"
        style={{ borderTop: "1px solid rgba(230,0,19,0.4)" }}
      />
    </div>
  );
}
