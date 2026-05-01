import Image from "next/image";

interface PlayerPortraitProps {
  src: string | null | undefined;
  alt: string;
  fallbackLabel: string;
  aspect?: string;
  grayscale?: boolean;
  /** Hint for next/image's responsive sizes attribute. */
  sizes?: string;
  priority?: boolean;
}

// Renders a player photo inside the brand's notched portrait frame, with the
// same red corner brackets PlaceholderImage uses so cards stay visually
// consistent whether or not a photo is uploaded. Falls back to the
// placeholder treatment when src is empty.
export function PlayerPortrait({
  src,
  alt,
  fallbackLabel,
  aspect = "4/5",
  grayscale = false,
  sizes = "(max-width: 768px) 80vw, 280px",
  priority = false,
}: PlayerPortraitProps) {
  return (
    <div
      className="placeholder-stripe grain relative w-full overflow-hidden"
      style={{
        aspectRatio: aspect,
        background: "var(--ash-3)",
      }}
      aria-label={alt}
      role="img"
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          style={{
            // contain (not cover) so the player's face / full body isn't
            // cropped when the source aspect doesn't match the frame.
            objectFit: "contain",
            // Image lives over an --ash-3 background so any letterbox bars
            // read as part of the brand frame rather than transparent gaps.
            background: "var(--ash-3)",
            filter: grayscale
              ? "grayscale(0.7) contrast(1.05) brightness(0.9)"
              : "contrast(1.05) brightness(0.95)",
          }}
        />
      ) : (
        <>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 70% 30%, rgba(230,0,19,0.35) 0%, transparent 60%)",
              mixBlendMode: "screen",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase opacity-50">
              {fallbackLabel}
            </span>
          </div>
        </>
      )}
      {/* Red bracket overlay — sits on top of the image so cards still read as
          part of the brand grid even when the photo fills the frame. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-2 left-2 h-3 w-3 border-t-2 border-l-2"
        style={{ borderColor: "var(--hell-red)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-2 right-2 h-3 w-3 border-t-2 border-r-2"
        style={{ borderColor: "var(--hell-red)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2"
        style={{ borderColor: "var(--hell-red)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-2 bottom-2 h-3 w-3 border-r-2 border-b-2"
        style={{ borderColor: "var(--hell-red)" }}
      />
    </div>
  );
}
