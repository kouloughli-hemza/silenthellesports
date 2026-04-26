"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderByNumberAdmin } from "@/lib/admin/data/orders";
import { yalidine } from "@/services/yalidine";
import { sendEmail, brandedTemplate } from "@/services/email";
import { fail, ok, type Result } from "@/types/domain";
import type { Update } from "@/types/database";

const OrderNumber = z.string().regex(/^SH-\d{4}-\d{3,}$/);

function revalidateOrderPaths(orderNumber: string): void {
  revalidatePath("/en/admin/orders");
  revalidatePath("/ar/admin/orders");
  revalidatePath(`/en/admin/orders/${orderNumber}`);
  revalidatePath(`/ar/admin/orders/${orderNumber}`);
}

interface EmailDispatch {
  subject: string;
  heading: string;
  bodyHtml: string;
  text: string;
}

async function bestEffortEmail(
  to: string | null,
  dispatch: EmailDispatch,
): Promise<void> {
  if (!to) return;
  try {
    const html = brandedTemplate({
      preheader: dispatch.subject,
      heading: dispatch.heading,
      bodyHtml: dispatch.bodyHtml,
    });
    const res = await sendEmail({ to, subject: dispatch.subject, html, text: dispatch.text });
    if (!res.success) console.warn("[orders.email] send failed:", res.error);
  } catch (err) {
    console.warn("[orders.email] threw:", err);
  }
}

// ----- confirmOrderAction: pending → confirmed -----

export async function confirmOrderAction(
  orderNumber: string,
): Promise<Result<{ orderNumber: string }>> {
  const profile = await requireAdmin();
  const parsed = OrderNumber.safeParse(orderNumber);
  if (!parsed.success) return fail("Invalid order number.");

  const order = await getOrderByNumberAdmin(parsed.data);
  if (!order) return fail("Order not found.");
  if (order.status !== "pending") {
    return fail(`Order is ${order.status}, cannot confirm.`);
  }

  const supabase = createAdminClient();
  const patch: Update<"orders"> = { status: "confirmed", updated_at: new Date().toISOString() };
  const { error } = await supabase
    .from("orders")
    .update(patch as never)
    .eq("id", order.id);
  if (error) return fail("Couldn't confirm order.");

  await recordAudit({
    actorId: profile.id,
    action: "order.confirm",
    entityType: "order",
    entityId: order.id,
    before: { status: order.status },
    after: { status: "confirmed" },
  });

  await bestEffortEmail(order.customer_email, {
    subject: `Order ${order.order_number} confirmed · Silent Hell`,
    heading: "ORDER CONFIRMED",
    bodyHtml: `<p>Hey ${order.customer_name},</p><p>Your order <strong style="color:#E60013">${order.order_number}</strong> has been confirmed. We're preparing it for shipment.</p><p>You'll get another email once it ships, with a tracking number for the Yalidine driver.</p><p>Pay in cash on delivery — total: <strong>${order.total} ${order.currency}</strong>.</p>`,
    text: `Order ${order.order_number} confirmed. Total ${order.total} ${order.currency}. Pay COD on delivery.`,
  });

  revalidateOrderPaths(order.order_number);
  return ok({ orderNumber: order.order_number });
}

// ----- createShipmentAction: confirmed → shipped + Yalidine.createParcel -----

export async function createShipmentAction(
  orderNumber: string,
): Promise<Result<{ tracking: string }>> {
  const profile = await requireAdmin();
  const parsed = OrderNumber.safeParse(orderNumber);
  if (!parsed.success) return fail("Invalid order number.");

  const order = await getOrderByNumberAdmin(parsed.data);
  if (!order) return fail("Order not found.");
  if (order.status !== "confirmed") {
    return fail(`Order is ${order.status}, cannot ship.`);
  }

  // Build a human-readable product label from order items.
  const productLabel = (order.items ?? [])
    .map((it) => `${it.product_name_snapshot} x${it.quantity}`)
    .join(", ")
    .slice(0, 240);

  const weightGrams = Math.max(
    500,
    (order.items ?? []).reduce((acc, it) => acc + it.quantity * 500, 0),
  );

  let tracking: string;
  try {
    const parcel = await yalidine.createParcel({
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      to_wilaya_code: order.shipping_wilaya_code,
      to_commune_name: order.shipping_commune_name,
      address: order.shipping_address,
      is_stopdesk: order.is_stopdesk,
      stopdesk_id: order.stopdesk_id,
      weight_grams: weightGrams,
      product_label: productLabel || "Silent Hell merch",
      declared_value: order.total,
    });
    tracking = parcel.tracking;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Yalidine error";
    return fail(`Yalidine: ${msg}`);
  }

  const supabase = createAdminClient();
  const patch: Update<"orders"> = {
    status: "shipped",
    yalidine_tracking: tracking,
    yalidine_status: "dispatched",
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("orders")
    .update(patch as never)
    .eq("id", order.id);
  if (error) return fail("Saved shipment but couldn't update order. Check manually.");

  await recordAudit({
    actorId: profile.id,
    action: "order.ship",
    entityType: "order",
    entityId: order.id,
    before: { status: order.status, tracking: order.yalidine_tracking },
    after: { status: "shipped", tracking },
  });

  await bestEffortEmail(order.customer_email, {
    subject: `Your order has shipped · ${order.order_number}`,
    heading: "ON THE WAY",
    bodyHtml: `<p>Hey ${order.customer_name},</p><p>Your order <strong style="color:#E60013">${order.order_number}</strong> is in the hands of the Yalidine driver.</p><p>Tracking: <strong>${tracking}</strong></p><p>Pay in cash on delivery — total: <strong>${order.total} ${order.currency}</strong>.</p>`,
    text: `Order ${order.order_number} shipped. Tracking ${tracking}. Total ${order.total} ${order.currency} COD.`,
  });

  revalidateOrderPaths(order.order_number);
  return ok({ tracking });
}

// ----- cancelOrderAction -----

const CancelSchema = z.object({
  orderNumber: OrderNumber,
  reason: z.string().trim().min(2).max(500),
});

export async function cancelOrderAction(
  orderNumber: string,
  reason: string,
): Promise<Result<{ orderNumber: string }>> {
  const profile = await requireAdmin();
  const parsed = CancelSchema.safeParse({ orderNumber, reason });
  if (!parsed.success) return fail("Invalid input.");

  const order = await getOrderByNumberAdmin(parsed.data.orderNumber);
  if (!order) return fail("Order not found.");
  if (order.status === "cancelled") return fail("Order is already cancelled.");
  if (order.status === "delivered") return fail("Cannot cancel a delivered order.");

  // If a shipment exists, attempt to cancel at Yalidine — best effort.
  if (order.yalidine_tracking) {
    try {
      await yalidine.cancelParcel(order.yalidine_tracking);
    } catch (err) {
      console.warn("[orders.cancel] yalidine cancel failed:", err);
    }
  }

  const newNotes = [order.notes, `[cancelled by admin] ${parsed.data.reason}`]
    .filter(Boolean)
    .join("\n");

  const supabase = createAdminClient();
  const patch: Update<"orders"> = {
    status: "cancelled",
    notes: newNotes,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("orders")
    .update(patch as never)
    .eq("id", order.id);
  if (error) return fail("Couldn't cancel order.");

  await recordAudit({
    actorId: profile.id,
    action: "order.cancel",
    entityType: "order",
    entityId: order.id,
    before: { status: order.status },
    after: { status: "cancelled", reason: parsed.data.reason },
  });

  await bestEffortEmail(order.customer_email, {
    subject: `Order ${order.order_number} cancelled · Silent Hell`,
    heading: "ORDER CANCELLED",
    bodyHtml: `<p>Hey ${order.customer_name},</p><p>Your order <strong>${order.order_number}</strong> has been cancelled.</p><p>Reason: ${parsed.data.reason}</p><p>If this is a mistake, reply to this email and we'll sort it.</p>`,
    text: `Order ${order.order_number} cancelled. Reason: ${parsed.data.reason}`,
  });

  revalidateOrderPaths(order.order_number);
  return ok({ orderNumber: order.order_number });
}

// ----- markDeliveredAction: shipped → delivered -----

export async function markDeliveredAction(
  orderNumber: string,
): Promise<Result<{ orderNumber: string }>> {
  const profile = await requireAdmin();
  const parsed = OrderNumber.safeParse(orderNumber);
  if (!parsed.success) return fail("Invalid order number.");

  const order = await getOrderByNumberAdmin(parsed.data);
  if (!order) return fail("Order not found.");
  if (order.status !== "shipped") {
    return fail(`Order is ${order.status}, cannot mark delivered.`);
  }

  const supabase = createAdminClient();
  const patch: Update<"orders"> = {
    status: "delivered",
    yalidine_status: "delivered",
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("orders")
    .update(patch as never)
    .eq("id", order.id);
  if (error) return fail("Couldn't mark delivered.");

  await recordAudit({
    actorId: profile.id,
    action: "order.deliver",
    entityType: "order",
    entityId: order.id,
    before: { status: order.status },
    after: { status: "delivered" },
  });

  revalidateOrderPaths(order.order_number);
  return ok({ orderNumber: order.order_number });
}
