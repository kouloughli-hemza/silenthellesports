// Supabase session refresh — runs in the Next.js middleware so the user's
// auth cookie stays fresh.
//
// Performance note: anonymous visitors have no Supabase session cookies, so
// running getUser() for them just adds latency + a Set-Cookie response header
// (which prevents Vercel CDN caching of the page). We early-return when no
// auth cookies are present and only refresh when we know there's a session
// to keep alive.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";
import { getPublicEnv } from "@/lib/env";

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) return true;
    if (c.name.startsWith("sb-") && c.name.endsWith("-auth-token-code-verifier"))
      return true;
  }
  return false;
}

export async function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  // Anonymous request — nothing to refresh, leave the response cacheable.
  if (!hasSupabaseAuthCookie(request)) return response;

  const env = getPublicEnv();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}
