// Lightweight client-fetch endpoint for the per-user state the TopBar needs.
// Splitting auth + cart out of the public layout means the home page can be
// served from the CDN cache; the TopBar then catches up on hydration.

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { readCartCount } from "@/lib/cart/detail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const [user, cartCount] = await Promise.all([getSessionUser(), readCartCount()]);
  const body = {
    signedIn: Boolean(user),
    cartCount,
  };
  return NextResponse.json(body, {
    headers: {
      // Per-user data — tell every cache to leave it alone.
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
