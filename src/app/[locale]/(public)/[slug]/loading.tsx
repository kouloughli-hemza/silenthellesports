import { RespawnLoader } from "@/components/scenes/RespawnLoader";

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
      <RespawnLoader />

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
