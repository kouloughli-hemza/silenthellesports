"use client";

import { forwardRef, type ReactNode } from "react";

interface ShakeWrapperProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// Forwards a ref to a wrapping div so callers can pass it to shakeStage().
// Sets will-change: transform so the GPU keeps the layer composited.
export const ShakeWrapper = forwardRef<HTMLDivElement, ShakeWrapperProps>(
  function ShakeWrapper({ children, className, style }, ref) {
    return (
      <div
        ref={ref}
        className={className}
        style={{ willChange: "transform", ...style }}
      >
        {children}
      </div>
    );
  },
);
