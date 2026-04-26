// Scheduled cache refresh for Yalidine reference data (wilayas, communes,
// stopdesks). Runs daily via Vercel Cron — see vercel.json.
//
// Vercel Cron protects this endpoint with an `Authorization: Bearer ${CRON_SECRET}`
// header automatically when the route is in vercel.json's `crons` list.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { yalidine } from "@/services/yalidine";
import { yalidineConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!yalidineConfigured()) {
    return NextResponse.json({
      ok: true,
      skipped: "yalidine credentials not set; nothing to refresh",
    });
  }

  const summary = {
    wilayas: 0,
    communes: 0,
    stopdesks: 0,
    errors: [] as string[],
  };

  try {
    const wilayas = await yalidine.getWilayas();
    summary.wilayas = wilayas.length;

    // Refresh communes per wilaya, throttled to avoid blowing the rate limit
    for (const w of wilayas) {
      try {
        const c = await yalidine.getCommunes(w.code);
        summary.communes += c.length;
      } catch (err) {
        summary.errors.push(`communes:${w.code}: ${err instanceof Error ? err.message : String(err)}`);
      }
      // 200ms breather between requests
      await new Promise<void>((r) => setTimeout(r, 200));
    }

    const stopdesks = await yalidine.getStopdesks();
    summary.stopdesks = stopdesks.length;
  } catch (err) {
    summary.errors.push(err instanceof Error ? err.message : String(err));
  }

  // Touch the cache table updated_at as a freshness signal
  try {
    const supabase = createAdminClient();
    await supabase
      .from("yalidine_cache")
      .upsert({ key: "_last_refresh", value: { at: new Date().toISOString() } as never });
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, summary });
}
