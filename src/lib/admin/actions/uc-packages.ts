"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, type Result } from "@/types/domain";
import type { Insert, Update } from "@/types/database";

const PackageSchema = z.object({
  uc_amount: z.coerce.number().int().positive().max(1_000_000),
  bonus_uc: z.coerce.number().int().min(0).max(1_000_000).default(0),
  price_dzd: z.coerce.number().positive().max(10_000_000),
  label: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  is_active: z.coerce.boolean().optional().default(true),
  display_order: z.coerce.number().int().min(0).max(10_000).default(0),
});

interface FormShape {
  get(name: string): FormDataEntryValue | null;
}

function readBoolean(formData: FormShape, key: string): boolean {
  const v = formData.get(key);
  if (v === null) return false;
  if (typeof v === "string") return v === "on" || v === "true" || v === "1";
  return false;
}

function parseFromForm(formData: FormData) {
  return PackageSchema.safeParse({
    uc_amount: formData.get("uc_amount"),
    bonus_uc: formData.get("bonus_uc") ?? 0,
    price_dzd: formData.get("price_dzd"),
    label: formData.get("label") ?? "",
    is_active: readBoolean(formData, "is_active"),
    display_order: formData.get("display_order") ?? 0,
  });
}

function revalidatePublic() {
  revalidatePath("/admin/uc-packages");
  revalidatePath("/en/uc-recharge");
  revalidatePath("/ar/uc-recharge");
}

export async function createUcPackageAction(
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = parseFromForm(formData);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid package data.");
  }

  const supabase = createAdminClient();
  const insert: Insert<"uc_packages"> = parsed.data;
  const { data, error } = await supabase
    .from("uc_packages")
    .insert(insert as never)
    .select("id")
    .single<{ id: string }>();
  if (error || !data) return fail(error?.message ?? "Couldn't create package.");

  await recordAudit({
    actorId: profile.id,
    action: "uc_package.create",
    entityType: "uc_package",
    entityId: data.id,
    after: { ...insert },
  });

  revalidatePublic();
  return ok({ id: data.id });
}

export async function updateUcPackageAction(
  id: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return fail("Invalid id.");

  const parsed = parseFromForm(formData);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid package data.");
  }

  const supabase = createAdminClient();
  const update: Update<"uc_packages"> = parsed.data;
  const { error } = await supabase
    .from("uc_packages")
    .update(update as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "uc_package.update",
    entityType: "uc_package",
    entityId: id,
    after: { ...update },
  });

  revalidatePublic();
  return ok({ id });
}

export async function deleteUcPackageAction(
  id: string,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return fail("Invalid id.");

  const supabase = createAdminClient();
  // If any requests reference this package, refuse delete and ask admin to
  // deactivate instead — preserves historical request integrity.
  const { count } = await supabase
    .from("uc_recharge_requests")
    .select("id", { count: "exact", head: true })
    .eq("package_id", id);
  if ((count ?? 0) > 0) {
    return fail(
      "This package is referenced by existing requests. Deactivate it instead of deleting.",
    );
  }

  const { error } = await supabase.from("uc_packages").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "uc_package.delete",
    entityType: "uc_package",
    entityId: id,
  });

  revalidatePublic();
  return ok({ id });
}
