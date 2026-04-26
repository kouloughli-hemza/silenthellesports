import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic"; // admin pages must always re-check auth

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const profile = await requireAdmin();

  return (
    <AdminShell locale={locale} profile={profile}>
      {children}
    </AdminShell>
  );
}
