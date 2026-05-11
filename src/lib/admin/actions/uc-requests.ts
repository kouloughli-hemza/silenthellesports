"use server";

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, type Result } from "@/types/domain";
import type { Update } from "@/types/database";

const ALLOWED_DELIVERY_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const MAX_DELIVERY_BYTES = 5 * 1024 * 1024;

function revalidateBoth(requestNumber: string) {
  revalidatePath("/admin/uc-recharges");
  revalidatePath(`/admin/uc-recharges/${requestNumber}`);
  revalidatePath(`/en/uc-recharge/${requestNumber}`);
  revalidatePath(`/ar/uc-recharge/${requestNumber}`);
}

async function loadRequest(id: string) {
  if (!z.string().uuid().safeParse(id).success) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("uc_recharge_requests")
    .select("id, request_number, status")
    .eq("id", id)
    .maybeSingle<{ id: string; request_number: string; status: string }>();
  return data ?? null;
}

export async function markPaymentReceivedAction(
  id: string,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const existing = await loadRequest(id);
  if (!existing) return fail("Request not found.");
  if (!["pending"].includes(existing.status)) {
    return fail(`Cannot mark payment received from status "${existing.status}".`);
  }

  const supabase = createAdminClient();
  const update: Update<"uc_recharge_requests"> = { status: "payment_received" };
  const { error } = await supabase
    .from("uc_recharge_requests")
    .update(update as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "uc_request.payment_received",
    entityType: "uc_request",
    entityId: id,
  });
  revalidateBoth(existing.request_number);
  return ok({ id });
}

export async function markDeliveredAction(
  id: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const existing = await loadRequest(id);
  if (!existing) return fail("Request not found.");
  if (!["pending", "payment_received"].includes(existing.status)) {
    return fail(`Cannot deliver from status "${existing.status}".`);
  }

  // Optional: admin can attach an in-game delivery screenshot.
  let deliveryPath: string | null = null;
  const file = formData.get("delivery_screenshot");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_DELIVERY_BYTES) return fail("Screenshot exceeds 5 MB.");
    if (!ALLOWED_DELIVERY_MIME.has(file.type)) {
      return fail(`Unsupported screenshot type: ${file.type || "unknown"}.`);
    }
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    deliveryPath = `delivery/${id}/${randomUUID()}.${ext}`;
    const supabase = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadErr } = await supabase.storage
      .from("uc-proofs")
      .upload(deliveryPath, buffer, {
        contentType: file.type,
        cacheControl: "31536000, immutable",
        upsert: false,
      });
    if (uploadErr) return fail(uploadErr.message);
  }

  const supabase = createAdminClient();
  const update: Update<"uc_recharge_requests"> = {
    status: "delivered",
    ...(deliveryPath ? { delivery_screenshot_url: deliveryPath } : {}),
  };
  const { error } = await supabase
    .from("uc_recharge_requests")
    .update(update as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "uc_request.delivered",
    entityType: "uc_request",
    entityId: id,
    after: { delivery_screenshot_url: deliveryPath },
  });
  revalidateBoth(existing.request_number);
  return ok({ id });
}

const RejectSchema = z.object({
  reason: z.string().trim().min(1, "Reason required.").max(500),
});

export async function rejectRequestAction(
  id: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const existing = await loadRequest(id);
  if (!existing) return fail("Request not found.");
  if (["delivered", "cancelled"].includes(existing.status)) {
    return fail(`Cannot reject from status "${existing.status}".`);
  }

  const parsed = RejectSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid reason.");

  const supabase = createAdminClient();
  const update: Update<"uc_recharge_requests"> = {
    status: "rejected",
    rejection_reason: parsed.data.reason,
  };
  const { error } = await supabase
    .from("uc_recharge_requests")
    .update(update as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "uc_request.rejected",
    entityType: "uc_request",
    entityId: id,
    after: { rejection_reason: parsed.data.reason },
  });
  revalidateBoth(existing.request_number);
  return ok({ id });
}

export async function updateAdminNotesAction(
  id: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const existing = await loadRequest(id);
  if (!existing) return fail("Request not found.");

  const notes = String(formData.get("admin_notes") ?? "").trim().slice(0, 2000);

  const supabase = createAdminClient();
  const update: Update<"uc_recharge_requests"> = { admin_notes: notes || null };
  const { error } = await supabase
    .from("uc_recharge_requests")
    .update(update as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "uc_request.notes_update",
    entityType: "uc_request",
    entityId: id,
  });
  revalidateBoth(existing.request_number);
  return ok({ id });
}
