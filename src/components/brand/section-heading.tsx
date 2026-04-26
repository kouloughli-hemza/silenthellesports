import type { ReactNode } from "react";

interface SectionHeadingProps {
  label: string;
  title: ReactNode;
  subtitle?: string;
  align?: "left" | "center";
}

export function SectionHeading({ label, title, subtitle, align = "left" }: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mb-12 text-center" : "mb-12"}>
      <div className={align === "center" ? "flex justify-center" : ""}>
        <span className="section-label">{label}</span>
      </div>
      <h2
        className="font-display mt-4 text-5xl leading-[0.9] font-black tracking-tight uppercase md:text-7xl"
        style={{ color: "var(--bone)" }}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className="mt-4 max-w-xl text-base md:text-lg"
          style={{
            color: "rgba(245,240,232,0.6)",
            marginLeft: align === "center" ? "auto" : 0,
            marginRight: align === "center" ? "auto" : 0,
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
