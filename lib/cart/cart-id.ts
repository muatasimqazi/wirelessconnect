/**
 * Anonymous cart ID cookie management.
 *
 * Guest carts are identified by a random UUID stored in a httpOnly cookie.
 * The cookie is set server-side in Server Actions — never accessible to JS.
 *
 * Security model:
 *  - The UUID is cryptographically random (crypto.randomUUID())
 *  - httpOnly prevents XSS from reading the cookie
 *  - All cart operations validate the anonymous_id from this cookie server-side
 *  - The admin client (service role) is used for guest cart operations because
 *    anonymous users have no auth.uid() for RLS (by design — see migration 011 comments)
 */

import { cookies } from "next/headers";

const CART_COOKIE = "wc-cart-id";

/** 14-day lifetime for guest carts. */
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

/**
 * Returns the anonymous cart ID from the cookie, or null if not set.
 * Called in server actions to identify the guest cart.
 */
export async function getAnonymousCartId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/**
 * Sets a new anonymous cart ID in the cookie.
 * Called when creating a new guest cart.
 */
export async function setAnonymousCartId(id: string): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Clears the anonymous cart ID cookie.
 * Called after cart merging (guest → auth user) or cart abandonment.
 */
export async function clearAnonymousCartId(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}
