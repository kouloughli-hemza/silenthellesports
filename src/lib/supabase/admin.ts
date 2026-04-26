// Service-role Supabase client. BYPASSES RLS.
// SERVER-ONLY. Never import from a client component or any code shipped to the browser.
// Use for: admin mutations after server-side role check, webhook handlers, the seeder.

import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getServerEnv } from "@/lib/env";

let cached: SupabaseClient<Database> | null = null;

export function createAdminClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const env = getServerEnv();
  cached = createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return cached;
}
