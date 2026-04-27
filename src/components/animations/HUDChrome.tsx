"use client";

// Reusable HUD chrome — bracket corners + sector readout + LIVE indicator.
// Used by HeroPlaneDrop and TrophyWinner. Pure presentation, no animation
// logic — scenes that need to fade brackets in target them by data attrs.

interface HUDChromeProps {
  sector?: string;
  context?: string;
  showLive?: boolean;
  className?: string;
}

export function HUDChrome({
  sector = "SECTOR 01 // INSERTION",
  context = "PUBG MOBILE // RANKED",
  showLive = true,
  className,
}: HUDChromeProps) {
  return (
    <div className={className} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <Bracket position="tl" />
      <Bracket position="tr" />
      <Bracket position="bl" />
      <Bracket position="br" />
      <div
        data-hud="tl"
        className="font-mono"
        style={{
          position: "absolute",
          top: 14,
          left: 16,
          fontSize: 9,
          letterSpacing: "0.3em",
          color: "var(--bone)",
          opacity: 0,
        }}
      >
        {sector}
      </div>
      {showLive ? (
        <div
          data-hud="tr"
          className="font-mono"
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            fontSize: 9,
            letterSpacing: "0.3em",
            color: "var(--hell-red)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: 0,
          }}
        >
          <span className="live-dot" /> LIVE
        </div>
      ) : null}
      <div
        data-hud="bl"
        className="font-mono"
        style={{
          position: "absolute",
          bottom: 14,
          left: 16,
          fontSize: 9,
          letterSpacing: "0.3em",
          color: "var(--bone)",
          opacity: 0,
        }}
      >
        {context}
      </div>
    </div>
  );
}

function Bracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const base: React.CSSProperties = {
    position: "absolute",
    width: 22,
    height: 22,
    border: "1.5px solid var(--hell-red)",
    opacity: 0,
  };
  const corner: Record<typeof position, React.CSSProperties> = {
    tl: { top: 8, left: 8, borderRight: "none", borderBottom: "none" },
    tr: { top: 8, right: 8, borderLeft: "none", borderBottom: "none" },
    bl: { bottom: 8, left: 8, borderRight: "none", borderTop: "none" },
    br: { bottom: 8, right: 8, borderLeft: "none", borderTop: "none" },
  };
  return <div data-bracket={position} style={{ ...base, ...corner[position] }} />;
}
