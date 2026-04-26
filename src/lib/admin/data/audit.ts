import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Row } from "@/types/database";

export type AuditEntry = Row<"admin_audit_log">;

export interface AuditWithActor extends AuditEntry {
  actor_email: string | null;
}

export interface AuditListQuery {
  page: number;
  pageSize: number;
  entityType?: string;
}

export interface AuditListResult {
  rows: AuditWithActor[];
  total: number;
}

export async function listAuditLog(query: AuditListQuery): Promise<AuditListResult> {
  const supabase = createAdminClient();
  let q = supabase.from("admin_audit_log").select("*", { count: "exact" });
  if (query.entityType) q = q.eq("entity_type", query.entityType);
  q = q.order("created_at", { ascending: false });
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  q = q.range(from, to);

  const { data, count, error } = await q;
  if (error || !data) return { rows: [], total: count ?? 0 };

  const rows = data as unknown as AuditEntry[];

  // Resolve actor emails in one go.
  const actorIds = Array.from(
    new Set(rows.map((r) => r.actor_id).filter((v): v is string => v !== null)),
  );

  const emailById = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email")
      .in("id", actorIds);
    for (const p of (profiles ?? []) as Array<{ id: string; email: string }>) {
      emailById.set(p.id, p.email);
    }
  }

  const out: AuditWithActor[] = rows.map((r) => ({
    ...r,
    actor_email: r.actor_id ? emailById.get(r.actor_id) ?? null : null,
  }));

  return { rows: out, total: count ?? 0 };
}
