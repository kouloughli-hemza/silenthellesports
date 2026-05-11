"use server";

import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { identifyImage } from "@/lib/utils/image-bytes";
import { fail, ok, type Result } from "@/types/domain";
import { UPLOAD_BUCKETS, type UploadBucket } from "@/lib/admin/upload-types";

const MAX_BYTES = 5 * 1024 * 1024;

function isUploadBucket(value: unknown): value is UploadBucket {
  return typeof value === "string" && (UPLOAD_BUCKETS as readonly string[]).includes(value);
}

export async function uploadImageAction(formData: FormData): Promise<Result<{ url: string }>> {
  const profile = await requireAdmin();

  const file = formData.get("file");
  const bucket = formData.get("bucket");

  if (!(file instanceof File)) return fail("No file provided.");
  if (!isUploadBucket(bucket)) return fail("Invalid upload target.");
  if (file.size === 0) return fail("Empty file.");
  if (file.size > MAX_BYTES) return fail("File exceeds 5 MB.");

  // Sniff the actual bytes — never trust the browser Content-Type. SVG, HTML,
  // and other potentially script-bearing files are blocked here even though
  // bucket allowed_mime_types should also catch them; defence in depth.
  const buffer = Buffer.from(await file.arrayBuffer());
  // Admin uploads accept AVIF in addition to the customer-facing set.
  const identified = identifyImage(buffer, { allow: ["png", "jpeg", "webp", "avif"] });
  if (!identified) return fail("File must be a PNG, JPEG, WebP, or AVIF image.");

  const path = `${randomUUID()}.${identified.ext}`;
  const supabase = createAdminClient();

  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      // contentType derived from sniffed bytes, not from upload header.
      contentType: identified.mime,
      cacheControl: "31536000, immutable",
      upsert: false,
    });
  if (uploadErr) return fail(uploadErr.message);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

  await recordAudit({
    actorId: profile.id,
    action: "storage.upload",
    entityType: "storage",
    entityId: `${bucket}/${path}`,
    after: { bucket, path, size: file.size, type: identified.mime },
  });

  return ok({ url: urlData.publicUrl });
}
