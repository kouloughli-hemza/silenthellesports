export default function GiveawaySlugLoading() {
  return (
    <div
      className="grain relative overflow-hidden"
      style={{ background: "var(--black)", minHeight: "70vh" }}
      aria-busy
      aria-live="polite"
    >
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 70% 50%, rgba(230,0,19,0.18), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-[1400px] px-6 pt-28 pb-12 md:px-10 md:pt-36">
        <div
          className="skeleton-pulse h-3 w-32"
          style={{ background: "rgba(245,240,232,0.18)" }}
        />
        <div className="mt-8 grid items-end gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div
              className="skeleton-pulse h-3 w-40"
              style={{ background: "rgba(230,0,19,0.4)" }}
            />
            <div
              className="skeleton-pulse mt-5 h-12 w-full md:h-16"
              style={{ background: "var(--ash-1)" }}
            />
            <div
              className="skeleton-pulse mt-3 h-4 w-3/4"
              style={{ background: "var(--ash-1)" }}
            />
            <div className="mt-6 flex gap-3">
              <div
                className="skeleton-pulse h-7 w-24"
                style={{ background: "var(--ash-1)" }}
              />
              <div
                className="skeleton-pulse h-7 w-32"
                style={{ background: "var(--ash-1)" }}
              />
            </div>
          </div>
          <div
            className="skeleton-pulse aspect-[4/3]"
            style={{ background: "var(--ash-3)" }}
          />
        </div>

        <div
          className="mt-10 grid grid-cols-4 gap-px"
          style={{ background: "rgba(230,0,19,0.4)" }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton-pulse h-16"
              style={{ background: "var(--ash-3)" }}
            />
          ))}
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
