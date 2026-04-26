import "server-only";

import { redirect } from "next/navigation";
import { isAdmin, getSessionUser, getProfile } from "@/lib/auth/session";
import type { Profile } from "@/types/domain";

// Server-side admin gate. Use at the top of every admin page + server action.
// Does NOT trust the client. Combined with RLS this is a 2-layer defense.
export async function requireAdmin(): Promise<Profile> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") redirect("/account");
  return profile;
}

export { isAdmin };
