interface PlaceholderImageProps {
  label: string;
  aspect?: string;
  grayscale?: boolean;
  redLight?: boolean;
}

export function PlaceholderImage({
  label,
  aspect = "4/5",
  grayscale = false,
  redLight = true,
}: PlaceholderImageProps) {
  return (
    <div
      className="placeholder-stripe grain relative w-full overflow-hidden"
      style={{
        aspectRatio: aspect,
        filter: grayscale ? "grayscale(1) contrast(1.1)" : "none",
      }}
      aria-label={label}
      role="img"
    >
      {redLight ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 70% 30%, rgba(230,0,19,0.35) 0%, transparent 60%)",
            mixBlendMode: "screen",
          }}
        />
      ) : null}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase opacity-50">
          {label}
        </span>
      </div>
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
    </div>
  );
}
