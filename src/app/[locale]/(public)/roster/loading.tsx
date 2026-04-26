// Roster index — loading skeleton.
// Mirrors the page grid: heading + 4-up player cards.

export default function RosterLoading() {
  return (
    <section
      className="grain relative py-24 md:py-32"
      style={{ background: "var(--black)" }}
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        {/* heading skeleton */}
        <div className="mb-12">
          <div
            className="placeholder-stripe h-4 w-40 animate-pulse"
            style={{ border: "1px solid rgba(230,0,19,0.4)" }}
          />
          <div
            className="placeholder-stripe mt-4 h-16 w-3/4 animate-pulse md:h-24"
            style={{ border: "1px solid rgba(230,0,19,0.25)" }}
          />
        </div>

        {/* grid skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <PlayerCardSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlayerCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="notch animate-pulse"
      style={{
        background: "var(--ash-1)",
        border: "1px solid rgba(230,0,19,0.25)",
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* portrait area */}
      <div
        className="placeholder-stripe relative w-full"
        style={{ aspectRatio: "4/5" }}
      >
        <Reticle />
      </div>
      <div
        className="border-t p-4"
        style={{ borderColor: "rgba(230,0,19,0.25)" }}
      >
        <div className="placeholder-stripe h-6 w-2/3" />
        <div className="placeholder-stripe mt-2 h-3 w-1/2" />
        <div
          className="mt-3 grid grid-cols-2 gap-2 border-t pt-3"
          style={{ borderColor: "rgba(245,240,232,0.08)" }}
        >
          <div className="placeholder-stripe h-6" />
          <div className="placeholder-stripe h-6" />
        </div>
      </div>
    </div>
  );
}

function Reticle() {
  return (
    <>
      <div
        className="absolute top-2 left-2 h-3 w-3 border-t-2 border-l-2"
        style={{ borderColor: "var(--hell-red)" }}
      />
      <div
        className="absolute top-2 right-2 h-3 w-3 border-t-2 border-r-2"
        style={{ borderColor: "var(--hell-red)" }}
      />
      <div
        className="absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2"
        style={{ borderColor: "var(--hell-red)" }}
      />
      <div
        className="absolute right-2 bottom-2 h-3 w-3 border-r-2 border-b-2"
        style={{ borderColor: "var(--hell-red)" }}
      />
    </>
  );
}
