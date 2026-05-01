"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/routing";
import { signOutAction } from "@/lib/auth/actions";
import { LangSwitcher } from "./lang-switcher";
import { DiscordIcon } from "./discord-icon";

interface NavItem {
  key: "home" | "roster" | "store" | "events" | "giveaways";
  href: "/" | "/roster" | "/store" | "/events" | "/giveaways";
}

const ITEMS: NavItem[] = [
  { key: "home", href: "/" },
  { key: "roster", href: "/roster" },
  { key: "store", href: "/store" },
  { key: "events", href: "/events" },
  { key: "giveaways", href: "/giveaways" },
];

interface TopBarProps {
  discordUrl: string;
}

// Per-user state (auth + cart count) is fetched client-side from /api/me so
// the surrounding layout can stay fully cacheable on Vercel's CDN. The bar
// renders with neutral defaults (signed-out, cart=0) for ~1 frame, then the
// fetched values fill in. cart-changed and auth-changed events trigger a
// re-fetch when the user mutates their cart or signs in/out elsewhere.
export function TopBar({ discordUrl }: TopBarProps) {
  const t = useTranslations("nav");
  const ctaT = useTranslations("cta");
  const authT = useTranslations("auth");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();
  const [signedIn, setSignedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { signedIn?: boolean; cartCount?: number };
        if (cancelled) return;
        setSignedIn(Boolean(data.signedIn));
        setCartCount(Number.isFinite(data.cartCount) ? Number(data.cartCount) : 0);
      } catch {
        // Network failure → keep defaults; user can still navigate.
      }
    }
    refresh();
    const onCart = () => refresh();
    const onAuth = () => refresh();
    window.addEventListener("cart-changed", onCart);
    window.addEventListener("auth-changed", onAuth);
    return () => {
      cancelled = true;
      window.removeEventListener("cart-changed", onCart);
      window.removeEventListener("auth-changed", onAuth);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close drawer when route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: NavItem["href"]) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: scrolled || open ? "rgba(10,10,10,0.92)" : "transparent",
        backdropFilter: scrolled || open ? "blur(12px)" : "none",
        borderBottom:
          scrolled || open
            ? "1px solid rgba(230,0,19,0.25)"
            : "1px solid transparent",
        transition: "all 250ms ease",
      }}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 lg:px-10">
        <Link
          href="/"
          className="interactive flex flex-shrink-0 items-center gap-3"
          aria-label="Silent Hell — home"
        >
          <Image src="/logo.png" alt="" width={34} height={34} priority />
          <div className="hidden flex-col leading-none sm:flex">
            <span
              className="font-display text-base font-black tracking-wide uppercase"
              style={{ letterSpacing: "0.05em" }}
            >
              Silent Hell
            </span>
            <span
              className="font-mono text-[9px] tracking-[0.3em] uppercase"
              style={{ color: "var(--hell-red)" }}
            >
              ESPORTS · PUBG
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="font-display interactive text-sm font-bold uppercase italic transition-colors"
                style={{
                  color: active ? "var(--hell-red)" : "var(--bone)",
                  letterSpacing: "0.12em",
                }}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <LangSwitcher />
          <Link
            href="/store/cart"
            className="interactive relative inline-flex h-10 w-10 items-center justify-center"
            aria-label={t("cart")}
            style={{
              border: "1px solid rgba(230,0,19,0.4)",
              background: "transparent",
              color: "var(--bone)",
            }}
          >
            <CartGlyph />
            {cartCount > 0 ? (
              <span
                aria-hidden
                className="font-mono absolute -top-2 -right-2 flex h-5 min-w-[20px] items-center justify-center px-1 text-[10px] font-bold leading-none"
                style={{
                  background: "var(--hell-red)",
                  color: "var(--bone)",
                  letterSpacing: "0.05em",
                }}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
          <Link
            href={signedIn ? "/account" : "/login"}
            className="font-display interactive hidden text-xs font-bold tracking-wider uppercase italic md:inline-flex"
            style={{ color: "var(--bone)", letterSpacing: "0.12em" }}
          >
            {signedIn ? authT("topbarAccount") : authT("topbarLogin")}
          </Link>
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-hell hidden sm:inline-flex"
            style={{ padding: "10px 16px", fontSize: 12 }}
          >
            <DiscordIcon />
            {ctaT("discord")}
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="interactive flex h-10 w-10 flex-col items-center justify-center lg:hidden"
            aria-label={t("menu")}
            aria-expanded={open}
            style={{
              background: open ? "var(--hell-red)" : "transparent",
              border: "1px solid rgba(230,0,19,0.4)",
            }}
          >
            <span
              style={{
                display: "block",
                width: 18,
                height: 2,
                background: "var(--bone)",
                transform: open ? "translateY(3px) rotate(45deg)" : "none",
                transition: "transform 200ms",
              }}
            />
            <span
              style={{
                display: "block",
                width: 18,
                height: 2,
                background: "var(--bone)",
                marginTop: 4,
                transform: open ? "translateY(-3px) rotate(-45deg)" : "none",
                transition: "transform 200ms",
              }}
            />
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="grain lg:hidden"
          style={{
            background: "rgba(10,10,10,0.98)",
            borderTop: "1px solid rgba(230,0,19,0.3)",
          }}
        >
          <nav className="flex flex-col px-5 py-6" aria-label="Mobile">
            {ITEMS.map((item, i) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="font-display interactive flex items-center justify-between border-b py-4 font-black uppercase italic"
                  style={{
                    fontSize: 28,
                    color: active ? "var(--hell-red)" : "var(--bone)",
                    letterSpacing: "0.08em",
                    borderColor: "rgba(245,240,232,0.08)",
                  }}
                >
                  <span>{t(item.key)}</span>
                  <span
                    className="font-mono text-[10px] tracking-[0.25em]"
                    style={{ color: "rgba(245,240,232,0.4)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </Link>
              );
            })}
            <div
              className="mt-6 flex flex-col gap-3 border-t pt-6"
              style={{ borderColor: "rgba(245,240,232,0.08)" }}
            >
              {signedIn ? (
                <>
                  <Link
                    href="/account"
                    className="font-mono text-[11px] tracking-[0.25em] uppercase interactive flex items-center justify-center"
                    style={{
                      background: "var(--ash-3)",
                      color: "var(--bone)",
                      border: "1px solid rgba(245,240,232,0.15)",
                      padding: "12px 18px",
                    }}
                  >
                    {authT("topbarAccount")}
                  </Link>
                  <button
                    type="button"
                    disabled={signingOut}
                    onClick={() =>
                      startSignOut(async () => {
                        await signOutAction();
                        window.dispatchEvent(new CustomEvent("auth-changed"));
                      })
                    }
                    className="font-mono text-[11px] tracking-[0.25em] uppercase interactive"
                    style={{
                      background: "var(--ash-3)",
                      color: "var(--bone)",
                      border: "1px solid rgba(230,0,19,0.4)",
                      padding: "12px 18px",
                    }}
                  >
                    {authT("topbarSignout")}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="font-mono text-[11px] tracking-[0.25em] uppercase interactive flex items-center justify-center"
                  style={{
                    background: "var(--ash-3)",
                    color: "var(--bone)",
                    border: "1px solid rgba(230,0,19,0.4)",
                    padding: "12px 18px",
                  }}
                >
                  {authT("topbarLogin")}
                </Link>
              )}
              <a
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hell justify-center sm:hidden"
              >
                <DiscordIcon />
                {ctaT("joinDiscord")}
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function CartGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
    >
      <path d="M3 4h2l2.5 12h11l2-9H6.5" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
    </svg>
  );
}
