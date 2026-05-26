/**
 * Cart read functions — server-side only.
 *
 * Uses the admin client (service role) for all cart queries because:
 *  - Guest carts are identified by anonymous_id (not auth.uid()) — RLS can't cover this
 *  - Authenticated user carts are identified by user_id (could use RLS client,
 *    but keeping one client for consistency)
 *
 * Security: the anonymous_id is always sourced from our own httpOnly cookie,
 * never from user-supplied input.
 *
 * Cart item shape joins product data from public_products view so the client
 * gets everything it needs in one query.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAnonymousCartId } from "@/lib/cart/cart-id";
import { createClient } from "@/lib/supabase/server";

export interface CartItemWithProduct {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  // Joined product fields from public_products (safe — no IMEI/serial/cost)
  product: {
    id: string;
    title: string | null;
    slug: string | null;
    brand: string | null;
    model: string | null;
    storage: string | null;
    color: string | null;
    condition: string | null;
    price: number | null;
    compare_at_price: number | null;
    quantity: number | null;     // stock quantity
    sku: string | null;
    allow_pickup: boolean | null;
    allow_shipping: boolean | null;
    warranty_days: number | null;
    translations: unknown;
    // primary image (from product_images, fetched separately)
    image_url?: string | null;
  };
}

export interface CartData {
  id: string;
  items: CartItemWithProduct[];
  /** Sum of (price × quantity) for all items, in cents. */
  subtotal: number;
  /** Total number of individual items (sum of quantities). */
  itemCount: number;
}

const EMPTY_CART: Omit<CartData, "id"> = {
  items: [],
  subtotal: 0,
  itemCount: 0,
};

/**
 * Resolves the cart for the current session.
 *
 * Priority:
 *  1. Authenticated user → look up cart by user_id
 *  2. Guest → look up cart by anonymous_id cookie
 *
 * Returns null if no cart exists yet (created lazily on first add-to-cart).
 */
export async function getCart(): Promise<CartData | null> {
  // Check auth first
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = supabaseAdmin();

  let cartId: string | null = null;

  if (user) {
    // Authenticated: find cart by user_id
    const { data: cart } = await admin
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    cartId = cart?.id ?? null;
  } else {
    // Guest: find cart by anonymous_id cookie
    const anonymousId = await getAnonymousCartId();
    if (!anonymousId) return null;

    const { data: cart } = await admin
      .from("carts")
      .select("id")
      .eq("anonymous_id", anonymousId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    cartId = cart?.id ?? null;
  }

  if (!cartId) return null;

  return getCartById(cartId);
}

/**
 * Fetches full cart data (items + joined product details) by cart ID.
 * Used internally and after mutations to revalidate the cart state.
 */
export async function getCartById(cartId: string): Promise<CartData | null> {
  const admin = supabaseAdmin();

  // Fetch cart items with product data
  const { data: items, error } = await admin
    .from("cart_items")
    .select(`
      id,
      cart_id,
      product_id,
      quantity,
      product:product_id (
        id,
        title,
        slug,
        brand,
        model,
        storage,
        color,
        condition,
        price,
        compare_at_price,
        quantity,
        sku,
        allow_pickup,
        allow_shipping,
        warranty_days,
        translations
      )
    `)
    .eq("cart_id", cartId);

  if (error) {
    console.error("[getCartById]", error.message);
    return null;
  }

  if (!items || items.length === 0) {
    return { id: cartId, ...EMPTY_CART };
  }

  // Fetch primary images for all products in one query
  const productIds = items.map((i) => i.product_id).filter(Boolean);
  const { data: images } = await admin
    .from("product_images")
    .select("product_id, image_url")
    .in("product_id", productIds)
    .eq("is_primary", true);

  const imageMap = new Map(images?.map((img) => [img.product_id, img.image_url]) ?? []);

  // Build typed items
  const cartItems: CartItemWithProduct[] = items
    .filter((item) => item.product !== null)
    .map((item) => ({
      id: item.id,
      cart_id: item.cart_id,
      product_id: item.product_id,
      quantity: item.quantity,
      product: {
        ...(item.product as CartItemWithProduct["product"]),
        image_url: imageMap.get(item.product_id) ?? null,
      },
    }));

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.product.price ?? 0) * item.quantity;
  }, 0);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return { id: cartId, items: cartItems, subtotal, itemCount };
}
