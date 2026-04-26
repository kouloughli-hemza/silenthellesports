import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";

interface Counts {
  ordersPending: number;
  ordersToday: number;
  signupsPending: number;
  giveawayActive: number;
  productsActive: number;
  pagesPublished: number;
}

async function loadCounts(): Promise<Counts> {
  const supabase = createAdminClient();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [
    ordersPending,
    ordersToday,
    signupsPending,
    giveawayActive,
    productsActive,
    pagesPublished,
  ] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayIso),
    supabase
      .from("event_signups")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "pending"),
    supabase.from("giveaways").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("pages").select("id", { count: "exact", head: true }).eq("is_published", true),
  ]);

  return {
    ordersPending: ordersPending.count ?? 0,
    ordersToday: ordersToday.count ?? 0,
    signupsPending: signupsPending.count ?? 0,
    giveawayActive: giveawayActive.count ?? 0,
    productsActive: productsActive.count ?? 0,
    pagesPublished: pagesPublished.count ?? 0,
  };
}

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.overview" });
  const counts = await loadCounts();

  const tiles: Array<{ label: string; value: number; href: "/admin/orders" | "/admin/events" | "/admin/giveaways" | "/admin/products" | "/admin/pages" }> = [
    { label: t("ordersPending"), value: counts.ordersPending, href: "/admin/orders" },
    { label: t("ordersToday"), value: counts.ordersToday, href: "/admin/orders" },
    { label: t("signupsPending"), value: counts.signupsPending, href: "/admin/events" },
    { label: t("giveawayActive"), value: counts.giveawayActive, href: "/admin/giveaways" },
    { label: t("productsActive"), value: counts.productsActive, href: "/admin/products" },
    { label: t("pagesPublished"), value: counts.pagesPublished, href: "/admin/pages" },
  ];

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// ${t("eyebrow")}`}
      </div>
      <h1
        className="font-display mt-2 text-3xl font-black uppercase italic md:text-4xl"
        style={{ color: "var(--bone)" }}
      >
        {t("title")}
      </h1>
      <p className="mt-3 font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
        {t("sub")}
      </p>

      <div
        className="mt-8 grid grid-cols-2 gap-px md:grid-cols-3"
        style={{ background: "rgba(230,0,19,0.25)" }}
      >
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="interactive p-5 transition-colors"
            style={{ background: "var(--ash-1)" }}
          >
            <div
              className="font-mono text-[10px] tracking-[0.25em] uppercase"
              style={{ color: "rgba(245,240,232,0.55)" }}
            >
              {tile.label}
            </div>
            <div
              className="font-display mt-2 text-4xl font-black"
              style={{ color: tile.value > 0 ? "var(--hell-red)" : "var(--bone)" }}
            >
              {tile.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <div
          className="font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {`// ${t("quickLinks")}`}
        </div>
        <ul className="mt-4 space-y-2 font-mono text-xs">
          <li>
            <Link href="/admin/orders" className="interactive" style={{ color: "var(--bone)" }}>
              → {t("linkOrders")}
            </Link>
          </li>
          <li>
            <Link href="/admin/events" className="interactive" style={{ color: "var(--bone)" }}>
              → {t("linkEvents")}
            </Link>
          </li>
          <li>
            <Link
              href="/admin/site-config"
              className="interactive"
              style={{ color: "var(--bone)" }}
            >
              → {t("linkSiteConfig")}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
