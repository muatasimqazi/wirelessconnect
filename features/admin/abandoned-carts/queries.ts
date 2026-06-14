/**
 * Admin abandoned cart queries.
 *
 * An "abandoned cart" is a cart belonging to an authenticated user that has
 * at least one item and whose most-recently-modified item is older than the
 * specified threshold. Guest carts (no user_id) are excluded because we have
 * no email address to contact them with.
 *
 * cart_items.updated_at is set by the set_cart_items_updated_at trigger
 * (migration 012) on every INSERT and UPDATE, so MAX(updated_at) reflects
 * the last time the customer touched any item in the cart.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface AbandonedCartItem {
  id: string;
  productId: string;
  title: string;
  slug: string;
  price: number;
  quantity: number;
}

export interface AbandonedCart {
  cartId: string;
  userId: string;
  email: string;
  fullName: string | null;
  /** ISO timestamp of the most recently modified cart item */
  lastActivity: string;
  itemCount: number;
  /** Sum of (price × quantity) in cents */
  estimatedValue: number;
  items: AbandonedCartItem[];
}

export async function getAbandonedCarts(hoursOld = 24): Promise<AbandonedCart[]> {
  const admin = supabaseAdmin();
  const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();

  // Fetch all authenticated carts with their items + product info
  const { data: cartsData, error } = await admin
    .from("carts")
    .select(`
      id,
      user_id,
      cart_items (
        id,
        product_id,
        quantity,
        updated_at,
        products ( title, price, slug )
      )
    `)
    .not("user_id", "is", null);

  if (error || !cartsData) return [];

  type RawProduct = { title: string | null; price: number | null; slug: string | null } | null;
  type RawItem = { id: string; product_id: string; quantity: number; updated_at: string; products: RawProduct };
  type RawCart = { id: string; user_id: string | null; cart_items: RawItem[] };

  // Filter: must have items AND max updated_at < cutoff
  const abandoned = (cartsData as RawCart[]).filter((cart) => {
    if (!cart.cart_items?.length) return false;
    const maxUpdated = Math.max(...cart.cart_items.map((i) => new Date(i.updated_at).getTime()));
    return maxUpdated < new Date(cutoff).getTime();
  });

  if (!abandoned.length) return [];

  // Fetch profile info for the relevant users
  const userIds = abandoned.map((c) => c.user_id as string);
  const { data: profilesData } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  const profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]));

  return abandoned
    .flatMap((cart) => {
      const profile = profileMap.get(cart.user_id as string);
      if (!profile) return [];

      const items = cart.cart_items;
      const lastActivity = items.reduce(
        (max, i) => (i.updated_at > max ? i.updated_at : max),
        items[0].updated_at,
      );
      const estimatedValue = items.reduce((sum, i) => {
        return sum + (i.products?.price ?? 0) * i.quantity;
      }, 0);

      return [{
        cartId: cart.id,
        userId: cart.user_id as string,
        email: profile.email,
        fullName: profile.full_name,
        lastActivity,
        itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
        estimatedValue,
        items: items.map((i) => ({
          id: i.id,
          productId: i.product_id,
          title: i.products?.title ?? "Deleted product",
          slug: i.products?.slug ?? "",
          price: i.products?.price ?? 0,
          quantity: i.quantity,
        })),
      }];
    })
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
}
