import { Cairo, Inter, JetBrains_Mono, Reem_Kufi, Saira_Condensed } from "next/font/google";

export const sairaCondensed = Saira_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-saira",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const reemKufi = Reem_Kufi({
  subsets: ["arabic", "latin"],
  weight: ["500", "700"],
  variable: "--font-reem-kufi",
  display: "swap",
});

export const fontVariables = [
  sairaCondensed.variable,
  inter.variable,
  jetbrainsMono.variable,
  cairo.variable,
  reemKufi.variable,
].join(" ");
