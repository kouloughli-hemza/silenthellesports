// Yalidine webhook handler.
// Yalidine POSTs status updates to this endpoint when a parcel changes state
// (in_transit, ready_for_delivery, delivered, returned, etc).
//
// Security: Yalidine doesn't sign their webhooks (per their docs). To prevent
// random callers from updating order statuses, we require a shared secret
// passed as a query string token. Set YALIDINE_WEBHOOK_TOKEN in Vercel and
// configure the same token in your Yalidine dashboard webhook URL.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WebhookPayloadSchema = z.object({
  tracking: z.string(),
  status: z.string(),
  date_status: z.string().optional(),
  reason: z.string().optional(),
});

function mapYalidineToOrderStatus(
  yalidineStatus: string,
): "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned" | null {
  const s = yalidineStatus.toLowerCase();
  if (s.includes("livr") || s.includes("delivered")) return "delivered";
  if (s.includes("retour") || s.includes("return")) return "returned";
  if (s.includes("annul") || s.includes("cancel")) return "cancelled";
  if (s.includes("transit") || s.includes("expedi") || s.includes("ship")) return "shipped";
  return null;
}

export async function POST(request: Request) {
  let env: ReturnType<typeof getServerEnv>;
  try {
    env = getServerEnv();
  } catch (err) {
    console.error("[webhook:yalidine] env error:", err);
    return NextResponse.json({ ok: false, error: "server misconfigured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const expected = process.env.YALIDINE_WEBHOOK_TOKEN;
  if (!expected) {
    console.warn("[webhook:yalidine] YALIDINE_WEBHOOK_TOKEN not set; rejecting");
    return NextResponse.json({ ok: false, error: "webhook disabled" }, { status: 503 });
  }
  if (token !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const parsed = WebhookPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
  }

  const { tracking, status } = parsed.data;
  const newOrderStatus = mapYalidineToOrderStatus(status);

  try {
    const supabase = createAdminClient();
    const update: { yalidine_status: string; status?: string } = {
      yalidine_status: status,
    };
    if (newOrderStatus) update.status = newOrderStatus;

    const { error } = await supabase
      .from("orders")
      .update(update as never)
      .eq("yalidine_tracking", tracking);

    if (error) {
      console.error("[webhook:yalidine] DB update failed:", error.message);
      return NextResponse.json({ ok: false, error: "db error" }, { status: 500 });
    }
    void env;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook:yalidine] unexpected:", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
