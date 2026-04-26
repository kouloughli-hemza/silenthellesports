// Static fixture: all 58 Algerian wilayas with English + Arabic names.
// Used by MockYalidineService; RealYalidineService fetches the same shape from
// the live API and caches it.

import type { Wilaya } from "./types";

export const WILAYAS: Wilaya[] = [
  { code: 1, name: "Adrar", name_ar: "أدرار" },
  { code: 2, name: "Chlef", name_ar: "الشلف" },
  { code: 3, name: "Laghouat", name_ar: "الأغواط" },
  { code: 4, name: "Oum El Bouaghi", name_ar: "أم البواقي" },
  { code: 5, name: "Batna", name_ar: "باتنة" },
  { code: 6, name: "Béjaïa", name_ar: "بجاية" },
  { code: 7, name: "Biskra", name_ar: "بسكرة" },
  { code: 8, name: "Béchar", name_ar: "بشار" },
  { code: 9, name: "Blida", name_ar: "البليدة" },
  { code: 10, name: "Bouira", name_ar: "البويرة" },
  { code: 11, name: "Tamanrasset", name_ar: "تمنراست" },
  { code: 12, name: "Tébessa", name_ar: "تبسة" },
  { code: 13, name: "Tlemcen", name_ar: "تلمسان" },
  { code: 14, name: "Tiaret", name_ar: "تيارت" },
  { code: 15, name: "Tizi Ouzou", name_ar: "تيزي وزو" },
  { code: 16, name: "Alger", name_ar: "الجزائر" },
  { code: 17, name: "Djelfa", name_ar: "الجلفة" },
  { code: 18, name: "Jijel", name_ar: "جيجل" },
  { code: 19, name: "Sétif", name_ar: "سطيف" },
  { code: 20, name: "Saïda", name_ar: "سعيدة" },
  { code: 21, name: "Skikda", name_ar: "سكيكدة" },
  { code: 22, name: "Sidi Bel Abbès", name_ar: "سيدي بلعباس" },
  { code: 23, name: "Annaba", name_ar: "عنابة" },
  { code: 24, name: "Guelma", name_ar: "قالمة" },
  { code: 25, name: "Constantine", name_ar: "قسنطينة" },
  { code: 26, name: "Médéa", name_ar: "المدية" },
  { code: 27, name: "Mostaganem", name_ar: "مستغانم" },
  { code: 28, name: "M'Sila", name_ar: "المسيلة" },
  { code: 29, name: "Mascara", name_ar: "معسكر" },
  { code: 30, name: "Ouargla", name_ar: "ورقلة" },
  { code: 31, name: "Oran", name_ar: "وهران" },
  { code: 32, name: "El Bayadh", name_ar: "البيض" },
  { code: 33, name: "Illizi", name_ar: "إليزي" },
  { code: 34, name: "Bordj Bou Arréridj", name_ar: "برج بوعريريج" },
  { code: 35, name: "Boumerdès", name_ar: "بومرداس" },
  { code: 36, name: "El Tarf", name_ar: "الطارف" },
  { code: 37, name: "Tindouf", name_ar: "تندوف" },
  { code: 38, name: "Tissemsilt", name_ar: "تيسمسيلت" },
  { code: 39, name: "El Oued", name_ar: "الوادي" },
  { code: 40, name: "Khenchela", name_ar: "خنشلة" },
  { code: 41, name: "Souk Ahras", name_ar: "سوق أهراس" },
  { code: 42, name: "Tipaza", name_ar: "تيبازة" },
  { code: 43, name: "Mila", name_ar: "ميلة" },
  { code: 44, name: "Aïn Defla", name_ar: "عين الدفلى" },
  { code: 45, name: "Naâma", name_ar: "النعامة" },
  { code: 46, name: "Aïn Témouchent", name_ar: "عين تموشنت" },
  { code: 47, name: "Ghardaïa", name_ar: "غرداية" },
  { code: 48, name: "Relizane", name_ar: "غليزان" },
  { code: 49, name: "Timimoun", name_ar: "تيميمون" },
  { code: 50, name: "Bordj Badji Mokhtar", name_ar: "برج باجي مختار" },
  { code: 51, name: "Ouled Djellal", name_ar: "أولاد جلال" },
  { code: 52, name: "Béni Abbès", name_ar: "بني عباس" },
  { code: 53, name: "In Salah", name_ar: "عين صالح" },
  { code: 54, name: "In Guezzam", name_ar: "عين قزام" },
  { code: 55, name: "Touggourt", name_ar: "تقرت" },
  { code: 56, name: "Djanet", name_ar: "جانت" },
  { code: 57, name: "El M'Ghair", name_ar: "المغير" },
  { code: 58, name: "El Meniaa", name_ar: "المنيعة" },
];

// Major communes per wilaya — small fixture (1–4 per wilaya) so the mock
// dropdown stays usable. RealYalidineService returns the full ~1500-commune list.
const COMMUNE_FIXTURE: Record<number, Array<{ name: string; name_ar: string; has_stopdesk?: boolean }>> = {
  1: [{ name: "Adrar", name_ar: "أدرار", has_stopdesk: true }, { name: "Reggane", name_ar: "رقان" }],
  2: [{ name: "Chlef", name_ar: "الشلف", has_stopdesk: true }, { name: "Ténès", name_ar: "تنس" }],
  3: [{ name: "Laghouat", name_ar: "الأغواط", has_stopdesk: true }, { name: "Aflou", name_ar: "أفلو" }],
  4: [{ name: "Oum El Bouaghi", name_ar: "أم البواقي", has_stopdesk: true }, { name: "Aïn Beïda", name_ar: "عين البيضاء" }],
  5: [{ name: "Batna", name_ar: "باتنة", has_stopdesk: true }, { name: "Barika", name_ar: "بريكة" }, { name: "Aïn Touta", name_ar: "عين التوتة" }],
  6: [{ name: "Béjaïa", name_ar: "بجاية", has_stopdesk: true }, { name: "Akbou", name_ar: "أقبو" }, { name: "El Kseur", name_ar: "القصر" }],
  7: [{ name: "Biskra", name_ar: "بسكرة", has_stopdesk: true }, { name: "Tolga", name_ar: "طولقة" }],
  8: [{ name: "Béchar", name_ar: "بشار", has_stopdesk: true }, { name: "Kenadsa", name_ar: "القنادسة" }],
  9: [{ name: "Blida", name_ar: "البليدة", has_stopdesk: true }, { name: "Boufarik", name_ar: "بوفاريك" }, { name: "Ouled Yaïch", name_ar: "أولاد يعيش" }],
  10: [{ name: "Bouira", name_ar: "البويرة", has_stopdesk: true }, { name: "Lakhdaria", name_ar: "الأخضرية" }],
  11: [{ name: "Tamanrasset", name_ar: "تمنراست", has_stopdesk: true }],
  12: [{ name: "Tébessa", name_ar: "تبسة", has_stopdesk: true }, { name: "Cheria", name_ar: "الشريعة" }],
  13: [{ name: "Tlemcen", name_ar: "تلمسان", has_stopdesk: true }, { name: "Maghnia", name_ar: "مغنية" }, { name: "Nedroma", name_ar: "ندرومة" }],
  14: [{ name: "Tiaret", name_ar: "تيارت", has_stopdesk: true }, { name: "Sougueur", name_ar: "السوقر" }],
  15: [{ name: "Tizi Ouzou", name_ar: "تيزي وزو", has_stopdesk: true }, { name: "Azazga", name_ar: "أزفون" }, { name: "Draâ Ben Khedda", name_ar: "ذراع بن خدة" }],
  16: [
    { name: "Alger Centre", name_ar: "الجزائر الوسطى", has_stopdesk: true },
    { name: "Bab El Oued", name_ar: "باب الواد", has_stopdesk: true },
    { name: "Bir Mourad Raïs", name_ar: "بير مراد رايس", has_stopdesk: true },
    { name: "Hydra", name_ar: "حيدرة", has_stopdesk: true },
    { name: "Kouba", name_ar: "القبة" },
    { name: "El Harrach", name_ar: "الحراش" },
    { name: "Bab Ezzouar", name_ar: "باب الزوار", has_stopdesk: true },
    { name: "Dar El Beïda", name_ar: "الدار البيضاء" },
  ],
  17: [{ name: "Djelfa", name_ar: "الجلفة", has_stopdesk: true }, { name: "Aïn Oussera", name_ar: "عين وسارة" }],
  18: [{ name: "Jijel", name_ar: "جيجل", has_stopdesk: true }, { name: "El Milia", name_ar: "الميلية" }],
  19: [{ name: "Sétif", name_ar: "سطيف", has_stopdesk: true }, { name: "El Eulma", name_ar: "العلمة" }, { name: "Aïn Oulmène", name_ar: "عين ولمان" }],
  20: [{ name: "Saïda", name_ar: "سعيدة", has_stopdesk: true }],
  21: [{ name: "Skikda", name_ar: "سكيكدة", has_stopdesk: true }, { name: "Collo", name_ar: "القل" }],
  22: [{ name: "Sidi Bel Abbès", name_ar: "سيدي بلعباس", has_stopdesk: true }, { name: "Telagh", name_ar: "تلاغ" }],
  23: [{ name: "Annaba", name_ar: "عنابة", has_stopdesk: true }, { name: "El Hadjar", name_ar: "الحجار" }],
  24: [{ name: "Guelma", name_ar: "قالمة", has_stopdesk: true }],
  25: [{ name: "Constantine", name_ar: "قسنطينة", has_stopdesk: true }, { name: "El Khroub", name_ar: "الخروب" }, { name: "Hamma Bouziane", name_ar: "حامة بوزيان" }],
  26: [{ name: "Médéa", name_ar: "المدية", has_stopdesk: true }, { name: "Berrouaghia", name_ar: "البرواقية" }],
  27: [{ name: "Mostaganem", name_ar: "مستغانم", has_stopdesk: true }],
  28: [{ name: "M'Sila", name_ar: "المسيلة", has_stopdesk: true }, { name: "Bou Saâda", name_ar: "بوسعادة" }],
  29: [{ name: "Mascara", name_ar: "معسكر", has_stopdesk: true }],
  30: [{ name: "Ouargla", name_ar: "ورقلة", has_stopdesk: true }, { name: "Hassi Messaoud", name_ar: "حاسي مسعود" }],
  31: [{ name: "Oran", name_ar: "وهران", has_stopdesk: true }, { name: "Es Senia", name_ar: "السانيا" }, { name: "Aïn El Türck", name_ar: "عين الترك" }, { name: "Bir El Djir", name_ar: "بئر الجير", has_stopdesk: true }],
  32: [{ name: "El Bayadh", name_ar: "البيض", has_stopdesk: true }],
  33: [{ name: "Illizi", name_ar: "إليزي" }],
  34: [{ name: "Bordj Bou Arréridj", name_ar: "برج بوعريريج", has_stopdesk: true }, { name: "Ras El Oued", name_ar: "رأس الوادي" }],
  35: [{ name: "Boumerdès", name_ar: "بومرداس", has_stopdesk: true }, { name: "Bordj Menaïel", name_ar: "برج منايل" }, { name: "Khemis El Khechna", name_ar: "خميس الخشنة" }],
  36: [{ name: "El Tarf", name_ar: "الطارف", has_stopdesk: true }],
  37: [{ name: "Tindouf", name_ar: "تندوف" }],
  38: [{ name: "Tissemsilt", name_ar: "تيسمسيلت", has_stopdesk: true }],
  39: [{ name: "El Oued", name_ar: "الوادي", has_stopdesk: true }, { name: "Guemar", name_ar: "قمار" }],
  40: [{ name: "Khenchela", name_ar: "خنشلة", has_stopdesk: true }],
  41: [{ name: "Souk Ahras", name_ar: "سوق أهراس", has_stopdesk: true }],
  42: [{ name: "Tipaza", name_ar: "تيبازة", has_stopdesk: true }, { name: "Cherchell", name_ar: "شرشال" }, { name: "Kolea", name_ar: "القليعة" }],
  43: [{ name: "Mila", name_ar: "ميلة", has_stopdesk: true }, { name: "Ferdjioua", name_ar: "فرجيوة" }],
  44: [{ name: "Aïn Defla", name_ar: "عين الدفلى", has_stopdesk: true }, { name: "Khémis Miliana", name_ar: "خميس مليانة" }],
  45: [{ name: "Naâma", name_ar: "النعامة" }],
  46: [{ name: "Aïn Témouchent", name_ar: "عين تموشنت", has_stopdesk: true }],
  47: [{ name: "Ghardaïa", name_ar: "غرداية", has_stopdesk: true }, { name: "Métlili", name_ar: "متليلي" }],
  48: [{ name: "Relizane", name_ar: "غليزان", has_stopdesk: true }, { name: "Oued Rhiou", name_ar: "وادي رهيو" }],
  49: [{ name: "Timimoun", name_ar: "تيميمون" }],
  50: [{ name: "Bordj Badji Mokhtar", name_ar: "برج باجي مختار" }],
  51: [{ name: "Ouled Djellal", name_ar: "أولاد جلال" }],
  52: [{ name: "Béni Abbès", name_ar: "بني عباس" }],
  53: [{ name: "In Salah", name_ar: "عين صالح" }],
  54: [{ name: "In Guezzam", name_ar: "عين قزام" }],
  55: [{ name: "Touggourt", name_ar: "تقرت", has_stopdesk: true }],
  56: [{ name: "Djanet", name_ar: "جانت" }],
  57: [{ name: "El M'Ghair", name_ar: "المغير" }],
  58: [{ name: "El Meniaa", name_ar: "المنيعة" }],
};

let communeIdSeq = 1000;
const COMMUNES_BY_WILAYA: Record<number, import("./types").Commune[]> = {};

for (const w of WILAYAS) {
  const list = COMMUNE_FIXTURE[w.code] ?? [];
  COMMUNES_BY_WILAYA[w.code] = list.map((c) => ({
    id: communeIdSeq++,
    wilaya_code: w.code,
    name: c.name,
    name_ar: c.name_ar,
    has_stopdesk: c.has_stopdesk ?? false,
    is_deliverable: true,
  }));
}

export function getCommunesFor(wilayaCode: number): import("./types").Commune[] {
  return COMMUNES_BY_WILAYA[wilayaCode] ?? [];
}

export function getStopdeskList(wilayaCode?: number): import("./types").Stopdesk[] {
  let stopdeskIdSeq = 5000;
  const out: import("./types").Stopdesk[] = [];
  for (const w of WILAYAS) {
    if (wilayaCode && w.code !== wilayaCode) continue;
    const communes = COMMUNES_BY_WILAYA[w.code] ?? [];
    for (const c of communes) {
      if (!c.has_stopdesk) continue;
      out.push({
        id: stopdeskIdSeq++,
        wilaya_code: w.code,
        commune_name: c.name,
        address: `Yalidine ${c.name} — Centre`,
        name: `${c.name} · Yalidine`,
      });
    }
  }
  return out;
}
