"use server";

// Server actions that power the checkout form: live commune/stopdesk lookups,
// fee preview, and the final placeOrder action. All Yalidine calls happen here
// (server-only); the client only sees Result envelopes.

import { z } from "zod";

import { yalidine } from "@/services/yalidine";
import type { Commune, Stopdesk } from "@/services/yalidine";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { brandedTemplate, sendEmail } from "@/services/email";
import {
  ALGERIAN_PHONE_RE,
  fail,
  ok,
  pickTranslation,
  type Locale,
  type Result,
} from "@/types/domain";
import type { Insert } from "@/types/database";

import { clearCart } from "./cookie";
import { readDetailedCart } from "./detail";

const WilayaCode = z.coerce.number().int().min(1).max(58);

export async function getCommunesAction(
  wilayaCode: number,
): Promise<Result<{ communes: Commune[] }>> {
  try {
    const code = WilayaCode.safeParse(wilayaCode);
    if (!code.success) return fail("Invalid wilaya code.");
    const communes = await yalidine.getCommunes(code.data);
    return ok({ communes });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to load communes.");
  }
}

export async function getStopdesksAction(
  wilayaCode: number,
): Promise<Result<{ stopdesks: Stopdesk[] }>> {
  try {
    const code = WilayaCode.safeParse(wilayaCode);
    if (!code.success) return fail("Invalid wilaya code.");
    const stopdesks = await yalidine.getStopdesks(code.data);
    return ok({ stopdesks });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to load stopdesks.");
  }
}

const FeeSchema = z.object({
  toWilayaCode: WilayaCode,
  weightGrams: z.coerce.number().int().min(1).max(50_000),
  isStopdesk: z.boolean(),
});

export async function calculateFeeAction(input: {
  toWilayaCode: number;
  weightGrams: number;
  isStopdesk: boolean;
}): Promise<Result<{ fee: number; home: number; stopdesk: number }>> {
  try {
    const parsed = FeeSchema.safeParse(input);
    if (!parsed.success) return fail("Invalid fee input.");
    const env = getServerEnv();
    const quote = await yalidine.calculateFee({
      fromWilayaCode: env.YALIDINE_FROM_WILAYA_CODE,
      toWilayaCode: parsed.data.toWilayaCode,
      weightGrams: parsed.data.weightGrams,
      isStopdesk: parsed.data.isStopdesk,
    });
    const fee = parsed.data.isStopdesk ? quote.stopdesk : quote.home;
    return ok({ fee, home: quote.home, stopdesk: quote.stopdesk });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to calculate fee.");
  }
}

const PlaceOrderSchema = z
  .object({
    locale: z.enum(["en", "ar"]),
    name: z.string().trim().min(2).max(80),
    phone: z.string().regex(ALGERIAN_PHONE_RE, "phoneInvalid"),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    wilayaCode: WilayaCode,
    communeName: z.string().trim().min(1).max(120),
    address: z.string().trim().min(5).max(400),
    isStopdesk: z.boolean(),
    stopdeskId: z.number().int().positive().nullable(),
  })
  .refine((d) => (d.isStopdesk ? d.stopdeskId !== null : true), {
    message: "stopdeskRequired",
    path: ["stopdeskId"],
  });

export async function placeOrderAction(
  rawInput: unknown,
): Promise<Result<{ orderNumber: string; locale: Locale }>> {
  try {
    // Sign-in gate — checkout requires an authenticated user.
    const sessionUser = await getSessionUser();
    if (!sessionUser) return fail("signInRequired");

    const parsed = PlaceOrderSchema.safeParse(rawInput);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return fail(first?.message ?? "genericError");
    }
    const data = parsed.data;

    const detailed = await readDetailedCart();
    if (detailed.lines.length === 0) return fail("cartEmpty");

    // Out-of-stock guard — re-check stock server-side.
    for (const dl of detailed.lines) {
      if (dl.variant) {
        if (dl.variant.stock_quantity < dl.line.quantity) {
          return fail("oosVariant");
        }
      }
    }

    const env = getServerEnv();

    // Re-calculate fee server-side (don't trust client).
    let fee: number;
    try {
      const quote = await yalidine.calculateFee({
        fromWilayaCode: env.YALIDINE_FROM_WILAYA_CODE,
        toWilayaCode: data.wilayaCode,
        weightGrams: detailed.totalWeightGrams,
        isStopdesk: data.isStopdesk,
      });
      fee = data.isStopdesk ? quote.stopdesk : quote.home;
    } catch {
      return fail("noShippingTo");
    }

    const subtotal = detailed.subtotal;
    const total = subtotal + fee;

    const supabase = createAdminClient();

    const orderInsert: Insert<"orders"> = {
      customer_name: data.name,
      customer_phone: data.phone,
      customer_email: data.email ?? null,
      shipping_wilaya_code: data.wilayaCode,
      shipping_commune_name: data.communeName,
      shipping_address: data.address,
      is_stopdesk: data.isStopdesk,
      stopdesk_id: data.isStopdesk ? data.stopdeskId : null,
      subtotal,
      shipping_fee: fee,
      total,
      currency: "DZD",
      status: "pending",
      user_id: sessionUser.id,
    };

    const { data: orderRow, error: orderErr } = await supabase
      .from("orders")
      .insert(orderInsert)
      .select("id, order_number")
      .single();

    if (orderErr || !orderRow) {
      return fail(orderErr?.message ?? "Could not create order.");
    }

    const itemsInsert: Insert<"order_items">[] = detailed.lines.map((dl) => ({
      order_id: orderRow.id,
      product_id: dl.product.id,
      variant_id: dl.variant ? dl.variant.id : null,
      product_name_snapshot:
        pickTranslation(dl.product.name, data.locale) || dl.product.slug,
      variant_label_snapshot: dl.variantLabel,
      // Snapshot the custom print name (jersey, etc.) so the line stays
      // recoverable even if the buyer's cookie is gone.
      custom_name: dl.line.customName ?? null,
      quantity: dl.line.quantity,
      unit_price: dl.unitPrice,
      line_total: dl.lineTotal,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(itemsInsert);
    if (itemsErr) {
      // Best-effort cleanup so we don't leave an order with no items.
      await supabase.from("orders").delete().eq("id", orderRow.id);
      return fail(itemsErr.message);
    }

    // Clear the cart cookie before sending email so reload is clean.
    await clearCart();

    // Best-effort confirmation emails. Failure here must NOT roll back the order.
    await sendOrderConfirmation({
      orderNumber: orderRow.order_number,
      to: data.email,
      customerName: data.name,
      locale: data.locale,
      total,
      itemsLabel: detailed.lines
        .map(
          (dl) =>
            `${pickTranslation(dl.product.name, data.locale) || dl.product.slug} ×${dl.line.quantity}`,
        )
        .join(", "),
    }).catch(() => {});

    if (env.ADMIN_BOOTSTRAP_EMAIL) {
      await sendAdminNotification({
        to: env.ADMIN_BOOTSTRAP_EMAIL,
        orderNumber: orderRow.order_number,
        customerName: data.name,
        customerPhone: data.phone,
        total,
      }).catch(() => {});
    }

    return ok({ orderNumber: orderRow.order_number, locale: data.locale });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "genericError");
  }
}

interface SendConfirmationInput {
  orderNumber: string;
  to: string | undefined;
  customerName: string;
  locale: Locale;
  total: number;
  itemsLabel: string;
}

async function sendOrderConfirmation(input: SendConfirmationInput): Promise<void> {
  if (!input.to) {
    // Customer didn't supply an email — nothing to send.
    return;
  }
  const isAr = input.locale === "ar";
  const subject = isAr
    ? `تأكيد طلبك ${input.orderNumber} · سايلنت هيل`
    : `Order ${input.orderNumber} confirmed · Silent Hell`;
  const body = isAr
    ? `<p>مرحباً ${escapeHtml(input.customerName)},</p>
       <p>تم استلام طلبك. سنتواصل معك هاتفياً للتأكيد. الدفع نقداً عند الاستلام لسائق ياليدين.</p>
       <p><strong>الطلب:</strong> ${escapeHtml(input.itemsLabel)}<br/>
       <strong>الإجمالي:</strong> ${input.total} د.ج<br/>
       <strong>المرجع:</strong> ${input.orderNumber}</p>`
    : `<p>Hey ${escapeHtml(input.customerName)},</p>
       <p>We got your order. We'll call you to confirm shortly. The Yalidine driver collects payment in cash on delivery.</p>
       <p><strong>Order:</strong> ${escapeHtml(input.itemsLabel)}<br/>
       <strong>Total:</strong> ${input.total} DZD<br/>
       <strong>Reference:</strong> ${input.orderNumber}</p>`;
  const html = brandedTemplate({
    preheader: isAr ? "تم تأكيد طلبك" : "Your order is in.",
    heading: isAr ? "طلبك ثُبّت." : "Order locked in.",
    bodyHtml: body,
  });
  await sendEmail({
    to: input.to,
    subject,
    html,
    text: `${input.orderNumber} · ${input.itemsLabel} · ${input.total} DZD`,
  });
}

interface SendAdminNotificationInput {
  to: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
}

async function sendAdminNotification(input: SendAdminNotificationInput): Promise<void> {
  const html = brandedTemplate({
    preheader: `New order ${input.orderNumber}`,
    heading: "New order incoming.",
    bodyHtml: `<p><strong>${escapeHtml(input.orderNumber)}</strong></p>
      <p>${escapeHtml(input.customerName)} · ${escapeHtml(input.customerPhone)}<br/>
      Total: <strong>${input.total} DZD</strong></p>
      <p>Process it in the admin dashboard.</p>`,
  });
  await sendEmail({
    to: input.to,
    subject: `[admin] Order ${input.orderNumber}`,
    html,
    text: `${input.orderNumber} · ${input.customerName} · ${input.customerPhone} · ${input.total} DZD`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

