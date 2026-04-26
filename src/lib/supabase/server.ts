// Server-side Supabase client (RSC, route handlers, server actions).
// Uses cookies to forward the user's auth session — RLS still applies.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getPublicEnv } from "@/lib/env";

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

export async function createClient() {
  const cookieStore = await cookies();
  const env = getPublicEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — ignore.
            // The middleware refreshes the session.
          }
        },
      },
    },
  );
}
