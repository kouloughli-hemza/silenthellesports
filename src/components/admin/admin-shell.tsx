import type { ReactNode } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { LangSwitcher } from "@/components/layout/lang-switcher";
import { signOutAction } from "@/lib/auth/actions";
import type { Locale, Profile } from "@/types/domain";

interface AdminShellProps {
  children: ReactNode;
  locale: Locale;
  profile: Profile;
}

interface NavItem {
  href:
    | "/admin"
    | "/admin/orders"
    | "/admin/uc-recharges"
    | "/admin/uc-packages"
    | "/admin/events"
    | "/admin/giveaways"
    | "/admin/products"
    | "/admin/roster"
    | "/admin/trophies"
    | "/admin/chronicle"
    | "/admin/stats"
    | "/admin/tactics"
    | "/admin/gallery"
    | "/admin/pages"
    | "/admin/site-config"
    | "/admin/users"
    | "/admin/audit";
  labelKey: string;
}

const NAV: NavItem[] = [
  { href: "/admin", labelKey: "overview" },
  { href: "/admin/orders", labelKey: "orders" },
  { href: "/admin/uc-recharges", labelKey: "ucRecharges" },
  { href: "/admin/uc-packages", labelKey: "ucPackages" },
  { href: "/admin/events", labelKey: "events" },
  { href: "/admin/giveaways", labelKey: "giveaways" },
  { href: "/admin/products", labelKey: "products" },
  { href: "/admin/roster", labelKey: "roster" },
  { href: "/admin/trophies", labelKey: "trophies" },
  { href: "/admin/chronicle", labelKey: "chronicle" },
  { href: "/admin/stats", labelKey: "stats" },
  { href: "/admin/tactics", labelKey: "tactics" },
  { href: "/admin/gallery", labelKey: "gallery" },
  { href: "/admin/pages", labelKey: "pages" },
  { href: "/admin/site-config", labelKey: "siteConfig" },
  { href: "/admin/users", labelKey: "users" },
  { href: "/admin/audit", labelKey: "audit" },
];

export async function AdminShell({ children, locale, profile }: AdminShellProps) {
  const t = await getTranslations({ locale, namespace: "admin.nav" });
  const tShell = await getTranslations({ locale, namespace: "admin.shell" });

  return (
    <div className="grain min-h-screen" style={{ background: "var(--black)" }}>
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: "rgba(10,10,10,0.92)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(230,0,19,0.3)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="interactive flex items-center gap-2">
              <Image src="/logo.png" alt="" width={28} height={28} />
              <span
                className="font-display text-sm font-black uppercase italic"
                style={{ letterSpacing: "0.05em" }}
              >
                Silent Hell
              </span>
            </Link>
            <span
              className="font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "var(--hell-red)" }}
            >
              {tShell("badge")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden font-mono text-[10px] tracking-[0.2em] uppercase md:inline"
              style={{ color: "rgba(245,240,232,0.5)" }}
            >
              {profile.email}
            </span>
            <LangSwitcher />
            <form action={signOutAction}>
              <button
                type="submit"
                className="interactive font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: "var(--bone)",
                  border: "1px solid rgba(230,0,19,0.4)",
                  padding: "6px 12px",
                  background: "transparent",
                }}
              >
                {tShell("signOut")}
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-5 py-6 md:flex-row lg:px-8">
        <nav
          aria-label={tShell("navAria")}
          className="flex flex-row flex-wrap gap-1 md:w-56 md:flex-col md:flex-nowrap"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="interactive font-display text-xs font-bold tracking-wider uppercase italic"
              style={{
                color: "var(--bone)",
                padding: "10px 14px",
                background: "var(--ash-1)",
                borderLeft: "3px solid transparent",
              }}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
