// =============================================================================
// Silent Hell — demo content seed
// Run: `npm run seed:demo`
// Idempotent. Adds upcoming events, store products + variants, an active
// giveaway, and the About + Terms + Privacy pages so the public site has
// something real to render. Safe to re-run.
// =============================================================================

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { createAdminClient } from "@/lib/supabase/admin";
import type { Insert } from "@/types/database";

type EventSeed = Insert<"events">;
type ProductSeed = Insert<"products">;
type VariantSeed = Insert<"product_variants">;
type GiveawaySeed = Insert<"giveaways">;
type PageSeed = Insert<"pages">;

const now = Date.now();
const day = 24 * 3600 * 1000;
const iso = (offsetDays: number) => new Date(now + offsetDays * day).toISOString();

// ----- EVENTS -----
const events: EventSeed[] = [
  {
    slug: "shn-room-spring-1",
    title: { en: "SHN Room · Spring Open", ar: "غرفة SHN · افتتاح الربيع" },
    description: {
      en: "Open community squad bracket. Compete for an SHN merch bundle and bragging rights.",
      ar: "بطولة مفتوحة للمجتمع بنمط فرق. تنافس على حقيبة SHN ومكانتك بين الأبطال.",
    },
    mode: "Squad",
    map: "Erangel",
    prize_pool: 25000,
    prize_currency: "DZD",
    entry_fee: 0,
    capacity: 100,
    start_at: iso(7),
    registration_closes_at: iso(6),
    status: "open",
    rules: {
      en: "Standard PUBG Mobile competitive ruleset. Squads of 4. No emulators. Discord required.",
      ar: "قواعد PUBG Mobile التنافسية القياسية. فرق من ٤. ممنوع المحاكي. الديسكورد إلزامي.",
    },
    tag: "COMMUNITY",
  },
  {
    slug: "shn-customs-duo",
    title: { en: "SHN Customs · Duo Night", ar: "كستومز SHN · ليلة الثنائيات" },
    description: {
      en: "Fast-paced duo customs hosted by GHOST_07 and V3NOM. Two maps, scrims style.",
      ar: "كستومز ثنائيات سريعة بقيادة GHOST_07 و V3NOM. خريطتان بأسلوب التدريب.",
    },
    mode: "Duo",
    map: "Miramar",
    prize_pool: 0,
    prize_currency: "DZD",
    entry_fee: 0,
    capacity: 64,
    start_at: iso(14),
    registration_closes_at: iso(13),
    status: "upcoming",
    rules: {
      en: "Duos. Discord required. Streamed live on the SHN Twitch channel.",
      ar: "ثنائيات. الديسكورد إلزامي. بث مباشر على قناة SHN على تويتش.",
    },
    tag: "CUSTOMS",
  },
  {
    slug: "shn-invitational-squad",
    title: { en: "SHN Invitational · Squad", ar: "بطولة SHN الدعوية · فرق" },
    description: {
      en: "Invitation-only squad invitational. Top Algerian and MENA teams compete for a 50,000 DZD purse.",
      ar: "بطولة فرق بالدعوة فقط. أفضل الفرق الجزائرية وفي MENA يتنافسون على ٥٠٫٠٠٠ د.ج.",
    },
    mode: "Squad",
    map: "Vikendi",
    prize_pool: 50000,
    prize_currency: "DZD",
    entry_fee: 1000,
    capacity: 16,
    start_at: iso(28),
    registration_closes_at: iso(25),
    status: "upcoming",
    rules: {
      en: "Invitation only. Pre-approved squads. Entry fee covers production. Top 4 paid out.",
      ar: "بالدعوة فقط. فرق معتمدة. رسوم الدخول تغطي تكاليف الإنتاج. الأربعة الأوائل يحصلون على جوائز.",
    },
    tag: "INVITATIONAL",
  },
  {
    slug: "shn-archive-pmnc-2025",
    title: { en: "PMNC Algeria 2025 · Archived", ar: "PMNC الجزائر ٢٠٢٥ · أرشيف" },
    description: {
      en: "Archived event entry. Silent Hell took 1st place. VOD on YouTube.",
      ar: "إدخال أرشيفي. سايلنت هيل في المركز الأول. الفيديو على يوتيوب.",
    },
    mode: "Squad",
    map: "Erangel",
    prize_pool: 200000,
    prize_currency: "DZD",
    entry_fee: 0,
    capacity: 16,
    start_at: iso(-90),
    registration_closes_at: iso(-95),
    status: "completed",
    rules: { en: "", ar: "" },
    tag: "ARCHIVE",
  },
];

// ----- PRODUCTS -----
const products: Array<{ p: ProductSeed; variants?: Array<Pick<VariantSeed, "sku" | "size" | "stock_quantity">> }> = [
  {
    p: {
      slug: "inferno-hoodie",
      name: { en: "INFERNO HOODIE", ar: "هودي إنفيرنو" },
      description: {
        en: "Heavyweight 360 GSM hoodie in obsidian black. Embroidered hell-red squad crest.",
        ar: "هودي ثقيل ٣٦٠ غرام/م² بلون الأوبسيديان الأسود. شعار الفريق مطرز بالأحمر الجهنمي.",
      },
      category: "hoodie",
      base_price: 9500,
      images: [],
      is_active: true,
      is_featured: true,
      weight_grams: 700,
      display_order: 1,
    },
    variants: [
      { sku: "SH-HOOD-INF-S", size: "S", stock_quantity: 12 },
      { sku: "SH-HOOD-INF-M", size: "M", stock_quantity: 18 },
      { sku: "SH-HOOD-INF-L", size: "L", stock_quantity: 22 },
      { sku: "SH-HOOD-INF-XL", size: "XL", stock_quantity: 14 },
      { sku: "SH-HOOD-INF-2XL", size: "2XL", stock_quantity: 6 },
    ],
  },
  {
    p: {
      slug: "squad-jersey-2025",
      name: { en: "SQUAD JERSEY · 2025", ar: "قميص الفريق · ٢٠٢٥" },
      description: {
        en: "Official 2025 competition jersey. Sublimated graphics. Pro-fit.",
        ar: "قميص المنافسة الرسمي ٢٠٢٥. طباعة بالتسامي. مقاس احترافي.",
      },
      category: "jersey",
      base_price: 12000,
      images: [],
      is_active: true,
      is_featured: true,
      weight_grams: 250,
      display_order: 2,
    },
    variants: [
      { sku: "SH-JER-25-S", size: "S", stock_quantity: 10 },
      { sku: "SH-JER-25-M", size: "M", stock_quantity: 15 },
      { sku: "SH-JER-25-L", size: "L", stock_quantity: 20 },
      { sku: "SH-JER-25-XL", size: "XL", stock_quantity: 12 },
    ],
  },
  {
    p: {
      slug: "burn-quietly-tee",
      name: { en: "BURN QUIETLY TEE", ar: "تي شيرت اِحرق بصمت" },
      description: {
        en: "Heavyweight cotton tee. Front: skull crest. Back: 'BURN QUIETLY'.",
        ar: "تي شيرت قطني ثقيل. الأمام: شعار الجمجمة. الخلف: 'اِحرق بصمت'.",
      },
      category: "tee",
      base_price: 4500,
      images: [],
      is_active: true,
      is_featured: false,
      weight_grams: 200,
      display_order: 3,
    },
    variants: [
      { sku: "SH-TEE-BQ-S", size: "S", stock_quantity: 25 },
      { sku: "SH-TEE-BQ-M", size: "M", stock_quantity: 30 },
      { sku: "SH-TEE-BQ-L", size: "L", stock_quantity: 28 },
      { sku: "SH-TEE-BQ-XL", size: "XL", stock_quantity: 18 },
    ],
  },
  {
    p: {
      slug: "hell-mousepad-xxl",
      name: { en: "HELL MOUSEPAD · XXL", ar: "ماوس باد هيل · XXL" },
      description: {
        en: "900×400mm desk-spanning mat. Stitched edges. Anti-slip base.",
        ar: "حصيرة مكتب ٩٠٠×٤٠٠ ملم. حواف مخيطة. قاعدة مانعة للانزلاق.",
      },
      category: "mousepad",
      base_price: 5500,
      images: [],
      is_active: true,
      is_featured: false,
      weight_grams: 800,
      display_order: 4,
    },
    variants: [{ sku: "SH-MP-HEL-XXL", size: null, stock_quantity: 40 }],
  },
  {
    p: {
      slug: "skull-cap",
      name: { en: "SKULL EMBLEM CAP", ar: "قبعة شعار الجمجمة" },
      description: {
        en: "Snapback cap. Embroidered skull crest. One size.",
        ar: "قبعة سناب باك. شعار جمجمة مطرز. مقاس موحد.",
      },
      category: "cap",
      base_price: 3800,
      images: [],
      is_active: true,
      is_featured: false,
      weight_grams: 150,
      display_order: 5,
    },
    variants: [{ sku: "SH-CAP-SKL", size: null, stock_quantity: 35 }],
  },
  {
    p: {
      slug: "ember-stickers",
      name: { en: "EMBER STICKER PACK", ar: "حزمة ملصقات إمبر" },
      description: {
        en: "12-piece weatherproof vinyl sticker pack.",
        ar: "حزمة ملصقات فينيل مقاومة للماء، ١٢ قطعة.",
      },
      category: "sticker",
      base_price: 1000,
      images: [],
      is_active: true,
      is_featured: false,
      weight_grams: 50,
      display_order: 6,
    },
    variants: [{ sku: "SH-STK-EMB-12", size: null, stock_quantity: 100 }],
  },
];

// ----- GIVEAWAY -----
const giveaways: GiveawaySeed[] = [
  {
    slug: "drop-01-uc-bundle",
    title: { en: "DROP 01 · 60K UC BUNDLE", ar: "الإصدار ٠١ · حزمة ٦٠ ألف UC" },
    description: {
      en: "Free entry. Complete the four tasks below to lock in your spot.",
      ar: "دخول مجاني. أكمل المهام الأربع أدناه لتثبيت مكانك.",
    },
    prize_description: { en: "60,000 UC + Inferno AKM skin", ar: "٦٠٬٠٠٠ UC + سكين إنفيرنو AKM" },
    prize_image_url: null,
    estimated_value: "$1,200",
    entry_methods: [
      {
        type: "follow_x",
        label: { en: "Follow @SilentHellGG on X", ar: "تابع @SilentHellGG على X" },
        url: "https://twitter.com/SilentHellGG",
        weight: 1,
      },
      {
        type: "join_discord",
        label: { en: "Join the Silent Hell Discord", ar: "انضم إلى ديسكورد سايلنت هيل" },
        url: "https://discord.gg/silenthell",
        weight: 1,
      },
      {
        type: "subscribe_youtube",
        label: { en: "Subscribe to Silent Hell on YouTube", ar: "اشترك في يوتيوب سايلنت هيل" },
        url: "https://youtube.com/@SilentHellEsports",
        weight: 1,
      },
      {
        type: "share",
        label: { en: "Share this giveaway on your story", ar: "شارك السحب في قصتك" },
        url: "https://silenthellesports.com/giveaways/drop-01-uc-bundle",
        weight: 1,
      },
    ],
    starts_at: iso(-1),
    ends_at: iso(7),
    status: "active",
    drop_number: 1,
  },
];

// ----- PAGES -----
const pages: PageSeed[] = [
  {
    slug: "about",
    title: { en: "About Silent Hell", ar: "عن سايلنت هيل" },
    body: {
      en: "# About Silent Hell Esports\n\nSilent Hell Esports is an Algerian competitive PUBG Mobile organization founded in 2023. We compete across the MENA region in tournaments hosted by Tencent and partner organizers.\n\n## What we stand for\n\n- **Discipline.** Every match is preparation.\n- **Silence.** We don't talk. We win.\n- **Community.** Our Discord is open to everyone.\n\n## Where to find us\n\nWe stream on Twitch and post highlights on YouTube. Tournaments and news drop on X first.",
      ar: "# عن سايلنت هيل إسبورتس\n\nسايلنت هيل إسبورتس فريق جزائري تنافسي لـ PUBG Mobile تأسس عام ٢٠٢٣. نتنافس في منطقة MENA في بطولات تنظمها Tencent وشركاؤها.\n\n## مبادئنا\n\n- **الانضباط.** كل مباراة هي تحضير.\n- **الصمت.** لا نتكلم. نفوز.\n- **المجتمع.** ديسكوردنا مفتوح للجميع.\n\n## أين تجدنا\n\nنبث على Twitch وننشر اللحظات على YouTube. البطولات والأخبار تظهر على X أولاً.",
    },
    is_published: true,
    meta_description: {
      en: "About Silent Hell Esports — Algerian PUBG Mobile competitive team.",
      ar: "عن سايلنت هيل إسبورتس — فريق جزائري تنافسي لـ PUBG Mobile.",
    },
  },
  {
    slug: "terms",
    title: { en: "Terms of Service", ar: "شروط الخدمة" },
    body: {
      en: "# Terms of Service\n\nLast updated: 2026-04-25.\n\nBy using silenthellesports.com you agree to the following.\n\n## Orders & shipping\n\nAll orders are shipped via Yalidine within Algeria. Payment is cash on delivery (COD). You will be contacted to confirm your order before dispatch.\n\n## Returns\n\nUnopened items can be returned within 7 days of delivery. Contact us via Discord to start a return.\n\n## Event participation\n\nTournament rules are published on each event page. Cheating, toxic behavior, or impersonation results in immediate disqualification.\n\n## Liability\n\nWe are not responsible for issues caused by third-party platforms (PUBG Mobile, Discord, Yalidine).",
      ar: "# شروط الخدمة\n\nآخر تحديث: ٢٠٢٦-٠٤-٢٥.\n\nباستخدامك لـ silenthellesports.com فإنك توافق على ما يلي.\n\n## الطلبات والشحن\n\nجميع الطلبات تُشحن عبر يالدين داخل الجزائر. الدفع عند الاستلام نقداً. سيتم التواصل معك لتأكيد طلبك قبل الإرسال.\n\n## الإرجاع\n\nيمكن إرجاع المنتجات غير المفتوحة خلال ٧ أيام من التسليم. تواصل معنا عبر الديسكورد لبدء عملية الإرجاع.\n\n## المشاركة في البطولات\n\nقواعد البطولات منشورة في صفحة كل حدث. الغش أو السلوك السام أو انتحال الشخصية يؤدي إلى الإقصاء الفوري.\n\n## المسؤولية\n\nلسنا مسؤولين عن مشاكل المنصات الخارجية (PUBG Mobile، الديسكورد، يالدين).",
    },
    is_published: true,
    meta_description: {
      en: "Silent Hell Esports terms of service — orders, shipping, returns, event rules.",
      ar: "شروط خدمة سايلنت هيل إسبورتس — الطلبات، الشحن، الإرجاع، قواعد البطولات.",
    },
  },
  {
    slug: "privacy",
    title: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
    body: {
      en: "# Privacy Policy\n\nLast updated: 2026-04-25.\n\nWe collect only what we need to ship orders, run events, and contact winners.\n\n## What we collect\n\n- Order: name, phone, email (optional), shipping address, wilaya/commune.\n- Event signup: IGN, PUBG UID, Discord tag, contact phone.\n- Giveaway entry: email, Discord tag.\n\n## What we share\n\n- Yalidine: only the delivery details required to create your shipment.\n- Nothing else. We do not sell or trade data.\n\n## Cookies\n\nThe site uses functional cookies for cart and language preference, plus privacy-friendly analytics (Vercel Analytics).\n\n## Contact\n\nDM us on Discord to delete your data.",
      ar: "# سياسة الخصوصية\n\nآخر تحديث: ٢٠٢٦-٠٤-٢٥.\n\nنجمع فقط ما نحتاجه لشحن الطلبات وتنظيم البطولات والتواصل مع الفائزين.\n\n## ما نجمعه\n\n- الطلبات: الاسم، الهاتف، البريد (اختياري)، العنوان، الولاية/البلدية.\n- تسجيل البطولات: الاسم في اللعبة، معرّف PUBG، حساب الديسكورد، هاتف التواصل.\n- مشاركة السحوبات: البريد، حساب الديسكورد.\n\n## ما نشاركه\n\n- يالدين: فقط بيانات التسليم اللازمة لإنشاء الشحنة.\n- لا شيء آخر. لا نبيع البيانات.\n\n## الكوكيز\n\nالموقع يستخدم كوكيز وظيفية للسلة وتفضيل اللغة، بالإضافة إلى تحليلات تحترم الخصوصية (Vercel Analytics).\n\n## تواصل\n\nراسلنا على الديسكورد لحذف بياناتك.",
    },
    is_published: true,
    meta_description: {
      en: "Silent Hell Esports privacy policy — what we collect, what we share, how to delete.",
      ar: "سياسة خصوصية سايلنت هيل إسبورتس — ما نجمع، ما نشارك، كيفية الحذف.",
    },
  },
];

async function main(): Promise<void> {
  const client = createAdminClient();

  console.log("[seed-demo] events…");
  for (const ev of events) {
    const { data: existing } = await client
      .from("events")
      .select("id")
      .eq("slug", ev.slug)
      .maybeSingle();
    if (existing && "id" in existing && typeof existing.id === "string") {
      const { error } = await client.from("events").update(ev).eq("id", existing.id);
      if (error) throw new Error(`update event ${ev.slug}: ${error.message}`);
    } else {
      const { error } = await client.from("events").insert(ev);
      if (error) throw new Error(`insert event ${ev.slug}: ${error.message}`);
    }
  }
  console.log(`[seed-demo] events: ${events.length}`);

  console.log("[seed-demo] products + variants…");
  for (const { p, variants } of products) {
    const { data: existing } = await client
      .from("products")
      .select("id")
      .eq("slug", p.slug)
      .maybeSingle();
    let productId: string;
    if (existing && "id" in existing && typeof existing.id === "string") {
      productId = existing.id;
      const { error } = await client.from("products").update(p).eq("id", productId);
      if (error) throw new Error(`update product ${p.slug}: ${error.message}`);
    } else {
      const { data: ins, error } = await client.from("products").insert(p).select("id").single();
      if (error || !ins) throw new Error(`insert product ${p.slug}: ${error?.message}`);
      productId = (ins as { id: string }).id;
    }
    if (variants && variants.length > 0) {
      for (const v of variants) {
        const variantRow: VariantSeed = {
          product_id: productId,
          sku: v.sku,
          size: v.size,
          color: null,
          price_override: null,
          stock_quantity: v.stock_quantity,
          is_active: true,
        };
        const { error } = await client
          .from("product_variants")
          .upsert(variantRow, { onConflict: "sku" });
        if (error) throw new Error(`variant ${v.sku}: ${error.message}`);
      }
    }
  }
  console.log(`[seed-demo] products: ${products.length}`);

  console.log("[seed-demo] giveaways…");
  for (const g of giveaways) {
    const { data: existing } = await client
      .from("giveaways")
      .select("id")
      .eq("slug", g.slug)
      .maybeSingle();
    if (existing && "id" in existing && typeof existing.id === "string") {
      const { error } = await client.from("giveaways").update(g).eq("id", existing.id);
      if (error) throw new Error(`update giveaway ${g.slug}: ${error.message}`);
    } else {
      const { error } = await client.from("giveaways").insert(g);
      if (error) throw new Error(`insert giveaway ${g.slug}: ${error.message}`);
    }
  }
  console.log(`[seed-demo] giveaways: ${giveaways.length}`);

  console.log("[seed-demo] pages…");
  for (const pg of pages) {
    const { error } = await client.from("pages").upsert(pg, { onConflict: "slug" });
    if (error) throw new Error(`page ${pg.slug}: ${error.message}`);
  }
  console.log(`[seed-demo] pages: ${pages.length}`);

  console.log("[seed-demo] done.");
}

main().catch((err: unknown) => {
  console.error("[seed-demo] fatal:", err);
  process.exit(1);
});
