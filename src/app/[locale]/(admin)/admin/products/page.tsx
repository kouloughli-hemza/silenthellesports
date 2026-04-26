import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { listProducts } from "@/lib/admin/data/products";
import { formatPrice, pickTranslation, type Locale } from "@/types/domain";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const products = await listProducts();

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {"// PRODUCTS"}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            Products <span style={{ color: "rgba(245,240,232,0.4)" }}>({products.length})</span>
          </h1>
        </div>
        <Link
          href={"/admin/products/new" as never}
          className="btn-hell"
          style={{ padding: "12px 20px", fontSize: 13 }}
        >
          + NEW PRODUCT
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="notch p-8 text-center" style={{ background: "var(--ash-1)" }}>
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No products yet.
          </p>
        </div>
      ) : (
        <div className="notch overflow-x-auto" style={{ background: "var(--ash-1)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--ash-3)", borderBottom: "1px solid rgba(230,0,19,0.25)" }}>
                <Th>Slug</Th>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Active</Th>
                <Th>Featured</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const name = (p.name ?? {}) as { en?: string; ar?: string };
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
                    <Td>
                      <span className="font-mono text-[11px]">{p.slug}</span>
                    </Td>
                    <Td>{pickTranslation(name as { en: string; ar: string }, locale as Locale)}</Td>
                    <Td>
                      <span
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{ color: "var(--ember)" }}
                      >
                        {p.category}
                      </span>
                    </Td>
                    <Td>{formatPrice(p.base_price, locale as Locale, "DZD")}</Td>
                    <Td>
                      <Dot on={p.is_active} />
                    </Td>
                    <Td>
                      <Dot on={p.is_featured} color="var(--ember)" />
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/products/${p.id}/edit` as never}
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{ color: "var(--hell-red)" }}
                      >
                        EDIT →
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="px-3 py-2 text-left font-mono text-[10px] tracking-[0.2em] uppercase"
      style={{ color: "rgba(245,240,232,0.55)" }}
    >
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-3 align-top">{children}</td>;
}
function Dot({ on, color = "var(--hell-red)" }: { on: boolean; color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: on ? color : "rgba(245,240,232,0.25)",
        boxShadow: on ? `0 0 8px ${color}` : "none",
      }}
    />
  );
}
