import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const config: NextConfig = {
  // Disabled because React StrictMode's dev-only double-invocation of effects
  // races against GSAP timelines (kills + rebuilds the cinematic mid-frame),
  // freezing the hero animation in dev. Production doesn't run StrictMode.
  reactStrictMode: false,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Default is 1 MB — too small for player portraits / event banners /
      // product photos uploaded straight from a phone. Raise to 8 MB so
      // typical mobile JPEGs (4–6 MB) go through. Action handlers that touch
      // user-supplied bytes still need to validate type/size on their end.
      bodySizeLimit: "8mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      // PUBG map images for the seeded tactic boards. Replace with admin
      // uploads to your own Supabase bucket whenever you want to detach.
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      // Hero gallery uses Unsplash photos as static placeholders until the
      // admin gallery uploader ships. Safe to remove once content is moving
      // through Supabase storage.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default withNextIntl(config);
