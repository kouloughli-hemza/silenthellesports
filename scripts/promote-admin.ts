// One-off: promote a user (by email) to admin role.
// Usage: npx tsx --conditions=react-server scripts/promote-admin.ts <email>

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { createAdminClient } from "@/lib/supabase/admin";

async function main(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: tsx scripts/promote-admin.ts <email>");
    process.exit(1);
  }

  const supabase = createAdminClient();

  const { data: profile, error: lookupErr } = await supabase
    .from("profiles")
    .select("id, email, role")
    .ilike("email", email)
    .maybeSingle();

  if (lookupErr) {
    console.error("[promote] lookup error:", lookupErr.message);
    process.exit(1);
  }
  if (!profile) {
    console.error(`[promote] no profile found for ${email}. Has the user signed up?`);
    process.exit(1);
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ role: "admin" } as never)
    .eq("id", (profile as { id: string }).id);

  if (updateErr) {
    console.error("[promote] update error:", updateErr.message);
    process.exit(1);
  }

  console.log(`[promote] ✓ ${email} is now admin`);
}

main().catch((err: unknown) => {
  console.error("[promote] fatal:", err);
  process.exit(1);
});
