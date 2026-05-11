import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import {
  getProofSignedUrl,
  getUcRequestByNumber,
} from "@/lib/admin/data/uc-requests";
import { formatPrice, type Locale } from "@/types/domain";
import { formatDateLong } from "@/lib/utils/format";
import {
  buildStatusMessage,
  buildWhatsAppLink,
  normalizeDzPhone,
  type UcStatusForMessage,
} from "@/lib/uc/whatsapp";
import {
  markDeliveredAction,
  markPaymentReceivedAction,
  rejectRequestAction,
  updateAdminNotesAction,
} from "@/lib/admin/actions/uc-requests";

const STATUS_COLOR: Record<string, string> = {
  pending: "var(--ember)",
  payment_received: "var(--bone)",
  delivered: "rgba(120,255,150,0.85)",
  rejected: "var(--hell-red)",
  cancelled: "rgba(245,240,232,0.4)",
};

export default async function AdminUcRequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; requestNumber: string }>;
}) {
  const { locale, requestNumber } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const req = await getUcRequestByNumber(requestNumber);
  if (!req) notFound();

  const tLocale = locale as Locale;
  const proofSignedUrl = await getProofSignedUrl(req.proof_url);
  const deliverySignedUrl = req.delivery_screenshot_url
    ? await getProofSignedUrl(req.delivery_screenshot_url)
    : null;

  const phoneE164 = normalizeDzPhone(req.whatsapp_phone);
  const whatsappStatus: UcStatusForMessage =
    req.status === "cancelled"
      ? "rejected"
      : (req.status as UcStatusForMessage);
  const whatsappMessage = buildStatusMessage(whatsappStatus, {
    ign: req.ign,
    pubg_id: req.pubg_id,
    request_number: req.request_number,
    uc_amount: req.uc_amount_snapshot,
    bonus_uc: req.bonus_uc_snapshot,
    rejection_reason: req.rejection_reason ?? undefined,
  });
  const whatsappHref = phoneE164 ? buildWhatsAppLink(phoneE164, whatsappMessage) : null;

  const isFinal = req.status === "delivered" || req.status === "cancelled";

  return (
    <div>
      <Link
        href={"/admin/uc-recharges" as never}
        className="font-mono text-[10px] tracking-[0.25em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        ← BACK TO REQUESTS
      </Link>

      <div className="mt-4 mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {`// REQUEST ${req.request_number}`}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            {req.uc_amount_snapshot} UC
            {req.bonus_uc_snapshot > 0 ? (
              <span style={{ color: "var(--ember)" }}> + {req.bonus_uc_snapshot}</span>
            ) : null}
          </h1>
          <p
            className="mt-1 font-mono text-xs"
            style={{ color: "rgba(245,240,232,0.6)" }}
          >
            {formatPrice(Number(req.price_dzd_snapshot), tLocale, "DZD")} ·{" "}
            {formatDateLong(req.created_at, tLocale)}
          </p>
        </div>
        <span
          className="font-mono text-xs tracking-[0.2em] uppercase"
          style={{
            background: STATUS_COLOR[req.status] ?? "var(--hell-red)",
            color: "var(--black)",
            padding: "6px 14px",
          }}
        >
          {req.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-6">
          <div className="notch p-6" style={{ background: "var(--ash-1)" }}>
            <div
              className="mb-3 font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "rgba(245,240,232,0.55)" }}
            >
              {"// PAYMENT PROOF"}
            </div>
            {proofSignedUrl ? (
              proofSignedUrl.toLowerCase().includes(".pdf") ? (
                <a
                  href={proofSignedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs underline"
                  style={{ color: "var(--hell-red)" }}
                >
                  Open proof PDF →
                </a>
              ) : (
                <div className="relative w-full" style={{ maxWidth: 720 }}>
                  <a href={proofSignedUrl} target="_blank" rel="noreferrer">
                    <Image
                      src={proofSignedUrl}
                      alt="Payment proof"
                      width={720}
                      height={960}
                      className="h-auto w-full"
                      style={{ background: "var(--ash-3)" }}
                      unoptimized
                    />
                  </a>
                </div>
              )
            ) : (
              <p
                className="font-mono text-[11px]"
                style={{ color: "rgba(245,240,232,0.55)" }}
              >
                Proof unavailable.
              </p>
            )}
            <div
              className="mt-3 font-mono text-[11px]"
              style={{ color: "rgba(245,240,232,0.55)" }}
            >
              Method:{" "}
              <span style={{ color: "var(--ember)" }}>{req.payment_method}</span>
              {req.transfer_code ? ` · Ref: ${req.transfer_code}` : ""}
            </div>
          </div>

          {deliverySignedUrl ? (
            <div className="notch p-6" style={{ background: "var(--ash-1)" }}>
              <div
                className="mb-3 font-mono text-[10px] tracking-[0.3em] uppercase"
                style={{ color: "rgba(245,240,232,0.55)" }}
              >
                {"// DELIVERY SCREENSHOT"}
              </div>
              <a href={deliverySignedUrl} target="_blank" rel="noreferrer">
                <Image
                  src={deliverySignedUrl}
                  alt="Delivery proof"
                  width={720}
                  height={960}
                  className="h-auto w-full"
                  style={{ background: "var(--ash-3)" }}
                  unoptimized
                />
              </a>
            </div>
          ) : null}

          <form
            action={async (formData) => {
              "use server";
              await updateAdminNotesAction(req.id, formData);
            }}
            className="notch p-6 space-y-3"
            style={{ background: "var(--ash-1)" }}
          >
            <div
              className="font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "rgba(245,240,232,0.55)" }}
            >
              {"// ADMIN NOTES (private)"}
            </div>
            <textarea
              name="admin_notes"
              defaultValue={req.admin_notes ?? ""}
              rows={4}
              className="field"
              placeholder="Internal notes — not shown to customer."
            />
            <button
              type="submit"
              className="btn-ghost"
              style={{ padding: "10px 18px", fontSize: 12 }}
            >
              SAVE NOTES
            </button>
          </form>

          {req.rejection_reason ? (
            <div
              className="notch p-6"
              style={{
                background: "rgba(230,0,19,0.08)",
                border: "1px solid var(--hell-red)",
              }}
            >
              <div
                className="mb-2 font-mono text-[10px] tracking-[0.3em] uppercase"
                style={{ color: "var(--hell-red)" }}
              >
                {"// REJECTION REASON"}
              </div>
              <p className="text-sm">{req.rejection_reason}</p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <section className="notch p-6" style={{ background: "var(--ash-1)" }}>
            <div
              className="mb-3 font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "rgba(245,240,232,0.55)" }}
            >
              {"// CUSTOMER"}
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span
                  className="font-mono text-[10px] tracking-[0.15em] uppercase"
                  style={{ color: "rgba(245,240,232,0.5)" }}
                >
                  IGN
                </span>
                <div>{req.ign}</div>
              </div>
              <div>
                <span
                  className="font-mono text-[10px] tracking-[0.15em] uppercase"
                  style={{ color: "rgba(245,240,232,0.5)" }}
                >
                  PUBG ID
                </span>
                <div className="font-mono">{req.pubg_id}</div>
              </div>
              <div>
                <span
                  className="font-mono text-[10px] tracking-[0.15em] uppercase"
                  style={{ color: "rgba(245,240,232,0.5)" }}
                >
                  WhatsApp
                </span>
                <div className="font-mono">{req.whatsapp_phone}</div>
              </div>
              {req.email ? (
                <div>
                  <span
                    className="font-mono text-[10px] tracking-[0.15em] uppercase"
                    style={{ color: "rgba(245,240,232,0.5)" }}
                  >
                    Email
                  </span>
                  <div>{req.email}</div>
                </div>
              ) : null}
            </div>

            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="btn-hell mt-4 inline-flex items-center justify-center gap-2"
                style={{ padding: "12px 18px", fontSize: 12 }}
              >
                <span>WHATSAPP CUSTOMER</span>
                <span aria-hidden>→</span>
              </a>
            ) : (
              <p
                className="mt-3 font-mono text-[10px]"
                style={{ color: "var(--hell-red)" }}
              >
                Phone not normalizable to Algerian format — message manually.
              </p>
            )}
            <p
              className="mt-2 font-mono text-[10px] leading-relaxed"
              style={{ color: "rgba(245,240,232,0.45)" }}
            >
              Opens WhatsApp with a status message prefilled. Review before
              sending.
            </p>
          </section>

          <section className="notch p-6" style={{ background: "var(--ash-1)" }}>
            <div
              className="mb-3 font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "var(--hell-red)" }}
            >
              {"// ACTIONS"}
            </div>
            {isFinal ? (
              <p
                className="font-mono text-[11px]"
                style={{ color: "rgba(245,240,232,0.55)" }}
              >
                Request is in a final state ({req.status}). No further actions.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {req.status === "pending" ? (
                  <form
                    action={async () => {
                      "use server";
                      await markPaymentReceivedAction(req.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="btn-hell w-full"
                      style={{ padding: "10px 18px", fontSize: 12 }}
                    >
                      MARK PAYMENT RECEIVED
                    </button>
                  </form>
                ) : null}

                {req.status === "pending" || req.status === "payment_received" ? (
                  <form
                    action={async (formData) => {
                      "use server";
                      await markDeliveredAction(req.id, formData);
                    }}
                    className="space-y-2"
                    encType="multipart/form-data"
                  >
                    <label
                      className="font-mono text-[10px] tracking-[0.15em] uppercase"
                      style={{ color: "rgba(245,240,232,0.5)" }}
                    >
                      Delivery screenshot (optional)
                    </label>
                    <input
                      type="file"
                      name="delivery_screenshot"
                      accept="image/png,image/jpeg,image/webp"
                      className="field"
                    />
                    <button
                      type="submit"
                      className="btn-hell w-full"
                      style={{ padding: "10px 18px", fontSize: 12 }}
                    >
                      MARK DELIVERED
                    </button>
                  </form>
                ) : null}

                <form
                  action={async (formData) => {
                    "use server";
                    await rejectRequestAction(req.id, formData);
                  }}
                  className="space-y-2 border-t pt-3"
                  style={{ borderColor: "rgba(245,240,232,0.1)" }}
                >
                  <label
                    className="font-mono text-[10px] tracking-[0.15em] uppercase"
                    style={{ color: "rgba(245,240,232,0.5)" }}
                  >
                    Rejection reason
                  </label>
                  <input
                    name="reason"
                    placeholder="e.g. payment not received"
                    className="field"
                  />
                  <button
                    type="submit"
                    className="btn-ghost w-full"
                    style={{ padding: "10px 18px", fontSize: 12 }}
                  >
                    REJECT
                  </button>
                </form>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
