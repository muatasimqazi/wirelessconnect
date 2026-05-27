/**
 * Inventory Reservation System
 *
 * Timed holds that prevent two customers from buying the last unit simultaneously.
 *
 * Flow:
 *  1. Customer starts checkout → createReservations() holds inventory for 15 min
 *  2. Stripe payment succeeds → releaseReservation() releases the hold (inventory already decremented by webhook)
 *  3. Payment abandoned / failed → reservations expire naturally (15 min)
 *  4. A cleanup cron runs periodically to release expired reservations
 *
 * IMPORTANT: This supplements (not replaces) the atomic inventory decrement in the Stripe webhook.
 * The webhook remains the source of truth for inventory; reservations provide pre-payment protection.
 *
 * Uses supabaseAdmin — bypasses RLS (inventory_reservations has no public access policy).
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

const RESERVATION_MINUTES = 15;

export interface ReservationItem {
  productId: string;
  quantity: number;
}

export interface CreateReservationsResult {
  success: boolean;
  reservationIds: string[];
  /** Product IDs that no longer have enough inventory */
  insufficientStock: string[];
}

/**
 * Creates inventory reservations for all items in a checkout.
 * Validates live inventory (accounting for existing active reservations) before creating.
 * Returns { success: false, insufficientStock } if any item can't be reserved.
 */
export async function createReservations(
  items: ReservationItem[],
  cartId?: string,
): Promise<CreateReservationsResult> {
  const admin = supabaseAdmin();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESERVATION_MINUTES * 60 * 1000).toISOString();

  const insufficientStock: string[] = [];
  const reservationIds: string[] = [];

  for (const item of items) {
    // Get current product quantity
    const { data: product } = await admin
      .from("products")
      .select("quantity")
      .eq("id", item.productId)
      .eq("status", "active")
      .maybeSingle();

    if (!product) {
      insufficientStock.push(item.productId);
      continue;
    }

    // Count active (non-expired, non-released) reservations for this product
    const { count: reservedCount } = await admin
      .from("inventory_reservations")
      .select("*", { count: "exact", head: true })
      .eq("product_id", item.productId)
      .eq("released", false)
      .gt("expires_at", now.toISOString());

    const available = product.quantity - (reservedCount ?? 0);

    if (available < item.quantity) {
      insufficientStock.push(item.productId);
      continue;
    }

    // Create the reservation
    const { data: reservation, error } = await admin
      .from("inventory_reservations")
      .insert({
        product_id: item.productId,
        cart_id: cartId ?? null,
        quantity: item.quantity,
        expires_at: expiresAt,
        released: false,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[createReservations]", error.message);
      insufficientStock.push(item.productId);
    } else {
      reservationIds.push(reservation.id);
    }
  }

  if (insufficientStock.length > 0) {
    // Roll back any reservations we created in this batch
    if (reservationIds.length > 0) {
      await admin
        .from("inventory_reservations")
        .delete()
        .in("id", reservationIds);
    }
    return { success: false, reservationIds: [], insufficientStock };
  }

  return { success: true, reservationIds, insufficientStock: [] };
}

/**
 * Associates a Stripe session ID with existing reservations so the webhook can release them.
 */
export async function associateStripeSession(
  reservationIds: string[],
  stripeSessionId: string,
): Promise<void> {
  if (reservationIds.length === 0) return;
  const admin = supabaseAdmin();
  await admin
    .from("inventory_reservations")
    .update({ stripe_session_id: stripeSessionId })
    .in("id", reservationIds);
}

/**
 * Releases reservations when payment completes (via webhook).
 * Called after inventory is atomically decremented.
 */
export async function releaseReservationsBySession(stripeSessionId: string): Promise<void> {
  const admin = supabaseAdmin();
  await admin
    .from("inventory_reservations")
    .update({ released: true })
    .eq("stripe_session_id", stripeSessionId)
    .eq("released", false);
}

/**
 * Releases expired reservations.
 * Should be called by a periodic cleanup (cron / scheduled function).
 * Returns the number of reservations released.
 */
export async function releaseExpiredReservations(): Promise<number> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("inventory_reservations")
    .update({ released: true })
    .lt("expires_at", new Date().toISOString())
    .eq("released", false)
    .select("id");

  if (error) {
    console.error("[releaseExpiredReservations]", error.message);
    return 0;
  }
  return (data ?? []).length;
}
