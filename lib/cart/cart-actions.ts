"use server";

/**
 * Cart Server Actions.
 *
 * All cart mutations go through here — never directly from client code.
 * Uses admin client (service role) to handle both guest and auth carts.
 *
 * Security:
 *  - anonymous_id is always taken from our own httpOnly cookie, never user input
 *  - product existence and stock validated before every add
 *  - item ownership validated before every update/remove (cart_id must match)
 *  - revalidatePath triggers re-render of cart count in header
 *
 * Cart lifecycle:
 *  - Created lazily on first addToCart
 *  - Guest carts expire after 14 days (expires_at column)
 *  - Merged into user cart on sign-in (mergeGuestCart)
 *  - Cleared on order completion (clearCart)
 */

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getAnonymousCartId,
  setAnonymousCartId,
  clearAnonymousCartId,
} from "@/lib/cart/cart-id";
import { getCartById } from "@/lib/cart/cart-queries";
import type { CartData } from "@/lib/cart/cart-queries";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** 14-day cart expiry. */
function cartExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString();
}

/**
 * Gets or creates a cart for the current session.
 * Returns the cart ID.
 */
async function getOrCreateCart(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = supabaseAdmin();

  if (user) {
    // Authenticated: find or create by user_id
    const { data: existing } = await admin
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created, error } = await admin
      .from("carts")
      .insert({ user_id: user.id, expires_at: cartExpiresAt() })
      .select("id")
      .single();

    if (error || !created) throw new Error("Failed to create cart");
    return created.id;
  }

  // Guest: find or create by anonymous_id cookie
  let anonymousId = await getAnonymousCartId();

  if (anonymousId) {
    const { data: existing } = await admin
      .from("carts")
      .select("id")
      .eq("anonymous_id", anonymousId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) return existing.id;
  }

  // Create a new guest cart
  anonymousId = crypto.randomUUID();
  const { data: created, error } = await admin
    .from("carts")
    .insert({ anonymous_id: anonymousId, expires_at: cartExpiresAt() })
    .select("id")
    .single();

  if (error || !created) throw new Error("Failed to create guest cart");

  // Persist the anonymous_id in the httpOnly cookie
  await setAnonymousCartId(anonymousId);

  return created.id;
}

// ─── Public actions ───────────────────────────────────────────────────────────

export interface CartActionResult {
  cart?: CartData;
  error?: string;
}

/**
 * Adds a product to the cart, or increments quantity if already present.
 *
 * Validates:
 *  - Product exists in public_products view (active status)
 *  - Requested quantity doesn't exceed available stock
 */
export async function addToCart(
  productId: string,
  quantity = 1,
): Promise<CartActionResult> {
  try {
    const admin = supabaseAdmin();

    // Validate product availability
    const { data: product } = await admin
      .from("public_products")
      .select("id, quantity, title")
      .eq("id", productId)
      .single();

    if (!product) return { error: "Product not found or unavailable." };
    if ((product.quantity ?? 0) < quantity) {
      return { error: "Insufficient stock." };
    }

    const cartId = await getOrCreateCart();

    // Check if item already in cart
    const { data: existing } = await admin
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("product_id", productId)
      .maybeSingle();

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > (product.quantity ?? 0)) {
        return { error: "Cannot add more than available stock." };
      }

      await admin
        .from("cart_items")
        .update({ quantity: newQty })
        .eq("id", existing.id);
    } else {
      await admin
        .from("cart_items")
        .insert({ cart_id: cartId, product_id: productId, quantity });
    }

    revalidatePath("/", "layout");
    const cart = await getCartById(cartId);
    return { cart: cart ?? undefined };
  } catch (err) {
    console.error("[addToCart]", err);
    return { error: "Failed to add item to cart." };
  }
}

/**
 * Updates the quantity of a cart item.
 * Setting quantity to 0 removes the item.
 * Validates ownership: item must belong to the current session's cart.
 */
export async function updateCartItem(
  itemId: string,
  quantity: number,
): Promise<CartActionResult> {
  try {
    if (quantity < 0) return { error: "Invalid quantity." };

    const admin = supabaseAdmin();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Ownership check: find the cart this item belongs to
    const { data: item } = await admin
      .from("cart_items")
      .select("id, cart_id, product_id")
      .eq("id", itemId)
      .single();

    if (!item) return { error: "Cart item not found." };

    // Verify the cart belongs to the current session
    const cartOwned = await verifyCartOwnership(item.cart_id, user?.id ?? null);
    if (!cartOwned) return { error: "Unauthorized." };

    if (quantity === 0) {
      await admin.from("cart_items").delete().eq("id", itemId);
    } else {
      // Validate stock
      const { data: product } = await admin
        .from("public_products")
        .select("quantity")
        .eq("id", item.product_id)
        .single();

      if ((product?.quantity ?? 0) < quantity) {
        return { error: "Cannot exceed available stock." };
      }

      await admin.from("cart_items").update({ quantity }).eq("id", itemId);
    }

    revalidatePath("/", "layout");
    const cart = await getCartById(item.cart_id);
    return { cart: cart ?? undefined };
  } catch (err) {
    console.error("[updateCartItem]", err);
    return { error: "Failed to update cart item." };
  }
}

/**
 * Removes a single item from the cart.
 */
export async function removeFromCart(itemId: string): Promise<CartActionResult> {
  return updateCartItem(itemId, 0);
}

/**
 * Clears all items from the cart.
 * Called after a successful order is placed.
 */
export async function clearCart(): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const admin = supabaseAdmin();

    let cartId: string | null = null;

    if (user) {
      const { data } = await admin
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      cartId = data?.id ?? null;
    } else {
      const anonymousId = await getAnonymousCartId();
      if (anonymousId) {
        const { data } = await admin
          .from("carts")
          .select("id")
          .eq("anonymous_id", anonymousId)
          .limit(1)
          .maybeSingle();
        cartId = data?.id ?? null;
      }
    }

    if (cartId) {
      await admin.from("cart_items").delete().eq("cart_id", cartId);
    }

    revalidatePath("/", "layout");
  } catch (err) {
    console.error("[clearCart]", err);
  }
}

/**
 * Merges a guest cart into an authenticated user's cart.
 * Called from the auth callback after sign-in.
 *
 * Merge strategy:
 *  - If user has no cart: reassign guest cart to user (set user_id, clear anonymous_id)
 *  - If user has a cart: merge items (add quantities, cap at stock), delete guest cart
 *
 * After merge, the anonymous cart cookie is cleared.
 */
export async function mergeGuestCart(userId: string): Promise<void> {
  try {
    const anonymousId = await getAnonymousCartId();
    if (!anonymousId) return; // No guest cart to merge

    const admin = supabaseAdmin();

    // Find guest cart
    const { data: guestCart } = await admin
      .from("carts")
      .select("id")
      .eq("anonymous_id", anonymousId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!guestCart) {
      await clearAnonymousCartId();
      return;
    }

    // Find user's existing cart
    const { data: userCart } = await admin
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!userCart) {
      // No user cart: take ownership of the guest cart
      await admin
        .from("carts")
        .update({ user_id: userId, anonymous_id: null, expires_at: cartExpiresAt() })
        .eq("id", guestCart.id);
    } else {
      // Merge guest items into user cart
      const { data: guestItems } = await admin
        .from("cart_items")
        .select("product_id, quantity")
        .eq("cart_id", guestCart.id);

      if (guestItems) {
        for (const guestItem of guestItems) {
          const { data: existing } = await admin
            .from("cart_items")
            .select("id, quantity")
            .eq("cart_id", userCart.id)
            .eq("product_id", guestItem.product_id)
            .maybeSingle();

          // Check stock
          const { data: product } = await admin
            .from("public_products")
            .select("quantity")
            .eq("id", guestItem.product_id)
            .single();

          const maxQty = product?.quantity ?? 0;

          if (existing) {
            const mergedQty = Math.min(existing.quantity + guestItem.quantity, maxQty);
            await admin
              .from("cart_items")
              .update({ quantity: mergedQty })
              .eq("id", existing.id);
          } else {
            const qty = Math.min(guestItem.quantity, maxQty);
            if (qty > 0) {
              await admin
                .from("cart_items")
                .insert({ cart_id: userCart.id, product_id: guestItem.product_id, quantity: qty });
            }
          }
        }
      }

      // Delete the guest cart
      await admin.from("carts").delete().eq("id", guestCart.id);
    }

    await clearAnonymousCartId();
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("[mergeGuestCart]", err);
  }
}

// ─── Ownership validation ─────────────────────────────────────────────────────

/**
 * Verifies that a cart belongs to the current session (user or guest).
 * Prevents IDOR attacks on cart item updates.
 */
async function verifyCartOwnership(
  cartId: string,
  userId: string | null,
): Promise<boolean> {
  const admin = supabaseAdmin();

  const { data: cart } = await admin
    .from("carts")
    .select("user_id, anonymous_id")
    .eq("id", cartId)
    .single();

  if (!cart) return false;

  if (userId) {
    return cart.user_id === userId;
  }

  // Guest: verify against cookie
  const anonymousId = await getAnonymousCartId();
  return cart.anonymous_id === anonymousId;
}
