// RealYalidineService — production implementation against
// https://api.yalidine.app/v1/. Activated when YALIDINE_API_ID and
// YALIDINE_API_TOKEN are set; mock service is used otherwise.

import "server-only";

import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { WILAYAS as STATIC_WILAYAS } from "./wilayas";
import type {
  Commune,
  CreateParcelInput,
  FeeQuote,
  ParcelStatus,
  Stopdesk,
  Wilaya,
  YalidineService,
} from "./types";

const API_BASE = "https://api.yalidine.app/v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// ---------- Zod response schemas ----------

const WilayaApiSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});
const WilayaListSchema = z.object({ data: z.array(WilayaApiSchema) });

const CommuneApiSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  wilaya_id: z.number().int(),
  has_stop_desk: z.number().int(),
  is_deliverable: z.number().int(),
});
const CommuneListSchema = z.object({ data: z.array(CommuneApiSchema) });

const CenterApiSchema = z.object({
  center_id: z.number().int(),
  name: z.string(),
  address: z.string(),
  wilaya_id: z.number().int(),
  commune_name: z.string(),
});
const CenterListSchema = z.object({ data: z.array(CenterApiSchema) });

const FeeApiSchema = z.object({
  per_commune: z
    .record(
      z.string(),
      z.object({
        commune_name: z.string(),
        express_home: z.number(),
        express_desk: z.number(),
      }),
    )
    .optional(),
  delivery_fees: z
    .record(
      z.string(),
      z.object({
        express_home: z.number(),
        express_desk: z.number(),
      }),
    )
    .optional(),
});

const ParcelCreateResponseSchema = z.record(
  z.string(),
  z.object({
    success: z.boolean(),
    tracking: z.string().optional(),
    import_id: z.number().int().optional(),
    message: z.string().optional(),
  }),
);

const ParcelStatusApiSchema = z.object({
  tracking: z.string(),
  last_status: z.string(),
  date_last_status: z.string(),
});

function arabicNameForWilaya(code: number): string {
  return STATIC_WILAYAS.find((w) => w.code === code)?.name_ar ?? "";
}

// ---------- HTTP client ----------

async function callYalidine<T>(
  path: string,
  init?: RequestInit & { searchParams?: Record<string, string | number> },
): Promise<T> {
  const env = getServerEnv();
  if (!env.YALIDINE_API_ID || !env.YALIDINE_API_TOKEN) {
    throw new Error("Yalidine credentials missing");
  }
  const url = new URL(`${API_BASE}${path}`);
  if (init?.searchParams) {
    for (const [k, v] of Object.entries(init.searchParams)) {
      url.searchParams.set(k, String(v));
    }
  }
  const headers = new Headers(init?.headers);
  headers.set("X-API-ID", env.YALIDINE_API_ID);
  headers.set("X-API-TOKEN", env.YALIDINE_API_TOKEN);
  headers.set("Accept", "application/json");
  if (init?.body) headers.set("Content-Type", "application/json");

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      detail = "";
    }
    throw new Error(`Yalidine ${res.status}: ${detail || res.statusText}`);
  }
  return (await res.json()) as T;
}

// ---------- Cache helpers ----------

interface CacheRow {
  value: unknown;
  refreshed_at: string;
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("yalidine_cache")
      .select("value, refreshed_at")
      .eq("key", key)
      .maybeSingle<CacheRow>();
    if (error || !data) return null;
    const age = Date.now() - new Date(data.refreshed_at).getTime();
    if (age > CACHE_TTL_MS) return null;
    return data.value as T;
  } catch {
    return null;
  }
}

async function writeCache(key: string, value: unknown): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase
      .from("yalidine_cache")
      .upsert({ key, value: value as never, refreshed_at: new Date().toISOString() });
  } catch (err) {
    console.warn("[yalidine] cache write failed:", err);
  }
}

// ---------- Implementation ----------

export class RealYalidineService implements YalidineService {
  isMock(): boolean {
    return false;
  }

  async getWilayas(): Promise<Wilaya[]> {
    const cached = await readCache<Wilaya[]>("wilayas");
    if (cached) return cached;

    const json = await callYalidine<unknown>("/wilayas/", {
      searchParams: { page_size: 100 },
    });
    const parsed = WilayaListSchema.parse(json);
    const wilayas: Wilaya[] = parsed.data.map((w) => ({
      code: w.id,
      name: w.name,
      name_ar: arabicNameForWilaya(w.id),
    }));
    await writeCache("wilayas", wilayas);
    return wilayas;
  }

  async getCommunes(wilayaCode: number): Promise<Commune[]> {
    const cacheKey = `communes:${wilayaCode}`;
    const cached = await readCache<Commune[]>(cacheKey);
    if (cached) return cached;

    const json = await callYalidine<unknown>("/communes/", {
      searchParams: { wilaya_id: wilayaCode, page_size: 200 },
    });
    const parsed = CommuneListSchema.parse(json);
    const communes: Commune[] = parsed.data.map((c) => ({
      id: c.id,
      wilaya_code: c.wilaya_id,
      name: c.name,
      name_ar: c.name, // Yalidine API doesn't supply Arabic
      has_stopdesk: c.has_stop_desk === 1,
      is_deliverable: c.is_deliverable === 1,
    }));
    await writeCache(cacheKey, communes);
    return communes;
  }

  async getStopdesks(wilayaCode?: number): Promise<Stopdesk[]> {
    const cacheKey = wilayaCode ? `stopdesks:${wilayaCode}` : "stopdesks:all";
    const cached = await readCache<Stopdesk[]>(cacheKey);
    if (cached) return cached;

    const json = await callYalidine<unknown>("/centers/", {
      searchParams: wilayaCode ? { wilaya_id: wilayaCode, page_size: 200 } : { page_size: 500 },
    });
    const parsed = CenterListSchema.parse(json);
    const stopdesks: Stopdesk[] = parsed.data.map((c) => ({
      id: c.center_id,
      wilaya_code: c.wilaya_id,
      commune_name: c.commune_name,
      address: c.address,
      name: c.name,
    }));
    await writeCache(cacheKey, stopdesks);
    return stopdesks;
  }

  async calculateFee(params: {
    fromWilayaCode: number;
    toWilayaCode: number;
    weightGrams: number;
    isStopdesk: boolean;
  }): Promise<FeeQuote> {
    const json = await callYalidine<unknown>("/deliveryfees/", {
      searchParams: {
        from_wilaya_id: params.fromWilayaCode,
        to_wilaya_id: params.toWilayaCode,
      },
    });
    const parsed = FeeApiSchema.parse(json);

    let home = 0;
    let stopdesk = 0;
    if (parsed.per_commune && Object.keys(parsed.per_commune).length > 0) {
      const quotes = Object.values(parsed.per_commune);
      home = Math.min(...quotes.map((q) => q.express_home));
      stopdesk = Math.min(...quotes.map((q) => q.express_desk));
    } else if (parsed.delivery_fees && Object.keys(parsed.delivery_fees).length > 0) {
      const quotes = Object.values(parsed.delivery_fees);
      home = Math.min(...quotes.map((q) => q.express_home));
      stopdesk = Math.min(...quotes.map((q) => q.express_desk));
    } else {
      throw new Error("Yalidine fee response had no per_commune or delivery_fees data");
    }

    if (params.weightGrams > 1000) {
      const extra = Math.ceil((params.weightGrams - 1000) / 1000) * 50;
      home += extra;
      stopdesk += extra;
    }

    return {
      home,
      stopdesk,
      weight_grams: params.weightGrams,
      from_wilaya_code: params.fromWilayaCode,
      to_wilaya_code: params.toWilayaCode,
    };
  }

  async createParcel(params: CreateParcelInput): Promise<{ tracking: string; importId: number }> {
    const env = getServerEnv();
    const fromWilayaName =
      STATIC_WILAYAS.find((w) => w.code === env.YALIDINE_FROM_WILAYA_CODE)?.name ?? "Alger";
    const toWilayaName = STATIC_WILAYAS.find((w) => w.code === params.to_wilaya_code)?.name ?? "";
    const [first, ...rest] = params.customer_name.trim().split(/\s+/);

    const body = [
      {
        order_id: params.order_number,
        firstname: first ?? params.customer_name,
        familyname: rest.join(" ") || params.customer_name,
        contact_phone: params.customer_phone,
        address: params.address,
        from_wilaya_name: fromWilayaName,
        to_commune_name: params.to_commune_name,
        to_wilaya_name: toWilayaName,
        product_list: params.product_label,
        price: params.declared_value,
        do_insurance: false,
        declared_value: params.declared_value,
        length: 25,
        width: 20,
        height: 10,
        weight: Math.max(1, Math.ceil(params.weight_grams / 1000)),
        freeshipping: false,
        is_stopdesk: params.is_stopdesk,
        stopdesk_id: params.stopdesk_id ?? null,
        has_exchange: false,
      },
    ];

    const json = await callYalidine<unknown>("/parcels/", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const parsed = ParcelCreateResponseSchema.parse(json);
    const entry = parsed[params.order_number];
    if (!entry || !entry.success || !entry.tracking) {
      throw new Error(`Yalidine parcel creation failed: ${entry?.message ?? "unknown"}`);
    }
    return { tracking: entry.tracking, importId: entry.import_id ?? 0 };
  }

  async getParcel(tracking: string): Promise<ParcelStatus> {
    const json = await callYalidine<unknown>(`/parcels/${encodeURIComponent(tracking)}`);
    const parsed = ParcelStatusApiSchema.parse(json);
    const status = parsed.last_status.toLowerCase();
    return {
      tracking: parsed.tracking,
      status,
      last_event_at: parsed.date_last_status,
      is_delivered: status.includes("livr") || status.includes("delivered"),
      is_returned: status.includes("retour") || status.includes("return"),
    };
  }

  async cancelParcel(tracking: string): Promise<void> {
    await callYalidine<unknown>(`/parcels/${encodeURIComponent(tracking)}`, {
      method: "DELETE",
    });
  }
}
