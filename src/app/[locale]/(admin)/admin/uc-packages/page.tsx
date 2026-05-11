import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { listUcPackagesAdmin } from "@/lib/admin/data/uc-packages";
import { UcPackagesEditor } from "./uc-packages-editor";

export default async function AdminUcPackagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const packages = await listUcPackagesAdmin();

  return (
    <div>
      <div className="mb-6">
        <div
          className="font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {"// UC PACKAGES"}
        </div>
        <h1
          className="font-display mt-1 text-3xl font-black uppercase italic"
          style={{ color: "var(--bone)" }}
        >
          UC Packages{" "}
          <span style={{ color: "rgba(245,240,232,0.4)" }}>({packages.length})</span>
        </h1>
      </div>

      <UcPackagesEditor packages={packages} />
    </div>
  );
}
