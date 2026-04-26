export default function GiveawaysLoading() {
  return (
    <div
      className="grain relative overflow-hidden"
      style={{ background: "var(--black)", minHeight: "60vh" }}
      aria-busy
      aria-live="polite"
    >
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 80% 50%, rgba(230,0,19,0.18), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-[1600px] px-6 py-24 md:px-10 md:py-32">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div className="w-2/3 max-w-xl">
            <div
              className="skeleton-pulse h-3 w-40"
              style={{ background: "rgba(230,0,19,0.4)" }}
            />
            <div
              className="skeleton-pulse mt-5 h-16 w-full md:h-24"
              style={{ background: "var(--ash-1)" }}
            />
          </div>
          <div className="hidden md:block">
            <div
              className="skeleton-pulse h-3 w-32"
              style={{ background: "rgba(245,240,232,0.1)" }}
            />
            <div
              className="skeleton-pulse mt-2 h-10 w-40"
              style={{ background: "var(--ash-1)" }}
            />
          </div>
        </div>

        <div
          className="grid grid-cols-4 gap-px"
          style={{ background: "rgba(230,0,19,0.4)" }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton-pulse h-20"
              style={{ background: "var(--ash-3)" }}
            />
          ))}
        </div>

        <div
          className="mt-px grid lg:grid-cols-[1.1fr_1fr]"
          style={{
            background: "var(--ash-1)",
            border: "1px solid rgba(230,0,19,0.25)",
          }}
        >
          <div
            className="skeleton-pulse aspect-[4/3] lg:aspect-auto lg:min-h-[480px]"
            style={{ background: "var(--ash-3)" }}
          />
          <div className="space-y-3 p-7 md:p-10">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton-pulse h-14 w-full"
                style={{ background: "var(--ash-3)" }}
              />
            ))}
            <div
              className="skeleton-pulse mt-6 h-12 w-full"
              style={{ background: "rgba(230,0,19,0.4)" }}
            />
          </div>
        </div>
      </div>

      <style>{`
        .skeleton-pulse {
          animation: sh-skel 1.4s ease-in-out infinite;
        }
        @keyframes sh-skel {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}
