"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/utils/permissions";
import { writeAuditLog } from "@/lib/admin/audit";
import { sendEmail } from "@/lib/email/send";
import { buildOrderCancellationEmail } from "@/lib/email/templates/order-cancellation";
import type { Database } from "@/types/database.types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

// Valid status transitions (staff-initiated only)
const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  paid: ["processing", "ready_for_pickup", "cancelled"],
  processing: ["ready_for_pickup", "shipped", "cancelled"],
  ready_for_pickup: ["picked_up", "cancelled"],
  shipped: ["delivered", "cancelled"],
};

export interface OrderActionResult {
  error?: string;
}

// ─── Status update ────────────────────────────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Promise<OrderActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  const { data: order } = await admin
    .from("orders")
    .select("status, fulfillment_method, tracking_number, customer_locale, order_number, customer_email, customer_name")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found." };

  const currentStatus = order.status as OrderStatus;
  const allowed = VALID_TRANSITIONS[currentStatus];

  if (!allowed?.includes(newStatus)) {
    return {
      error: `Cannot transition from "${currentStatus}" to "${newStatus}".`,
    };
  }

  // Shipping requires tracking number
  if (newStatus === "shipped" && !order.tracking_number) {
    return { error: "Enter a tracking number before marking as shipped." };
  }

  const updateFields: Record<string, unknown> = { status: newStatus };
  if (newStatus === "shipped") updateFields.shipped_at = new Date().toISOString();
  if (newStatus === "picked_up" || newStatus === "delivered") {
    updateFields.fulfilled_at = new Date().toISOString();
  }
  if (newStatus === "cancelled") {
    updateFields.cancelled_at = new Date().toISOString();
  }

  const { error } = await admin
    .from("orders")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updateFields as any)
    .eq("id", orderId);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: "status_change",
    table_name: "orders",
    record_id: orderId,
    old_values: { status: currentStatus },
    new_values: { status: newStatus },
  });

  // Send cancellation email when admin cancels an order (Sprint 4 DoD)
  if (newStatus === "cancelled" && order.customer_email) {
    const { subject, html } = buildOrderCancellationEmail({
      locale: order.customer_locale ?? "en",
      orderNumber: order.order_number ?? orderId,
      customerName: order.customer_name ?? "Customer",
      customerEmail: order.customer_email,
    });
    await sendEmail({ to: order.customer_email, subject, html });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return {};
}

// ─── Shipping details ─────────────────────────────────────────────────────────

const shippingSchema = z.object({
  tracking_number: z.string().min(1, "Tracking number is required"),
  shipping_carrier: z.string().min(1, "Carrier is required"),
});

export async function updateShippingDetails(
  orderId: string,
  input: { tracking_number: string; shipping_carrier: string },
): Promise<OrderActionResult> {
  await requireStaff();
  const parsed = shippingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("orders")
    .update({
      tracking_number: parsed.data.tracking_number,
      shipping_carrier: parsed.data.shipping_carrier,
    })
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/orders/${orderId}`);
  return {};
}

// ─── Admin notes ──────────────────────────────────────────────────────────────

export async function updateOrderAdminNotes(
  orderId: string,
  notes: string,
): Promise<OrderActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();
  const { error } = await admin
    .from("orders")
    .update({ admin_notes: notes })
    .eq("id", orderId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/orders/${orderId}`);
  return {};
}

// ─── Cancellation request review ──────────────────────────────────────────────

export async function reviewCancellationRequest(
  requestId: string,
  decision: "approved" | "denied",
  adminNotes?: string,
): Promise<OrderActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  const { data: req } = await admin
    .from("order_cancellation_requests")
    .select("id, order_id")
    .eq("id", requestId)
    .single();

  if (!req) return { error: "Request not found." };

  const now = new Date().toISOString();

  await admin
    .from("order_cancellation_requests")
    .update({
      status: decision,
      reviewed_at: now,
      admin_notes: adminNotes ?? null,
    })
    .eq("id", requestId);

  if (decision === "approved") {
    await admin
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: now,
        cancellation_request_status: "approved",
      })
      .eq("id", req.order_id);
  } else {
    await admin
      .from("orders")
      .update({ cancellation_request_status: "denied" })
      .eq("id", req.order_id);
  }

  await writeAuditLog({
    action: "status_change",
    table_name: "order_cancellation_requests",
    record_id: requestId,
    new_values: { status: decision },
    notes: adminNotes,
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${req.order_id}`);
  return {};
}
