"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ALGERIAN_PHONE_RE, fail, ok, type Result } from "@/types/domain";
import type { Update } from "@/types/database";

const Email = z.string().email().max(254);
const Password = z.string().min(8).max(72);

const SignInSchema = z.object({
  email: Email,
  password: Password,
});

const SignUpSchema = z.object({
  email: Email,
  password: Password,
  full_name: z.string().min(2).max(80).optional(),
});

const ResetSchema = z.object({
  email: Email,
});

export async function signInAction(formData: FormData): Promise<Result<{ redirectTo: string }>> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return fail("Invalid email or password format.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return fail("Invalid credentials.");

  return ok({ redirectTo: "/account" });
}

export async function signUpAction(
  formData: FormData,
): Promise<Result<{ signedIn: boolean; message: string }>> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name") ?? undefined,
  });
  if (!parsed.success) {
    return fail("Email or password didn't pass validation. Use 8+ chars for password.");
  }

  const supabase = await createClient();
  const { data: signUpData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: parsed.data.full_name ? { full_name: parsed.data.full_name } : undefined,
    },
  });
  if (error) return fail(error.message);

  // If Supabase returned a session, the user is signed in already (email
  // confirmations are disabled). Otherwise — confirmations are on — the
  // explicit signInWithPassword below also fails until they verify, so we
  // fall back to a "check your inbox" message.
  if (signUpData.session) {
    return ok({ signedIn: true, message: "Signed in." });
  }

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (!signInErr) {
    return ok({ signedIn: true, message: "Signed in." });
  }
  return ok({
    signedIn: false,
    message: "Account created. Check your inbox to confirm your email.",
  });
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// Returns the Google OAuth URL the client should navigate to. Supabase
// handles the back-and-forth; our /auth/callback route swaps the code for
// a session cookie and bounces to `next` (or /account if missing).
export async function signInWithGoogleAction(
  next?: string,
): Promise<Result<{ url: string }>> {
  const supabase = await createClient();
  const h = await headers();
  const origin =
    h.get("origin") ?? h.get("x-forwarded-host") ?? "http://localhost:3000";
  const base = origin.startsWith("http") ? origin : `https://${origin}`;
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/account";
  const redirectTo = `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      // Force Google's account chooser so users on shared devices see who
      // they're signing in as.
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data?.url) return fail("Couldn't start Google sign-in.");
  return ok({ url: data.url });
}

const UpdateProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine(
      (v) => v === undefined || ALGERIAN_PHONE_RE.test(v),
      "Phone must be Algerian format (0[5/6/7]XXXXXXXX).",
    ),
});

export async function updateProfileAction(
  formData: FormData,
): Promise<Result<{ message: string }>> {
  const parsed = UpdateProfileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") ?? undefined,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid input.";
    return fail(first);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("You're signed out — sign in again to update your profile.");

  // Build the patch against the generated Update type so we still get
  // compile-time field-name and value-type checking.
  const patch: Update<"profiles"> = {
    full_name: parsed.data.full_name,
    phone: parsed.data.phone ?? null,
  };
  // Supabase ssr's cookie-bound client collapses .update()'s parameter to
  // `never` because of how Schema flows through RejectExcessProperties; the
  // value is still typechecked above. Cast just past the generic.
  const { error } = await supabase
    .from("profiles")
    .update(patch as never)
    .eq("id", user.id);

  if (error) return fail("Couldn't save profile. Try again in a moment.");

  revalidatePath("/account");
  revalidatePath("/en/account");
  revalidatePath("/ar/account");
  return ok({ message: "Profile saved." });
}

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<Result<{ message: string }>> {
  const parsed = ResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return fail("Enter a valid email.");

  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? h.get("x-forwarded-host") ?? "http://localhost:3000";
  const redirectTo = `${origin.startsWith("http") ? origin : `https://${origin}`}/auth/callback`;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });
  if (error) return fail(error.message);
  return ok({ message: "If that email exists, a reset link is on its way." });
}
