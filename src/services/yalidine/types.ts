// Yalidine domain types — used by both Mock and Real implementations.

export interface Wilaya {
  code: number; // 1..58
  name: string;
  name_ar: string;
}

export interface Commune {
  id: number;
  wilaya_code: number;
  name: string;
  name_ar: string;
  has_stopdesk: boolean;
  is_deliverable: boolean;
}

export interface Stopdesk {
  id: number;
  wilaya_code: number;
  commune_name: string;
  address: string;
  name: string;
}

export interface FeeQuote {
  home: number; // DZD
  stopdesk: number; // DZD
  weight_grams: number;
  from_wilaya_code: number;
  to_wilaya_code: number;
}

export interface CreateParcelInput {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  to_wilaya_code: number;
  to_commune_name: string;
  address: string;
  is_stopdesk: boolean;
  stopdesk_id: number | null;
  weight_grams: number;
  product_label: string; // human-readable summary, e.g. "Hoodie x1, Cap x2"
  declared_value: number; // DZD
}

export interface ParcelStatus {
  tracking: string;
  status: string; // 'pending', 'dispatched', 'in_transit', 'delivered', 'returned', etc.
  last_event_at: string;
  is_delivered: boolean;
  is_returned: boolean;
}

export interface YalidineService {
  isMock(): boolean;
  getWilayas(): Promise<Wilaya[]>;
  getCommunes(wilayaCode: number): Promise<Commune[]>;
  getStopdesks(wilayaCode?: number): Promise<Stopdesk[]>;
  calculateFee(params: {
    fromWilayaCode: number;
    toWilayaCode: number;
    weightGrams: number;
    isStopdesk: boolean;
  }): Promise<FeeQuote>;
  createParcel(params: CreateParcelInput): Promise<{ tracking: string; importId: number }>;
  getParcel(tracking: string): Promise<ParcelStatus>;
  cancelParcel(tracking: string): Promise<void>;
}
