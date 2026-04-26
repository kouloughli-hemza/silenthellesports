// Player detail — loading skeleton.
// Mirrors the page layout: back link, hero band, sections.

export default function PlayerLoading() {
  return (
    <article style={{ background: "var(--black)" }}>
      {/* Back link skeleton */}
      <div className="mx-auto max-w-[1400px] px-6 pt-24 md:px-10 md:pt-32">
        <div
          className="placeholder-stripe h-3 w-32 animate-pulse"
          style={{ border: "1px solid rgba(230,0,19,0.4)" }}
        />
      </div>

      {/* Hero band skeleton */}
      <section className="grain mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,420px)_1fr] md:items-end">
          {/* portrait */}
          <div
            className="notch animate-pulse overflow-hidden"
            style={{
              background: "var(--ash-1)",
              border: "1px solid rgba(230,0,19,0.25)",
            }}
          >
            <div
              className="placeholder-stripe relative w-full"
              style={{ aspectRatio: "4/5" }}
            >
              <Reticle />
            </div>
          </div>

          {/* identity */}
          <div className="animate-pulse">
            <div className="flex gap-3">
              <div
                className="placeholder-stripe h-6 w-16"
                style={{ border: "1px solid rgba(230,0,19,0.4)" }}
              />
              <div className="placeholder-stripe h-4 w-24" />
            </div>
            <div className="placeholder-stripe mt-5 h-16 w-3/4 md:h-24" />
            <div className="placeholder-stripe mt-4 h-4 w-1/2" />
            <div className="placeholder-stripe mt-2 h-4 w-1/3" />

            {/* stats grid skeleton */}
            <div
              className="mt-8 grid grid-cols-3 gap-px"
              style={{ background: "rgba(230,0,19,0.25)" }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="p-5"
                  style={{ background: "var(--ash-3)" }}
                >
                  <div className="placeholder-stripe h-3 w-12" />
                  <div className="placeholder-stripe mt-3 h-8 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bio block skeleton */}
      <section className="mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-16">
        <div
          className="placeholder-stripe h-4 w-24 animate-pulse"
          style={{ border: "1px solid rgba(230,0,19,0.4)" }}
        />
        <div
          className="notch-sm mt-6 animate-pulse p-6 md:p-8"
          style={{
            background: "var(--ash-3)",
            border: "1px solid rgba(245,240,232,0.08)",
          }}
        >
          <div className="placeholder-stripe h-4 w-full" />
          <div className="placeholder-stripe mt-3 h-4 w-11/12" />
          <div className="placeholder-stripe mt-3 h-4 w-9/12" />
        </div>
      </section>

      {/* Gear grid skeleton */}
      <section className="grain mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-24">
        <div
          className="placeholder-stripe h-4 w-40 animate-pulse"
          style={{ border: "1px solid rgba(230,0,19,0.4)" }}
        />
        <div
          className="placeholder-stripe mt-4 h-12 w-2/3 animate-pulse md:h-20"
          style={{ border: "1px solid rgba(230,0,19,0.25)" }}
        />
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="notch-sm animate-pulse"
              style={{
                background: "var(--ash-1)",
                border: "1px solid rgba(230,0,19,0.25)",
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div
                className="placeholder-stripe relative w-full"
                style={{ aspectRatio: "1/1" }}
              >
                <Reticle />
              </div>
              <div className="p-3">
                <div className="placeholder-stripe h-4 w-3/4" />
                <div className="placeholder-stripe mt-2 h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
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
