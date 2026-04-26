// Stateless server-side Supabase client using the anon key.
// No cookies, so safe to call from `generateStaticParams` and other
// build-time contexts where the request scope isn't available.
// All queries are RLS-bound to "public read" policies.

import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getPublicEnv } from "@/lib/env";

let cached: SupabaseClient<Database> | null = null;

export function createPublicClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const env = getPublicEnv();
  cached = createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return cached;
}
