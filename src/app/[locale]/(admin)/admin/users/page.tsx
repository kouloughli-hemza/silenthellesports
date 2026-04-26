import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { isLocale } from "@/lib/i18n/routing";
import { listProfiles } from "@/lib/admin/data/users";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { fail, ok, type Result } from "@/types/domain";
import { formatDateLong } from "@/lib/utils/format";
import type { Locale } from "@/types/domain";

async function setRoleAction(
  userId: string,
  role: "customer" | "admin",
): Promise<Result<{ id: string }>> {
  "use server";
  const profile = await requireAdmin();
  const parsed = z.object({ id: z.string().uuid(), role: z.enum(["customer", "admin"]) }).safeParse({
    id: userId,
    role,
  });
  if (!parsed.success) return fail("Invalid input.");
  if (parsed.data.id === profile.id && parsed.data.role !== "admin") {
    return fail("You can't demote yourself.");
  }
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role } as never)
    .eq("id", parsed.data.id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: parsed.data.role === "admin" ? "user.promote" : "user.demote",
    entityType: "profile",
    entityId: parsed.data.id,
    after: { role: parsed.data.role },
  });
  revalidatePath("/en/admin/users");
  revalidatePath("/ar/admin/users");
  return ok({ id: parsed.data.id });
}

async function promoteFormAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  await setRoleAction(id, "admin");
  redirect("/admin/users");
}

async function demoteFormAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  await setRoleAction(id, "customer");
  redirect("/admin/users");
}

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const sp = await searchParams;

  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { rows, total } = await listProfiles({ page, pageSize: 25, q: sp.q });
  const me = await requireAdmin();

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {"// USERS"}
      </div>
      <h1
        className="font-display mt-1 mb-6 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        Users <span style={{ color: "rgba(245,240,232,0.4)" }}>({total})</span>
      </h1>

      <form
        method="get"
        className="mb-4 flex gap-2"
        style={{ background: "var(--ash-1)", padding: "8px" }}
      >
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search by email"
          className="field flex-1"
        />
        <button type="submit" className="btn-hell" style={{ padding: "10px 20px", fontSize: 12 }}>
          Search
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="notch p-8 text-center" style={{ background: "var(--ash-1)" }}>
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No users found.
          </p>
        </div>
      ) : (
        <div className="notch overflow-x-auto" style={{ background: "var(--ash-1)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--ash-3)" }}>
                <Th>Email</Th>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Joined</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
                  <Td>
                    <span className="font-mono text-xs">{u.email}</span>
                  </Td>
                  <Td>{u.full_name ?? "—"}</Td>
                  <Td>
                    <span
                      className="font-mono text-[10px] tracking-[0.2em] uppercase"
                      style={{
                        color: u.role === "admin" ? "var(--hell-red)" : "rgba(245,240,232,0.5)",
                      }}
                    >
                      {u.role}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-mono text-[11px]">
                      {formatDateLong(u.created_at, locale as Locale)}
                    </span>
                  </Td>
                  <Td>
                    {u.role === "customer" ? (
                      <form action={promoteFormAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          className="font-mono text-[10px] tracking-[0.2em] uppercase"
                          style={{ color: "var(--hell-red)" }}
                        >
                          PROMOTE →
                        </button>
                      </form>
                    ) : u.id !== me.id ? (
                      <form action={demoteFormAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          className="font-mono text-[10px] tracking-[0.2em] uppercase"
                          style={{ color: "rgba(245,240,232,0.5)" }}
                        >
                          REVOKE
                        </button>
                      </form>
                    ) : (
                      <span
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{ color: "rgba(245,240,232,0.3)" }}
                      >
                        (you)
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
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
