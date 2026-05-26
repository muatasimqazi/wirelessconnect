/**
 * Order query functions — server-side only.
 *
 * Security rules (per API Spec §12):
 *  - Customer-facing: always use `customer_order_items` view — NEVER base order_items
 *    (base table includes product_imei / product_serial_number, which are admin-only)
 *  - Guest order lookup: by guest_access_token UUID ONLY — never by order_id or order_number
 *  - Authenticated customer: verified against user_id
 *  - Admin fields (admin_notes) NEVER returned by customer-facing functions
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderItemSummary {
  id: string;
  product_title: string;
  product_slug: string | null;
  product_image_url: string | null;
  device_brand: string | null;
  device_model: string | null;
  device_storage: string | null;
  device_color: string | null;
  device_condition: string | null;
  unit_price: number; // cents
  quantity: number;
  line_total: number; // cents
  warranty_days: number;
  warranty_expires_at: string | null;
}

export interface OrderSummary {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_method: string;
  subtotal: number; // cents
  discount_total: number; // cents
  total: number; // cents
  customer_locale: string;
  created_at: string;
  item_count: number;
}

export interface OrderConfirmation {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_email: string;
  status: string;
  payment_status: string;
  fulfillment_method: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  customer_locale: string;
  tracking_number: string | null;
  shipping_carrier: string | null;
  pickup_location_name: string | null;
  pickup_location_address: string | null;
  paid_at: string | null;
  created_at: string;
  items: OrderItemSummary[];
}

export interface OrderDetail extends OrderConfirmation {
  coupon_code: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
}

// ─── Guest order lookup ───────────────────────────────────────────────────────

/**
 * Look up an order by guest_access_token.
 * Returns null if not found — does not reveal whether the token exists.
 *
 * SECURITY: guest_access_token is a UUID (2^122 entropy). Not guessable.
 */
export async function lookupGuestOrder(
  guestAccessToken: string,
): Promise<OrderConfirmation | null> {
  if (!guestAccessToken || guestAccessToken.length < 30) return null;

  const admin = supabaseAdmin();

  const { data: order, error } = await admin
    .from("orders")
    .select(
      `id, order_number, customer_name, customer_email, status, payment_status,
       fulfillment_method, subtotal, discount_total, shipping_total, tax_total, total,
       customer_locale, tracking_number, shipping_carrier, pickup_location_name,
       pickup_location_address, paid_at, created_at`,
    )
    .eq("guest_access_token", guestAccessToken)
    .maybeSingle();

  if (error || !order) return null;

  // Fetch items via customer_order_items view (excludes IMEI/serial)
  const { data: items } = await admin
    .from("customer_order_items")
    .select(
      `id, product_title, product_slug, product_image_url, device_brand, device_model,
       device_storage, device_color, device_condition, unit_price, quantity, line_total,
       warranty_days, warranty_expires_at`,
    )
    .eq("order_id", order.id)
    .order("created_at");

  return {
    ...order,
    subtotal: Number(order.subtotal),
    discount_total: Number(order.discount_total),
    shipping_total: Number(order.shipping_total),
    tax_total: Number(order.tax_total),
    total: Number(order.total),
    items: (items ?? [])
      .filter((item): item is typeof item & { id: string; product_title: string } =>
        item.id !== null && item.product_title !== null,
      )
      .map((item) => ({
        id: item.id,
        product_title: item.product_title,
        product_slug: item.product_slug,
        product_image_url: item.product_image_url,
        device_brand: item.device_brand,
        device_model: item.device_model,
        device_storage: item.device_storage,
        device_color: item.device_color,
        device_condition: item.device_condition,
        unit_price: Number(item.unit_price),
        quantity: item.quantity ?? 1,
        line_total: Number(item.line_total),
        warranty_days: item.warranty_days ?? 0,
        warranty_expires_at: item.warranty_expires_at,
      })),
  };
}

// ─── Authenticated customer orders ────────────────────────────────────────────

export async function getCustomerOrders(): Promise<OrderSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = supabaseAdmin();
  const { data: orders, error } = await admin
    .from("orders")
    .select(
      `id, order_number, status, payment_status, fulfillment_method,
       subtotal, discount_total, total, customer_locale, created_at`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !orders) return [];

  // Count items per order
  const orderIds = orders.map((o) => o.id);
  const { data: itemCounts } = await admin
    .from("customer_order_items")
    .select("order_id, quantity")
    .in("order_id", orderIds);

  const countMap = new Map<string, number>();
  for (const row of itemCounts ?? []) {
    if (!row.order_id) continue;
    countMap.set(row.order_id, (countMap.get(row.order_id) ?? 0) + (row.quantity ?? 0));
  }

  return orders.map((o) => ({
    ...o,
    subtotal: Number(o.subtotal),
    discount_total: Number(o.discount_total),
    total: Number(o.total),
    item_count: countMap.get(o.id) ?? 0,
  }));
}

/**
 * Get a specific order by order_number for the authenticated user.
 * NEVER returns orders by order_number alone — always verifies user_id.
 */
export async function getCustomerOrderByNumber(
  orderNumber: string,
): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = supabaseAdmin();
  const { data: order, error } = await admin
    .from("orders")
    .select(
      `id, order_number, customer_name, customer_email, status, payment_status,
       fulfillment_method, subtotal, discount_total, shipping_total, tax_total, total,
       customer_locale, coupon_code, tracking_number, shipping_carrier,
       pickup_location_name, pickup_location_address,
       paid_at, cancelled_at, refunded_at, created_at`,
    )
    .eq("order_number", orderNumber)
    .eq("user_id", user.id) // IDOR guard
    .maybeSingle();

  if (error || !order) return null;

  const { data: items } = await admin
    .from("customer_order_items")
    .select(
      `id, product_title, product_slug, product_image_url, device_brand, device_model,
       device_storage, device_color, device_condition, unit_price, quantity, line_total,
       warranty_days, warranty_expires_at`,
    )
    .eq("order_id", order.id)
    .order("created_at");

  return {
    ...order,
    subtotal: Number(order.subtotal),
    discount_total: Number(order.discount_total),
    shipping_total: Number(order.shipping_total),
    tax_total: Number(order.tax_total),
    total: Number(order.total),
    items: (items ?? [])
      .filter(
        (item): item is typeof item & { id: string; product_title: string } =>
          item.id !== null && item.product_title !== null,
      )
      .map((item) => ({
        id: item.id,
        product_title: item.product_title,
        product_slug: item.product_slug,
        product_image_url: item.product_image_url,
        device_brand: item.device_brand,
        device_model: item.device_model,
        device_storage: item.device_storage,
        device_color: item.device_color,
        device_condition: item.device_condition,
        unit_price: Number(item.unit_price),
        quantity: item.quantity ?? 1,
        line_total: Number(item.line_total),
        warranty_days: item.warranty_days ?? 0,
        warranty_expires_at: item.warranty_expires_at,
      })),
  };
}
