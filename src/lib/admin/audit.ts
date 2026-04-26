import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditEntry {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}

// Best-effort audit log writer. Failures are swallowed — never let an audit
// log error break the actual mutation that the admin is performing.
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
    const userAgent = h.get("user-agent") ?? null;
    const supabase = createAdminClient();
    await supabase.from("admin_audit_log").insert({
      actor_id: entry.actorId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      before: (entry.before ?? null) as never,
      after: (entry.after ?? null) as never,
      ip,
      user_agent: userAgent,
    });
  } catch (err) {
    console.warn("[audit] failed to write entry:", err);
  }
}
