"use client";

import { useEffect } from "react";
import { useCart } from "@/context/cart-context";

/**
 * Resets the client-side cart state to empty on mount.
 * Rendered on the order confirmation page after the server has already
 * called clearCart() to wipe the DB rows.
 */
export function CartClearer() {
  const { clearCartState } = useCart();
  useEffect(() => {
    clearCartState();
  }, [clearCartState]);
  return null;
}
