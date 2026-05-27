/**
 * Stripe Webhook Handler — POST /api/stripe/webhook
 *
 * Architecture (per API Spec §11):
 *  1. Verify Stripe signature → reject invalid requests early
 *  2. Insert event into webhook_events (ON CONFLICT DO NOTHING)
 *     → if 0 rows returned, event already processed; return 200 immediately
 *  3. Dispatch to appropriate handler
 *  4. Always return 200 (even on errors) to prevent infinite Stripe retries;
 *     log errors to console for investigation
 *
 * Handled events:
 *  checkout.session.completed  — mark paid, decrement inventory, create warranties, send emails
 *  payment_intent.succeeded    — secondary confirmation (belt-and-suspenders)
 *  payment_intent.payment_failed — mark order as payment_failed
 *  charge.refunded             — mark order as refunded
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, sendAdminEmail } from "@/lib/email/send";
import { buildOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { buildAdminNewOrderEmail } from "@/lib/email/templates/admin-new-order";
import { releaseReservationsBySession } from "@/lib/inventory/reservations";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  // 1. Verify signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // 2. Idempotency check — insert event or skip if already processed
  const { data: inserted, error: insertError } = await admin
    .from("webhook_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      // Serialize via JSON round-trip to satisfy Supabase Json type constraint
      payload: JSON.parse(JSON.stringify(event)),
    })
    .select("id")
    .maybeSingle();

  if (insertError && !insertError.message.includes("duplicate")) {
    console.error("[webhook] webhook_events insert error:", insertError.message);
    // Non-fatal — continue processing
  }

  if (!inserted) {
    // Duplicate event — already processed
    return NextResponse.json({ received: true, duplicate: true });
  }

  // 3. Dispatch
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
          admin,
        );
        break;

      case "payment_intent.succeeded":
        // Belt-and-suspenders; primary flow is checkout.session.completed
        // No additional action needed — idempotency guards prevent double-processing
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(
          event.data.object as Stripe.PaymentIntent,
          admin,
        );
        break;

      case "charge.refunded":
        await handleRefund(event.data.object as Stripe.Charge, admin);
        break;

      default:
        // Unhandled event type — log and ignore
        console.warn(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    // Log but always return 200 to prevent Stripe retry loops
    console.error(`[webhook] Handler error for ${event.type}:`, err);

    // Update webhook_events with error
    await admin
      .from("webhook_events")
      .update({ error: String(err) })
      .eq("stripe_event_id", event.id);
  }

  return NextResponse.json({ received: true });
}

// ─── checkout.session.completed ───────────────────────────────────────────────

type AdminClient = ReturnType<typeof supabaseAdmin>;

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  admin: AdminClient,
): Promise<void> {
  const sessionId = session.id;

  // Find order by Stripe session ID
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      `id, order_number, user_id, customer_email, customer_name, customer_phone,
       customer_locale, payment_status, fulfillment_method, subtotal, discount_total,
       shipping_total, total, guest_access_token`,
    )
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (orderError || !order) {
    console.error("[webhook] Order not found for session:", sessionId);
    return;
  }

  // Idempotency guard — skip if already paid
  if (order.payment_status === "paid") {
    console.warn("[webhook] Order already paid, skipping:", order.order_number);
    return;
  }

  // Extract tax data from Stripe session
  const taxTotal = session.total_details?.amount_tax ?? 0;
  const taxCalcId = (session as unknown as Record<string, unknown>).automatic_tax_calculation_id as string | null ?? null;

  // Mark order as paid
  const { error: updateError } = await admin
    .from("orders")
    .update({
      status: "paid",
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: session.payment_intent as string | null,
      stripe_tax_calculation_id: taxCalcId,
      tax_total: taxTotal,
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("[webhook] Order update error:", updateError.message);
    throw new Error(`Order update failed: ${updateError.message}`);
  }

  // Fetch order items for inventory decrement and warranty creation
  const { data: orderItems, error: itemsError } = await admin
    .from("order_items")
    .select(
      `id, product_id, product_title, device_brand, device_model,
       quantity, unit_price, warranty_days, warranty_expires_at`,
    )
    .eq("order_id", order.id);

  if (itemsError || !orderItems) {
    console.error("[webhook] Could not fetch order items:", itemsError?.message);
    return;
  }

  // Atomically decrement inventory for each item.
  // Pattern: read current quantity → compute new → UPDATE with WHERE quantity = current
  // (optimistic lock prevents concurrent decrements from going negative).
  for (const item of orderItems) {
    if (!item.product_id) continue;

    const { data: prod } = await admin
      .from("products")
      .select("id, quantity")
      .eq("id", item.product_id)
      .single();

    if (!prod) continue;

    if (prod.quantity <= 0) {
      console.warn(`[webhook] Potential oversell: product ${item.product_id} is at 0 stock`);
      continue;
    }

    const newQty = Math.max(0, prod.quantity - item.quantity);
    const { error: decrError } = await admin
      .from("products")
      .update({ quantity: newQty })
      .eq("id", item.product_id)
      .eq("quantity", prod.quantity); // optimistic lock — retries not needed for MVP

    if (decrError) {
      console.error("[webhook] Inventory decrement error:", decrError.message);
    }
  }

  // Create warranty records for eligible items (warranty_days > 0)
  const warrantyInserts = orderItems
    .filter((item) => (item.warranty_days ?? 0) > 0)
    .map((item) => ({
      order_id: order.id,
      order_item_id: item.id,
      product_id: item.product_id,
      user_id: order.user_id ?? null,
      customer_email: order.customer_email,
      customer_name: order.customer_name ?? null,
      customer_phone: order.customer_phone ?? null,
      customer_locale: order.customer_locale,
      product_title: item.product_title,
      device_brand: item.device_brand ?? null,
      device_model: item.device_model ?? null,
      warranty_days: item.warranty_days,
      starts_at: new Date().toISOString(),
      expires_at:
        item.warranty_expires_at ??
        new Date(
          Date.now() + (item.warranty_days ?? 30) * 24 * 60 * 60 * 1000,
        ).toISOString(),
      active: true,
      claim_status: "none" as const,
    }));

  if (warrantyInserts.length > 0) {
    const { error: warrantyError } = await admin
      .from("warranties")
      .insert(warrantyInserts);
    if (warrantyError) {
      console.error("[webhook] Warranty creation error:", warrantyError.message);
    }
  }

  // Release inventory reservations (they served their purpose — inventory already decremented)
  await releaseReservationsBySession(sessionId);

  // Clear the cart
  const cartId = session.metadata?.cart_id;
  if (cartId) {
    await admin.from("cart_items").delete().eq("cart_id", cartId);
  }

  // Send customer confirmation email
  const emailItems = orderItems.map((item) => ({
    title: item.product_title,
    quantity: item.quantity,
    unitPrice: Number(item.unit_price),
    lineTotal: Number(item.unit_price) * item.quantity,
  }));

  const locale = order.customer_locale ?? "en";
  const guestToken = order.guest_access_token;
  const { subject, html } = buildOrderConfirmationEmail({
    locale,
    orderNumber: order.order_number,
    customerName: order.customer_name ?? "Valued Customer",
    customerEmail: order.customer_email,
    fulfillmentMethod: order.fulfillment_method as "pickup" | "shipping",
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    discountTotal: Number(order.discount_total),
    items: emailItems,
    guestAccessToken: guestToken,
    siteUrl: SITE_URL,
  });

  await sendEmail({ to: order.customer_email, subject, html });

  // Send admin notification
  const { subject: adminSubject, html: adminHtml } = buildAdminNewOrderEmail({
    orderNumber: order.order_number,
    customerName: order.customer_name ?? "Guest",
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone ?? undefined,
    fulfillmentMethod: order.fulfillment_method as "pickup" | "shipping",
    total: Number(order.total),
    items: emailItems.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    adminOrderUrl: `${SITE_URL}/admin/orders/${order.id}`,
  });

  await sendAdminEmail({ subject: adminSubject, html: adminHtml });
}

// ─── payment_intent.payment_failed ───────────────────────────────────────────

async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
  admin: AdminClient,
): Promise<void> {
  const { error } = await admin
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error) {
    console.error("[webhook] payment_failed update error:", error.message);
  }
}

// ─── charge.refunded ──────────────────────────────────────────────────────────

async function handleRefund(
  charge: Stripe.Charge,
  admin: AdminClient,
): Promise<void> {
  const paymentIntentId = charge.payment_intent as string | null;
  if (!paymentIntentId) return;

  const isFullRefund = charge.refunded;
  const newStatus = isFullRefund ? "refunded" : "partially_refunded";

  const { error } = await admin
    .from("orders")
    .update({
      payment_status: newStatus,
      refunded_at: isFullRefund ? new Date().toISOString() : null,
    })
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (error) {
    console.error("[webhook] refund update error:", error.message);
  }
}
