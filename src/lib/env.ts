// =============================================================================
// Silent Hell — environment access with strong typing
// Server-only secrets are accessed via getServerEnv(); never call from client.
// =============================================================================

import { z } from "zod";

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().min(1).default("http://localhost:54321"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("anon-placeholder"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

// Empty strings are treated as unset (many local .env workflows leave keys
// blank rather than deleting them).
const emptyToUndef = (v: unknown): unknown =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalStr = z.preprocess(emptyToUndef, z.string().optional());
const optionalEmail = z.preprocess(emptyToUndef, z.string().email().optional());

const ServerEnvSchema = PublicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default("service-role-placeholder"),
  YALIDINE_API_ID: optionalStr,
  YALIDINE_API_TOKEN: optionalStr,
  YALIDINE_FROM_WILAYA_CODE: z.coerce.number().int().min(1).max(58).default(16),
  RESEND_API_KEY: optionalStr,
  RESEND_FROM_EMAIL: z.string().default("Silent Hell <noreply@silenthellesports.com>"),
  ADMIN_BOOTSTRAP_EMAIL: optionalEmail,
});

export type PublicEnv = z.infer<typeof PublicEnvSchema>;
export type ServerEnv = z.infer<typeof ServerEnvSchema>;

let cachedPublic: PublicEnv | null = null;
let cachedServer: ServerEnv | null = null;

export function getPublicEnv(): PublicEnv {
  if (!cachedPublic) {
    cachedPublic = PublicEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
  }
  return cachedPublic;
}

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() called from the browser — leaks secrets");
  }
  if (!cachedServer) {
    cachedServer = ServerEnvSchema.parse(process.env);
  }
  return cachedServer;
}

export const yalidineConfigured = (): boolean => {
  const env = getServerEnv();
  return Boolean(env.YALIDINE_API_ID && env.YALIDINE_API_TOKEN);
};
