import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

const intl = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const response = intl(request);
  return refreshSupabaseSession(request, response);
}

export const config = {
  // `auth` is excluded so OAuth callbacks land on /auth/callback without
  // the locale rewrite (Google + Supabase redirect to a fixed URL).
  matcher: "/((?!api|auth|_next|_vercel|.*\\..*).*)",
};
