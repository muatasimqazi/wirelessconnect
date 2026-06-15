/**
 * Admin order query functions.
 * Returns all orders with full customer + item details (admin view).
 * Uses order_items directly (not customer_order_items view) — admin can see IMEI/serial.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface AdminOrderListItem {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string | null;
  status: string;
  payment_status: string;
  fulfillment_method: string;
  total: number;
  created_at: string;
  cancellation_request_status: string | null;
}

export interface AdminOrderDetail extends AdminOrderListItem {
  customer_phone: string | null;
  customer_locale: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  coupon_code: string | null;
  tracking_number: string | null;
  shipping_carrier: string | null;
  pickup_location_name: string | null;
  pickup_location_address: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  cancelled_at: string | null;
  admin_notes: string | null;
  items: AdminOrderItem[];
  cancellation_requests: CancellationRequest[];
}

export interface AdminOrderItem {
  id: string;
  product_title: string;
  product_sku: string | null;
  product_imei: string | null;
  product_serial_number: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  warranty_days: number;
}

export interface CancellationRequest {
  id: string;
  reason: string;
  status: string;
  customer_email: string;
  created_at: string;
}

export async function getAdminOrders(opts?: {
  status?: string;
  customer?: string;
  limit?: number;
}): Promise<AdminOrderListItem[]> {
  const admin = supabaseAdmin();
  let query = admin
    .from("orders")
    .select(
      "id, order_number, customer_email, customer_name, status, payment_status, fulfillment_method, total, created_at, cancellation_request_status",
    )
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (opts?.status) query = query.eq("status", opts.status as any);
  if (opts?.customer) query = query.eq("customer_email", opts.customer);

  const { data } = await query;
  return (data ?? []).map((o) => ({
    ...o,
    id: o.id!,
    order_number: o.order_number ?? "",
    customer_email: o.customer_email ?? "",
    status: o.status ?? "pending",
    payment_status: o.payment_status ?? "unpaid",
    fulfillment_method: o.fulfillment_method ?? "pickup",
    total: Number(o.total ?? 0),
  }));
}

export async function getAdminOrderById(id: string): Promise<AdminOrderDetail | null> {
  const admin = supabaseAdmin();

  const { data: order } = await admin
    .from("orders")
    .select(
      `id, order_number, customer_email, customer_name, customer_phone, customer_locale,
       status, payment_status, fulfillment_method,
       subtotal, discount_total, shipping_total, tax_total, total,
       coupon_code, tracking_number, shipping_carrier, pickup_location_name,
       pickup_location_address, stripe_payment_intent_id,
       paid_at, shipped_at, cancelled_at, admin_notes, created_at,
       cancellation_request_status`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) return null;

  const [{ data: items }, { data: cancelRequests }] = await Promise.all([
    admin
      .from("order_items")
      .select(
        "id, product_title, product_sku, product_imei, product_serial_number, unit_price, quantity, line_total, warranty_days",
      )
      .eq("order_id", id),
    admin
      .from("order_cancellation_requests")
      .select("id, reason, status, customer_email, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    id: order.id!,
    order_number: order.order_number ?? "",
    customer_email: order.customer_email ?? "",
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_locale: order.customer_locale ?? "en",
    status: order.status ?? "pending",
    payment_status: order.payment_status ?? "unpaid",
    fulfillment_method: order.fulfillment_method ?? "pickup",
    subtotal: Number(order.subtotal ?? 0),
    discount_total: Number(order.discount_total ?? 0),
    shipping_total: Number(order.shipping_total ?? 0),
    tax_total: Number(order.tax_total ?? 0),
    total: Number(order.total ?? 0),
    coupon_code: order.coupon_code,
    tracking_number: order.tracking_number,
    shipping_carrier: order.shipping_carrier,
    pickup_location_name: order.pickup_location_name,
    pickup_location_address: order.pickup_location_address,
    stripe_payment_intent_id: order.stripe_payment_intent_id,
    paid_at: order.paid_at,
    shipped_at: order.shipped_at,
    cancelled_at: order.cancelled_at,
    admin_notes: order.admin_notes,
    cancellation_request_status: order.cancellation_request_status,
    created_at: order.created_at,
    items: (items ?? []).map((i) => ({
      id: i.id!,
      product_title: i.product_title ?? "",
      product_sku: i.product_sku,
      product_imei: i.product_imei,
      product_serial_number: i.product_serial_number,
      unit_price: Number(i.unit_price ?? 0),
      quantity: i.quantity ?? 1,
      line_total: Number(i.line_total ?? 0),
      warranty_days: i.warranty_days ?? 30,
    })),
    cancellation_requests: (cancelRequests ?? []).map((r) => ({
      id: r.id!,
      reason: r.reason ?? "",
      status: r.status ?? "submitted",
      customer_email: r.customer_email ?? "",
      created_at: r.created_at!,
    })),
  };
}
