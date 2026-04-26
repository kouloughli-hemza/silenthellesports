import type { ReactNode } from "react";

interface ReticleProps {
  children: ReactNode;
  className?: string;
}

export function Reticle({ children, className }: ReticleProps) {
  return <div className={`reticle ${className ?? ""}`}>{children}</div>;
}
