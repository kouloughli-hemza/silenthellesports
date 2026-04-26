import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link, isLocale } from "@/lib/i18n/routing";
import { EmberField } from "@/components/brand";
import { LangSwitcher } from "@/components/layout/lang-switcher";

export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <div className="grain relative min-h-screen overflow-hidden" style={{ background: "var(--black)" }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 80%, rgba(230,0,19,0.18), transparent 70%)",
        }}
        aria-hidden
      />
      <EmberField count={20} opacity={0.4} />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="interactive flex items-center gap-3">
          <Image src="/logo.png" alt="Silent Hell" width={32} height={32} />
          <span
            className="font-display text-base font-black tracking-wider uppercase"
            style={{ letterSpacing: "0.05em" }}
          >
            Silent Hell
          </span>
        </Link>
        <LangSwitcher />
      </header>

      <main id="main" className="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
