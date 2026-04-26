"use server";

import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, type Result } from "@/types/domain";
import { UPLOAD_BUCKETS, type UploadBucket } from "@/lib/admin/upload-types";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

const EXT_FROM_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

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
  if (!ALLOWED_MIME.has(file.type)) return fail(`Unsupported type: ${file.type || "unknown"}.`);

  const ext = EXT_FROM_MIME[file.type] ?? "bin";
  const path = `${randomUUID()}.${ext}`;

  const supabase = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
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
    after: { bucket, path, size: file.size, type: file.type },
  });

  return ok({ url: urlData.publicUrl });
}
