// Event detail — loading skeleton.
// Mirrors hero band + meta strip + body + side card.

export default function EventDetailLoading() {
  return (
    <article
      className="grain relative pb-24 md:pb-32"
      style={{ background: "var(--black)" }}
      aria-busy="true"
      aria-live="polite"
    >
      {/* hero placeholder */}
      <header className="relative overflow-hidden" style={{ background: "var(--ash-3)" }}>
        <div
          className="placeholder-stripe relative w-full animate-pulse"
          style={{ aspectRatio: "16/7", maxHeight: 520 }}
          aria-hidden
        >
          <div
            className="absolute top-6 left-6 h-7 w-28 animate-pulse"
            style={{ background: "rgba(230,0,19,0.5)" }}
          />
          <div
            className="absolute top-6 right-6 h-7 w-32 animate-pulse"
            style={{ background: "rgba(245,240,232,0.1)" }}
          />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-6 pt-10 md:px-10">
          <div
            className="placeholder-stripe h-3 w-32 animate-pulse"
            style={{ border: "1px solid rgba(230,0,19,0.4)" }}
          />
          <div
            className="placeholder-stripe mt-4 h-12 w-3/4 animate-pulse md:h-20"
            style={{ border: "1px solid rgba(230,0,19,0.25)" }}
          />
        </div>
      </header>

      <div className="mx-auto mt-10 grid max-w-[1400px] gap-10 px-6 md:mt-12 md:grid-cols-[1fr_360px] md:px-10">
        <div className="space-y-10">
          {/* meta strip */}
          <section
            className="grid grid-cols-2 gap-px md:grid-cols-4"
            style={{ background: "rgba(230,0,19,0.25)" }}
            aria-hidden
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="px-4 py-4"
                style={{ background: "var(--ash-3)" }}
              >
                <div className="placeholder-stripe h-2 w-16" />
                <div className="placeholder-stripe mt-2 h-5 w-24" />
                <div className="placeholder-stripe mt-2 h-2 w-20" />
              </div>
            ))}
          </section>

          {/* body */}
          <section className="space-y-3">
            <div className="placeholder-stripe h-3 w-32 animate-pulse" />
            <div className="placeholder-stripe h-4 w-full animate-pulse" />
            <div className="placeholder-stripe h-4 w-11/12 animate-pulse" />
            <div className="placeholder-stripe h-4 w-10/12 animate-pulse" />
          </section>

          {/* rules card */}
          <section
            className="notch animate-pulse p-6 md:p-8"
            style={{ background: "var(--ash-1)" }}
            aria-hidden
          >
            <div className="placeholder-stripe h-4 w-full" />
            <div className="placeholder-stripe mt-3 h-4 w-11/12" />
            <div className="placeholder-stripe mt-3 h-4 w-9/12" />
          </section>
        </div>

        {/* aside */}
        <aside>
          <div
            className="notch animate-pulse p-6"
            style={{ background: "var(--ash-1)" }}
            aria-hidden
          >
            <div
              className="grid grid-cols-2 gap-px"
              style={{ background: "rgba(245,240,232,0.06)" }}
            >
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="px-4 py-4"
                  style={{ background: "var(--ash-3)" }}
                >
                  <div className="placeholder-stripe h-2 w-16" />
                  <div className="placeholder-stripe mt-2 h-7 w-20" />
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2">
              <div className="placeholder-stripe h-3 w-1/3" />
              <div className="slot-bar">
                <div style={{ width: "30%" }} />
              </div>
            </div>
            <div
              className="placeholder-stripe mt-6 h-12 w-full"
              style={{ borderTop: "1px solid rgba(230,0,19,0.4)" }}
            />
          </div>
        </aside>
      </div>
    </article>
  );
}
