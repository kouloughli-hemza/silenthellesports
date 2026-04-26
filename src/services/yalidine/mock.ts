// MockYalidineService — works with no credentials. Realistic Algerian data.
// Switch to RealYalidineService by setting YALIDINE_API_ID + YALIDINE_API_TOKEN.

import { getCommunesFor, getStopdeskList, WILAYAS } from "./wilayas";
import type {
  CreateParcelInput,
  FeeQuote,
  ParcelStatus,
  Wilaya,
  Commune,
  Stopdesk,
  YalidineService,
} from "./types";

// Tariff bands roughly match real Yalidine pricing — north / hauts plateaux / south.
const SOUTH_WILAYAS = new Set([1, 8, 11, 30, 32, 33, 37, 39, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58]);
const HAUTS_PLATEAUX = new Set([3, 4, 5, 7, 12, 17, 20, 24, 28, 29, 38, 40, 41, 45]);

function tarifFor(toWilaya: number, isStopdesk: boolean): number {
  // Base tariffs in DZD (mock). Real API returns these per pair.
  if (SOUTH_WILAYAS.has(toWilaya)) return isStopdesk ? 900 : 1100;
  if (HAUTS_PLATEAUX.has(toWilaya)) return isStopdesk ? 600 : 750;
  return isStopdesk ? 400 : 550; // north + Algiers belt
}

function weightSurcharge(weightGrams: number): number {
  // First 1kg included; +50 DZD per extra kg.
  if (weightGrams <= 1000) return 0;
  return Math.ceil((weightGrams - 1000) / 1000) * 50;
}

export class MockYalidineService implements YalidineService {
  isMock(): boolean {
    return true;
  }

  async getWilayas(): Promise<Wilaya[]> {
    return WILAYAS;
  }

  async getCommunes(wilayaCode: number): Promise<Commune[]> {
    return getCommunesFor(wilayaCode);
  }

  async getStopdesks(wilayaCode?: number): Promise<Stopdesk[]> {
    return getStopdeskList(wilayaCode);
  }

  async calculateFee(params: {
    fromWilayaCode: number;
    toWilayaCode: number;
    weightGrams: number;
    isStopdesk: boolean;
  }): Promise<FeeQuote> {
    const home = tarifFor(params.toWilayaCode, false) + weightSurcharge(params.weightGrams);
    const stopdesk = tarifFor(params.toWilayaCode, true) + weightSurcharge(params.weightGrams);
    return {
      home,
      stopdesk,
      weight_grams: params.weightGrams,
      from_wilaya_code: params.fromWilayaCode,
      to_wilaya_code: params.toWilayaCode,
    };
  }

  async createParcel(params: CreateParcelInput): Promise<{ tracking: string; importId: number }> {
    // Format mirrors real Yalidine: yal-XXXXXX.
    const id = Math.floor(Math.random() * 1_000_000);
    const tracking = `yal-${String(id).padStart(6, "0")}`;
    // Real API returns an import_id; mock with a timestamp-derived int.
    const importId = Math.floor(Date.now() / 1000);
    // We deliberately do not store anything here — orders table is the source of truth.
    void params;
    return { tracking, importId };
  }

  async getParcel(tracking: string): Promise<ParcelStatus> {
    // Mock returns an in-transit status. The webhook would update the order.
    return {
      tracking,
      status: "in_transit",
      last_event_at: new Date().toISOString(),
      is_delivered: false,
      is_returned: false,
    };
  }

  async cancelParcel(tracking: string): Promise<void> {
    void tracking;
  }
}
