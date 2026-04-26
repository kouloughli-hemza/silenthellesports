import type { ReactNode } from "react";
import "@/styles/globals.css";

// The locale layout owns <html>/<body> + fonts + dir; this root layout
// is just a passthrough that Next.js requires to exist.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
