// Account dashboard skeleton.

export default function AccountLoading() {
  return (
    <article
      className="grain relative pb-24 md:pb-32"
      style={{ background: "var(--black)" }}
      aria-busy="true"
      aria-live="polite"
    >
      <header
        className="pt-28 pb-10 md:pt-32 md:pb-14"
        style={{
          background:
            "linear-gradient(180deg, var(--ash-3) 0%, var(--black) 100%)",
          borderBottom: "1px solid rgba(230,0,19,0.25)",
        }}
      >
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div
            className="placeholder-stripe h-3 w-32 animate-pulse"
            style={{ border: "1px solid rgba(230,0,19,0.25)" }}
          />
          <div
            className="placeholder-stripe mt-4 h-12 w-72 animate-pulse md:h-16 md:w-[28rem]"
            style={{ border: "1px solid rgba(230,0,19,0.25)" }}
          />
          <div className="placeholder-stripe mt-4 h-3 w-40 animate-pulse" />
        </div>
      </header>

      <div className="mx-auto mt-10 grid max-w-[1400px] gap-10 px-6 md:mt-12 md:grid-cols-[1fr_360px] md:px-10">
        <div className="space-y-10">
          {[0, 1, 2].map((i) => (
            <section key={i} className="space-y-4">
              <div
                className="placeholder-stripe h-3 w-24 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
              <div className="grid gap-3">
                {[0, 1].map((j) => (
                  <div
                    key={j}
                    className="notch animate-pulse p-5"
                    style={{
                      background: "var(--ash-1)",
                      border: "1px solid rgba(245,240,232,0.06)",
                      animationDelay: `${(i * 2 + j) * 80}ms`,
                    }}
                  >
                    <div className="placeholder-stripe h-3 w-32" />
                    <div className="placeholder-stripe mt-2 h-6 w-48" />
                    <div className="placeholder-stripe mt-2 h-3 w-24" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside>
          <div
            className="notch p-6 animate-pulse"
            style={{ background: "var(--ash-1)" }}
          >
            <div className="placeholder-stripe h-3 w-24" />
            <div className="placeholder-stripe mt-5 h-10 w-full" />
            <div className="placeholder-stripe mt-3 h-10 w-full" />
            <div className="placeholder-stripe mt-3 h-10 w-full" />
            <div className="placeholder-stripe mt-5 h-12 w-full" />
          </div>
        </aside>
      </div>
    </article>
  );
}
