export default function CmsPageLoading() {
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
            "radial-gradient(ellipse 60% 40% at 30% 60%, rgba(230,0,19,0.14), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-6 pt-28 pb-12 md:px-10 md:pt-36">
        <div
          className="skeleton-pulse h-3 w-40"
          style={{ background: "rgba(230,0,19,0.4)" }}
        />
        <div
          className="skeleton-pulse mt-5 h-12 w-3/4 md:h-16"
          style={{ background: "var(--ash-1)" }}
        />
      </div>

      <div
        className="relative mx-auto mt-12 max-w-3xl space-y-4 px-6 md:px-10"
        style={{ color: "var(--ash-3)" }}
      >
        {[100, 95, 88, 92, 60, 78, 84].map((w, i) => (
          <div
            key={i}
            className="skeleton-pulse h-4"
            style={{ width: `${w}%`, background: "var(--ash-1)" }}
          />
        ))}
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
